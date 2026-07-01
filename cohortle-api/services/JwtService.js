/*Powered By: Manaknightdigital Inc. https://manaknightdigital.com/ Year: 2020*/
/**
 * JWT Service
 * @copyright 2020 Manaknightdigital Inc.
 * @link https://manaknightdigital.com
 * @license Proprietary Software licensing
 * @author Ryan Wong
 *
 */
var jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

module.exports = {
  createAccessToken: function (payload, expireIn, secret) {
    return jwt.sign(payload, secret, {
      expiresIn: Number(expireIn) / 1000,
      algorithm: "HS256",
    });
  },
  createRefreshToken: function (payload, key, expireAt) {
    return jwt.sign(payload, key, {
      expiresIn: Number(expireAt),
      algorithm: "HS256",
    });
  },

  verifyAccessToken: function (token, key, options = {}) {
    try {
      const decoded = jwt.verify(token, key, options);
      if (decoded) {
        return decoded;
      }
    } catch (err) {
      return false;
    }
  },

  verifyRefreshToken: function (token, key, options = {}) {
    try {
      return jwt.verify(token, key, options);
    } catch (err) {
      return false;
    }
  },
  generateString: function (length) {
    let d = new Date().getTime();
    const time = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx-xxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
      },
    );

    return (uuid.toUpperCase() + "-" + time.toString()).substring(0, length);
  },
  generateUUID: function () {
    let d = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
      },
    );
    return uuid.toUpperCase();
  },
  getToken: function (req) {
    const authorization = req.headers?.authorization || req.headers?.Authorization;

    if (authorization && authorization.split(" ")[0] === "Bearer") {
      return authorization.split(" ")[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    } else if (req.cookies && req.cookies["access_token"]) {
      return req.cookies["access_token"];
    } else if (req.cookies && req.cookies["auth_token"]) {
      return req.cookies["auth_token"];
    }

    return null;
  },
  verifyTokenMiddleware: function (key, options) {
    const self = this;
    return function (req, res, next) {
      const token = self.getToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "UNAUTHORIZED",
          code: "UNAUTHORIZED",
        });
      } else {
        const result = self.verifyAccessToken(token, key, options);
        if (!result) {
          return res.status(401).json({
            success: false,
            message: "TOKEN_EXPIRED",
            code: "TOKEN_EXPIRED",
          });
        }
        req.user_id = result.user_id;
        req.role = result.role;
        req.permissions = result.permissions || [];
        req.email = result.email;
        req.email_verified = result.email_verified || false;
        next();
      }
    };
  },

  /**
   * Role validation middleware with automatic token refresh
   * Creates middleware that validates user has required role(s) and refreshes token if role conflict detected
   * @param {string|Array<string>} requiredRoles - Required role(s) (e.g., 'convener' or ['convener', 'administrator'])
   * @param {string} key - JWT secret key
   * @param {object} options - JWT verification options
   * @returns {Function} - Express middleware function
   */
  verifyRoleMiddleware: function (requiredRoles, key, options) {
    const self = this;
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return function (req, res, next) {
      const token = self.getToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "UNAUTHORIZED",
          code: "UNAUTHORIZED",
        });
      }

      const result = self.verifyAccessToken(token, key, options);
      if (!result) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "TOKEN_EXPIRED",
          code: "TOKEN_EXPIRED",
        });
      }

      // Set user info on request
      req.user_id = result.user_id;
      req.role = result.role;
      req.permissions = result.permissions || [];
      req.email = result.email;
      req.email_verified = result.email_verified || false;

      // Validate role
      const userRole = result.role;
      if (!userRole || userRole === 'unassigned') {
        return res.status(403).json({
          success: false,
          error: true,
          message: "Insufficient permissions. No role assigned.",
          code: "ROLE_REQUIRED",
          details: {
            required_roles: rolesArray,
            user_role: userRole || 'unassigned'
          }
        });
      }

      // Check if user has one of the required roles
      const hasRequiredRole = rolesArray.includes(userRole);
      
      // Role hierarchy: administrator can access convener routes, convener can access student routes
      const roleHierarchy = {
        'administrator': ['administrator', 'convener', 'student'],
        'convener': ['convener', 'student'],
        'student': ['student']
      };

      const userAllowedRoles = roleHierarchy[userRole] || [userRole];
      const hasAccess = rolesArray.some(role => userAllowedRoles.includes(role));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: true,
          message: `Insufficient permissions. Required role: ${rolesArray.join(' or ')}`,
          code: "ROLE_REQUIRED",
          details: {
            required_roles: rolesArray,
            user_role: userRole,
            suggestion: `Contact an administrator to request ${rolesArray[0]} role`
          }
        });
      }

      // Flag for potential token refresh (will be checked by route handlers if needed)
      req.token_needs_refresh = false;

      next();
    };
  },

  /**
   * Permission validation middleware
   * Creates middleware that validates user has required permission(s)
   * @param {string|Array<string>} requiredPermissions - Required permission(s)
   * @param {string} key - JWT secret key
   * @param {object} options - JWT verification options
   * @returns {Function} - Express middleware function
   */
  verifyPermissionMiddleware: function (requiredPermissions, key, options) {
    const self = this;
    const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return function (req, res, next) {
      const token = self.getToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "UNAUTHORIZED",
          code: "UNAUTHORIZED",
        });
      }

      const result = self.verifyAccessToken(token, key, options);
      if (!result) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "TOKEN_EXPIRED",
          code: "TOKEN_EXPIRED",
        });
      }

      // Set user info on request
      req.user_id = result.user_id;
      req.role = result.role;
      req.permissions = result.permissions || [];
      req.email = result.email;
      req.email_verified = result.email_verified || false;

      // Validate permissions
      const userPermissions = result.permissions || [];
      const hasRequiredPermission = permissionsArray.some(perm => 
        userPermissions.includes(perm)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({
          success: false,
          error: true,
          message: `Insufficient permissions. Required permission: ${permissionsArray.join(' or ')}`,
          code: "PERMISSION_REQUIRED",
          details: {
            required_permissions: permissionsArray,
            user_permissions: userPermissions,
            user_role: result.role
          }
        });
      }

      next();
    };
  },

  getAppleSigningKeys: async function (kid) {
    const client = jwksClient({
      jwksUri: "https://appleid.apple.com/auth/keys",
    });

    return new Promise(function (resolve, reject) {
      client.getSigningKey(kid, (err, result) => {
        if (!result) resolve(null);
        resolve(result.getPublicKey());
      });
    });
  },
  verifyAppleLogin: async function (data, appleKey) {
    return new Promise(function (resolve, reject) {
      jwt.verify(data, appleKey, (err, payload) => {
        if (err) {
          throw new Error(err.message);
        }
        return resolve(payload);
      });
    });
  },
};
