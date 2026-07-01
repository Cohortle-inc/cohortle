const BackendSDK = require("../core/BackendSDK");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const JwtService = require("../services/JwtService");
const MailService = require("../services/MailService");
const ResendService = require("../services/ResendService");
const PasswordService = require("../services/PasswordService");
const ValidationService = require("../services/ValidationService");
const RoleValidationService = require("../services/RoleValidationService");
const RoleAssignmentService = require("../services/RoleAssignmentService");
const VerificationTokenService = require("../services/VerificationTokenService");
const GoogleAuthService = require("../services/GoogleAuthService");
const { USER_STATUSES } = require("../utils/mappings");
const { UniqueConstraintError } = require("sequelize");
const db = require("../models");

/**
 * Helper function to get user with role name from database
 * @param {Object} where - Sequelize where clause (e.g., { email: 'user@example.com' } or { id: 123 })
 * @param {boolean} includePassword - Whether to include password field (default: false)
 * @returns {Promise<Object|null>} - User object with role name, or null if not found
 */
async function getUserWithRole(where, includePassword = false) {
  try {
    const attributes = ['id', 'email', 'email_verified', 'first_name', 'last_name', 'location', 'joined_at', 'socials', 'status', 'profile_image', 'role_id'];
    
    // Only include password if explicitly requested (for login)
    if (includePassword) {
      attributes.push('password');
    }
    
    const user = await db.users.findOne({
      where,
      attributes,
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name', 'role_id'],
        required: false // LEFT JOIN - user might not have a role yet
      }]
    });

    if (!user) {
      return null;
    }

    let roleName = 'unassigned';

    // First, try to get role from denormalized role_id field
    if (user.role && user.role.name) {
      roleName = user.role.name;
    } else if (user.role_id) {
      // If role_id is set but JOIN failed, query roles table directly
      const role = await db.roles.findByPk(user.role_id);
      if (role) {
        roleName = role.name;
      } else {
        console.warn(`[getUserWithRole] Role not found for role_id: ${user.role_id}, email: ${user.email}`);
      }
    }

    // If still unassigned, check user_role_assignments table for active assignments
    if (roleName === 'unassigned') {
      const activeAssignment = await db.user_role_assignments.findOne({
        where: {
          user_id: user.id,
          status: 'active',
          effective_from: {
            [db.Sequelize.Op.lte]: new Date()
          },
          [db.Sequelize.Op.or]: [
            { effective_until: null },
            { effective_until: { [db.Sequelize.Op.gte]: new Date() } }
          ]
        },
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id'],
          required: true
        }]
      });

      if (activeAssignment && activeAssignment.role) {
        roleName = activeAssignment.role.name;
        // Update denormalized role_id for future queries
        await db.users.update(
          { role_id: activeAssignment.role_id },
          { where: { id: user.id } }
        );
      } else {
        console.warn(`[getUserWithRole] No active role assignment found for user_id: ${user.id}, email: ${user.email}`);
      }
    }

    // Return user with role name as a string (for backward compatibility)
    // TEMPORARY: Hardcoded admin override for testaconvener@cohortle.com
    // This ensures the account always gets administrator role regardless of DB state
    if (user.email === 'testaconvener@cohortle.com') {
      roleName = 'administrator';
    }

    return {
      ...user.toJSON(),
      role: roleName
    };
  } catch (error) {
    console.error('Error getting user with role:', error);
    throw error;
  }
}

/**
 * Helper function to get permissions for a role
 * @param {string} roleName - Role name (e.g., 'student', 'convener', 'administrator')
 * @returns {Promise<Array<string>>} - Array of permission names
 */
async function getRolePermissions(roleName) {
  try {
    if (!roleName || roleName === 'unassigned') {
      return [];
    }

    const role = await db.roles.findOne({
      where: { name: roleName },
      include: [{
        model: db.permissions,
        as: 'permissions',
        through: { attributes: [] },
        attributes: ['name']
      }]
    });

    if (!role || !role.permissions) {
      return [];
    }

    return role.permissions.map(p => p.name);
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return [];
  }
}

/**
 * Determine role based on registration context
 * @param {string} email - User email
 * @param {string} invitationCode - Optional invitation code
 * @returns {Promise<object>} - Role determination result
 */
async function determineRoleFromContext(email, invitationCode) {
  // Check for invitation code (for convener role assignment)
  if (invitationCode) {
    // Check if it's the convener invitation code from environment
    const convenerInvitationCode = process.env.CONVENER_INVITATION_CODE || 'COHORTLE_CONVENER_2024';
    
    // Trim whitespace from both codes for comparison
    const trimmedInputCode = invitationCode.trim();
    const trimmedEnvCode = convenerInvitationCode.trim();
    
    // Log for debugging (remove in production after testing)
    console.log('Invitation code validation:', {
      input: trimmedInputCode,
      expected: trimmedEnvCode,
      match: trimmedInputCode === trimmedEnvCode
    });
    
    if (trimmedInputCode === trimmedEnvCode) {
      return {
        role: 'convener',
        reason: 'invitation_code',
        details: 'Valid convener invitation code provided'
      };
    }
    
    // Otherwise, check if it's a cohort enrollment code (for student enrollment)
    const sdk = new BackendSDK();
    sdk.setTable('cohorts');
    const cohort = await sdk.get({ enrollment_code: invitationCode });
    
    if (cohort && cohort.length > 0) {
      return {
        role: 'student',
        reason: 'cohort_enrollment_code',
        details: 'Valid cohort enrollment code provided - assigned student role'
      };
    } else {
      return {
        role: null,
        error: 'Invalid invitation code. For convener access, please contact an administrator. For student enrollment, check your cohort enrollment code.',
        code: 'INVALID_INVITATION_CODE'
      };
    }
  }

  // Default to student role for all registrations without invitation code
  // This supports non-formal education across Africa where users can register with any email
  return {
    role: 'student',
    reason: 'default',
    details: 'Default student role assignment for learner registration'
  };
}

/**
 * Validate role assignment parameters
 * @param {string} email - User email
 * @param {string} role - Requested role
 * @param {string} invitationCode - Optional invitation code
 * @returns {object} - Validation result
 */
function validateRoleAssignmentParameters(email, role, invitationCode) {
  // If explicit role is provided (backward compatibility)
  if (role) {
    const validRoles = ['learner', 'convener', 'student'];
    if (!validRoles.includes(role)) {
      return {
        valid: false,
        error: `Invalid role: ${role}. Role must be one of: learner, student, convener. For administrator role, please contact system support.`,
        code: 'INVALID_ROLE'
      };
    }

    // If convener role is requested without invitation code, reject
    if (role === 'convener' && !invitationCode) {
      return {
        valid: false,
        error: 'Convener role requires a valid invitation code. Please provide an invitation code or contact an administrator.',
        code: 'CONVENER_REQUIRES_INVITATION'
      };
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    };
  }

  return {
    valid: true
  };
}

/**
 * Helper function to create JWT token with role, permissions, and email verification status
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @param {boolean} emailVerified - Email verification status
 * @param {number} expiresIn - Token expiration time in milliseconds
 * @returns {Promise<string>} - JWT token
 */
async function createTokenWithRole(userId, email, role, emailVerified, expiresIn) {
  const permissions = await getRolePermissions(role);
  
  return JwtService.createAccessToken(
    {
      user_id: userId,
      email: email,
      role: role || 'unassigned',
      permissions: permissions,
      email_verified: emailVerified
    },
    expiresIn,
    process.env.JWT_SECRET
  );
}

/**
 * Find or create a user based on Google OAuth payload
 * @param {Object} payload - Google token payload
 * @param {string} payload.email - User email
 * @param {string} payload.sub - Google user ID
 * @param {string} payload.given_name - First name
 * @param {string} payload.family_name - Last name
 * @returns {Promise<Object>} - User object with role
 */
async function findOrCreateGoogleUser({ email, sub, given_name, family_name }) {
  // look up by email
  const existing = await db.users.findOne({ where: { email } });

  if (!existing) {
    // New user — create with google_id, no password
    const newUser = await db.users.create({
      email,
      first_name: given_name || '',
      last_name: family_name || '',
      google_id: sub,
      password: null,
      email_verified: 1,
      status: 'active',
      joined_at: new Date(),
    });
    // Assign student role
    await RoleAssignmentService.assignRole(newUser.id, 'student', 'system');
    return getUserWithRole({ id: newUser.id });
  }

  if (existing.google_id === sub) {
    // Returning Google user
    return getUserWithRole({ id: existing.id });
  }

  // Existing email/password user — link Google account
  await db.users.update(
    { google_id: sub, email_verified: 1 },
    { where: { id: existing.id } }
  );
  return getUserWithRole({ id: existing.id });
}

/**
 * Middleware to detect and handle role conflicts between JWT token and database
 * If role in token doesn't match database, automatically refresh the token
 */
async function detectAndRefreshRoleConflict(req, res, next) {
  try {
    // Only check if user is authenticated
    if (!req.user_id) {
      return next();
    }

    // Get current role from database
    const currentRole = await RoleValidationService.getUserRole(req.user_id);
    
    // If no role in database, continue (user might be in registration process)
    if (!currentRole) {
      return next();
    }

    // Check if token role matches database role
    if (req.role !== currentRole) {
      console.log(`Role conflict detected for user ${req.user_id}: token=${req.role}, database=${currentRole}`);
      
      // Get user with role from database
      const user = await getUserWithRole({ id: req.user_id });
      
      if (!user) {
        return next();
      }

      // Create new token with updated role
      const newToken = await createTokenWithRole(
        req.user_id,
        user.email,
        currentRole,
        user.email_verified === 1, // Pass email verification status
        24 * 60 * 60 * 1000 // 24 hours
      );

      // Update request with new role and permissions
      const newPermissions = await getRolePermissions(currentRole);
      req.role = currentRole;
      req.permissions = newPermissions;
      
      // Set flag to indicate token was refreshed
      req.token_refreshed = true;
      req.new_token = newToken;
      
      // Add new token to response header for client to update
      res.setHeader('X-New-Token', newToken);
      res.setHeader('X-Token-Refreshed', 'true');
    }

    next();
  } catch (error) {
    console.error('Error in detectAndRefreshRoleConflict:', error);
    // Don't fail the request, just log the error and continue
    next();
  }
}

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/auth/register-email:
   *   post:
   *     summary: Register a new user with email and password
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - first_name
   *               - last_name
   *             properties:
   *               email:
   *                 type: string
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: StrongPassword123
   *               first_name:
   *                 type: string
   *                 example: John
   *               last_name:
   *                 type: string
   *                 example: Doe
   *               invitation_code:
   *                 type: string
   *                 description: Optional invitation code for convener role assignment
   *                 example: ABC123
   *               role:
   *                 type: string
   *                 enum: [learner, convener, student]
   *                 description: Optional role override (deprecated - use invitation_code instead)
   *                 example: learner
   *     responses:
   *       200:
   *         description: Registration successful, verification email sent
   *       400:
   *         description: Invalid input or email already used
   */
  app.post(
    "/v1/api/auth/register-email",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { email, password, first_name, last_name, role, invitation_code } = req.body;

        // validate email, password (role is now optional)
        const validationResult = await ValidationService.validateObject(
          {
            email: "required|email",
            password: "required|string",
            first_name: "required|string",
            last_name: "required|string",
            invitation_code: "string", // optional
            role: "in:learner,convener,student", // optional, for backward compatibility
          },
          { email, password, first_name, last_name, invitation_code, role },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        // Additional role assignment validation
        // TEMPORARY: Allow convener signup without invitation code for initial setup
        // TODO: Re-enable invitation code requirement after initial conveners are created
        const roleValidation = validateRoleAssignmentParameters(email, role, invitation_code);
        if (!roleValidation.valid && roleValidation.code !== 'CONVENER_REQUIRES_INVITATION') {
          return res.status(400).json({
            error: true,
            message: roleValidation.error,
            code: roleValidation.code
          });
        }

        const sdk = new BackendSDK();

        // check if email already exists
        sdk.setTable("users");
        const existing = await sdk.get({ email });
        if (existing.length > 0) {
          return res
            .status(400)
            .json({ error: true, message: "Email already in use" });
        }

        // Determine role based on context (invitation code, email domain, or default)
        let assignedRole;
        let roleAssignmentReason;
        
        if (invitation_code) {
          // Check invitation code for convener role
          const roleResult = await determineRoleFromContext(email, invitation_code);
          
          if (roleResult.error) {
            return res.status(400).json({
              error: true,
              message: roleResult.error,
              code: roleResult.code
            });
          }
          
          assignedRole = roleResult.role;
          roleAssignmentReason = roleResult.details;
        } else if (role) {
          // Backward compatibility: use provided role if no invitation code
          // Map 'learner' to 'student' for consistency
          assignedRole = role === 'learner' ? 'student' : role;
          roleAssignmentReason = role === 'convener' 
            ? 'Convener role selected during registration (invitation code requirement temporarily disabled)'
            : 'Explicit role provided during registration';
        } else {
          // Automatic role determination based on email domain
          const roleResult = await determineRoleFromContext(email, null);
          assignedRole = roleResult.role;
          roleAssignmentReason = roleResult.details;
        }

        // hash password
        const hashedPassword = await PasswordService.hash(password);

        // create new user without role (will be assigned via RoleAssignmentService)
        const newUserId = await sdk.insert({
          email,
          password: hashedPassword,
          first_name,
          last_name,
          status: USER_STATUSES.INACTIVE,
          joined_at: new Date(), // Set joined_at to current timestamp
        });

        // Assign role using RoleAssignmentService for proper audit trail
        const roleAssignment = await RoleAssignmentService.assignRole(
          newUserId,
          assignedRole,
          null, // System assignment (no admin)
          {
            notes: roleAssignmentReason
          }
        );

        if (!roleAssignment.success) {
          // Role assignment failed - this is critical for new users
          console.error('Failed to assign role during registration:', roleAssignment.error);
          
          // Try to manually set role_id as fallback
          try {
            const role = await db.roles.findOne({ where: { name: assignedRole } });
            if (role) {
              await db.users.update(
                { role_id: role.role_id },
                { where: { id: newUserId } }
              );
              console.log(`Fallback: Manually set role_id for user ${newUserId}`);
            }
          } catch (fallbackError) {
            console.error('Fallback role assignment also failed:', fallbackError);
            // Continue anyway - user can be assigned role later by admin
          }
        }

        // create default preferences
        sdk.setTable("preferences");
        await sdk.insert({
          email_updates: 1,
          new_posts: 1,
          new_course_content: 1,
          new_polls: 1,
          mentions: 0,
          replies_on_post: 0,
          user_id: newUserId,
        });

        // MVP MODE: Check if email verification is required
        const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
        let verificationLink = null;
        
        if (requireVerification) {
          // Generate verification token for email verification
          const verificationToken = await VerificationTokenService.generateToken(newUserId);
          
          // Create verification link with token
          verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
          console.log("verification link", verificationLink);
        }

        // Send welcome email (with or without verification link based on MVP mode)
        const emailResult = await ResendService.sendEmail({
          to: email,
          type: 'welcome',
          data: {
            first_name: first_name,
            verification_link: verificationLink
          }
        });

        if (emailResult.error) {
          console.error('Failed to send welcome email:', emailResult.message);
          // Don't fail registration if email fails - user can still verify later
        }

        // Create JWT token for immediate authentication
        // In MVP mode (verification disabled), set email_verified to true
        const token = await createTokenWithRole(
          newUserId,
          email,
          assignedRole,
          !requireVerification, // email_verified = true if verification disabled, false otherwise
          24 * 60 * 60 * 1000 // 24 hours
        );

        // add user to "New signups" audience in Resend
        const audienceResult = await ResendService.addToAudience({
          email: email,
          firstName: first_name,
          lastName: last_name
        });

        if (audienceResult.error) {
          console.error('Failed to add user to audience:', audienceResult.message);
          // Don't fail registration if audience addition fails
        }

        const successMessage = requireVerification 
          ? "User registered successfully. Verification email sent."
          : "User registered successfully. Welcome to Cohortle!";

        return res.status(200).json({
          error: false,
          message: successMessage,
          token,
          user: {
            id: newUserId,
            email: email,
            role: assignedRole,
            role_assignment_reason: roleAssignmentReason
          }
        });
      } catch (err) {
        if (
          err instanceof UniqueConstraintError &&
          err.errors[0].path === "email"
        ) {
          return res.status(400).json({
            error: true,
            message: "Email already in use",
          });
        }
        console.error(err);
        res.status(500).json({ error: true, message: "Something went wrong" });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/auth/verify-email:
   *   post:
   *     summary: Verify user email using verification token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *                 example: a1b2c3d4e5f6...
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       400:
   *         description: Invalid request or token already used
   *       401:
   *         description: Invalid or expired token
   *       404:
   *         description: User not found
   */
  app.post(
    "/v1/api/auth/verify-email",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { token } = req.body;
        
        // Validate request
        const validationResult = await ValidationService.validateObject(
          { token: "required|string" },
          { token },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        // Validate token using VerificationTokenService
        const tokenValidation = await VerificationTokenService.validateToken(token);
        
        if (!tokenValidation.valid) {
          // Return specific error messages based on validation failure
          let statusCode = 401;
          let message = tokenValidation.error;
          
          if (tokenValidation.error === 'Token not found') {
            message = 'This verification link is invalid. Please request a new verification email.';
          } else if (tokenValidation.error === 'Token expired') {
            message = 'This verification link has expired. Verification links are valid for 24 hours.';
          } else if (tokenValidation.error === 'Token already used') {
            statusCode = 400;
            message = 'This verification link has already been used. If you haven\'t verified your email, please request a new link.';
          } else if (tokenValidation.error === 'User not found') {
            statusCode = 404;
            message = 'User account not found. Please contact support.';
          }
          
          return res.status(statusCode).json({ 
            error: true, 
            message: message 
          });
        }

        // Get user with role from database
        const user = await getUserWithRole({ id: tokenValidation.userId });
        if (!user) {
          return res.status(404).json({ 
            error: true, 
            message: "User not found" 
          });
        }

        // Check if already verified (idempotent operation)
        if (user.email_verified === 1) {
          return res.status(200).json({
            error: false,
            message: "Your email is already verified. You can now access all features.",
            token: await createTokenWithRole(
              user.id,
              user.email,
              user.role || 'unassigned',
              true, // email_verified = true
              24 * 60 * 60 * 1000
            ),
            user: {
              id: user.id,
              email: user.email,
              email_verified: true,
              role: user.role
            }
          });
        }

        // Update email_verified status
        await db.users.update(
          { email_verified: 1 },
          { where: { id: user.id } }
        );

        // Invalidate the token after successful verification
        await VerificationTokenService.invalidateToken(token);

        // Create new JWT with email_verified: true
        const newToken = await createTokenWithRole(
          user.id,
          user.email,
          user.role || 'unassigned',
          true, // email_verified = true
          24 * 60 * 60 * 1000
        );

        return res.status(200).json({
          error: false,
          message: "Email verified successfully",
          token: newToken,
          user: {
            id: user.id,
            email: user.email,
            email_verified: true,
            role: user.role
          }
        });
      } catch (err) {
        console.error('Error verifying email:', err);
        res.status(500).json({ 
          error: true, 
          message: "Something went wrong during email verification" 
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/auth/resend-verification:
   *   post:
   *     summary: Resend verification email to authenticated user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     description: Generates a new verification token and sends a new verification email. Rate limited to 3 requests per hour.
   *     responses:
   *       200:
   *         description: Verification email sent successfully
   *       400:
   *         description: User already verified
   *       401:
   *         description: Not authenticated
   *       429:
   *         description: Rate limit exceeded
   *       500:
   *         description: Server error
   */
  app.post(
    "/v1/api/auth/resend-verification",
    [UrlMiddleware, JwtService.verifyTokenMiddleware(process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        // Get user from database
        const user = await getUserWithRole({ id: req.user_id });
        
        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found"
          });
        }

        // Check if user is already verified
        if (user.email_verified === 1) {
          return res.status(400).json({
            error: true,
            message: "Your email is already verified"
          });
        }

        // Rate limiting: Check how many verification emails sent in the last hour
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
        const recentTokens = await db.verification_tokens.count({
          where: {
            user_id: req.user_id,
            created_at: {
              [db.Sequelize.Op.gte]: oneHourAgo
            }
          }
        });

        if (recentTokens >= 3) {
          return res.status(429).json({
            error: true,
            message: "Too many verification emails requested. Please wait before requesting another."
          });
        }

        // Generate new verification token (this also invalidates old tokens)
        const verificationToken = await VerificationTokenService.generateToken(req.user_id);
        
        // Create verification link
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        // Send verification email
        const emailResult = await ResendService.sendEmail({
          to: user.email,
          type: 'verification_resend',
          data: {
            first_name: user.first_name,
            verification_link: verificationLink
          }
        });

        if (emailResult.error) {
          console.error('Failed to send verification email:', emailResult.message);
          return res.status(500).json({
            error: true,
            message: 'Failed to send verification email. Please try again later.'
          });
        }

        return res.status(200).json({
          error: false,
          message: "Verification email sent successfully. Please check your inbox."
        });
      } catch (err) {
        console.error('Error resending verification email:', err);
        res.status(500).json({ 
          error: true, 
          message: "Something went wrong while sending verification email" 
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/auth/login:
   *   post:
   *     summary: Log in user with email and password
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: StrongPassword123
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  app.post("/v1/api/auth/login", [UrlMiddleware], async function (req, res) {
    try {
      const { email, password } = req.body;
      const validationResult = await ValidationService.validateObject(
        { email: "required|email", password: "required|string" },
        { email, password },
      );
      if (validationResult.error) return res.status(400).json(validationResult);

      // Get user with role from database (include password for login)
      const user = await getUserWithRole({ email }, true);
      if (!user)
        return res
          .status(401)
          .json({ error: true, message: "email and password does not match" });

      const isValid = await PasswordService.compareHash(
        password,
        user.password,
      );
      if (!isValid)
        return res
          .status(401)
          .json({ error: true, message: "email and password does not match" });

      const token = await createTokenWithRole(
        user.id,
        user.email,
        user.role || 'unassigned',
        user.email_verified === 1, // Pass email verification status
        24 * 60 * 60 * 1000
      );

      return res.status(200).json({
        error: false,
        message: "login successfully",
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          email_verified: user.email_verified === 1
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: "something went wrong" });
    }
  });

  /**
   * @swagger
   * /v1/api/auth/forgot-password:
   *   post:
   *     summary: Request a password reset link
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 example: user@example.com
   *     responses:
   *       200:
   *         description: Password reset link sent
   *       401:
   *         description: Email not registered
   */
  app.post(
    "/v1/api/auth/forgot-password",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { email } = req.body;
        const validationResult = await ValidationService.validateObject(
          { email: "required|email" },
          { email },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        // Get user with role from database
        const user = await getUserWithRole({ email });
        if (!user)
          return res
            .status(401)
            .json({ error: true, message: "email not registered" });

        const token = await createTokenWithRole(
          user.id,
          user.email,
          user.role || 'unassigned',
          user.email_verified === 1, // Pass email verification status
          60 * 60 * 1000 // 1 hour expiry for password reset
        );

        const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        console.log("reset password link", link);

        const emailResult = await ResendService.sendEmail({
          to: email,
          type: 'password_reset',
          data: {
            first_name: user.first_name,
            reset_link: link
          }
        });

        if (emailResult.error) {
          console.error('Failed to send password reset email:', emailResult.message);
          return res.status(500).json({
            error: true,
            message: 'Failed to send password reset email. Please try again later.'
          });
        }

        return res.status(200).json({
          error: false,
          message: "password reset requested",
          link,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "something went wrong" });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/auth/reset-password:
   *   post:
   *     summary: Reset password using token
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *                 example: NewStrongPassword123
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       401:
   *         description: Unauthorized or invalid token
   */
  app.post(
    "/v1/api/auth/reset-password",
    [UrlMiddleware, JwtService.verifyTokenMiddleware(process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const { password } = req.body;
        const validationResult = await ValidationService.validateObject(
          { password: "required|string" },
          { password },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("users");
        const user = (await sdk.get({ id: req.user_id }))[0];
        if (!user)
          return res
            .status(401)
            .json({ error: true, message: "email not registered" });

        const hashedPassword = await PasswordService.hash(password);
        sdk.setTable("users");
        await sdk.update({ password: hashedPassword }, req.user_id);

        return res.status(200).json({
          error: false,
          message: "password reset successfully",
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "something went wrong" });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/auth/refresh-token:
   *   post:
   *     summary: Refresh JWT token with updated role and permissions
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     description: Validates current token and issues new token with current role from database. Use when role conflict is detected.
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Token refreshed successfully
   *                 token:
   *                   type: string
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                     email:
   *                       type: string
   *                     role:
   *                       type: string
   *                     permissions:
   *                       type: array
   *                       items:
   *                         type: string
   *       401:
   *         description: Unauthorized or invalid token
   */
  app.post(
    "/v1/api/auth/refresh-token",
    [UrlMiddleware, JwtService.verifyTokenMiddleware(process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        // Get current role from database
        const currentRole = await RoleValidationService.getUserRole(req.user_id);
        
        if (!currentRole) {
          return res.status(404).json({
            error: true,
            message: "User role not found in database"
          });
        }

        // Get user details with role
        const user = await getUserWithRole({ id: req.user_id });
        
        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found"
          });
        }

        // Create new token with current role and permissions
        const newToken = await createTokenWithRole(
          req.user_id,
          user.email,
          currentRole,
          user.email_verified === 1, // Pass email verification status
          24 * 60 * 60 * 1000 // 24 hours
        );

        const permissions = await getRolePermissions(currentRole);

        // Check if role changed
        const roleChanged = req.role !== currentRole;

        return res.status(200).json({
          error: false,
          message: roleChanged 
            ? `Token refreshed successfully. Role updated from ${req.role} to ${currentRole}`
            : "Token refreshed successfully",
          token: newToken,
          role_changed: roleChanged,
          previous_role: roleChanged ? req.role : null,
          user: {
            id: user.id,
            email: user.email,
            role: currentRole,
            permissions: permissions
          }
        });
      } catch (err) {
        console.error('Error refreshing token:', err);
        res.status(500).json({ 
          error: true, 
          message: "Failed to refresh token" 
        });
      }
    },
  );

  app.post('/v1/api/auth/google', [UrlMiddleware], async function (req, res) {
    try {
      const { google_id_token } = req.body;

      if (!google_id_token) {
        return res.status(400).json({ error: true, message: 'google_id_token is required' });
      }

      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('[Google Auth] GOOGLE_CLIENT_ID is not configured');
        return res.status(503).json({ error: true, message: 'Google authentication is not configured' });
      }

      let payload;
      try {
        payload = await GoogleAuthService.verifyIdToken(google_id_token);
      } catch (err) {
        console.error('[Google Auth] Token verification failed:', err.message);
        return res.status(401).json({ error: true, message: 'Invalid or expired Google token' });
      }

      const user = await findOrCreateGoogleUser(payload);

      const token = await createTokenWithRole(
        user.id,
        user.email,
        user.role,
        user.email_verified === 1,
        24 * 60 * 60 * 1000
      );

      return res.status(200).json({ error: false, token, user });
    } catch (err) {
      console.error('[Google Auth] Unexpected error:', err);
      return res.status(500).json({ error: true, message: 'Something went wrong' });
    }
  });

  return [];
};
