const JwtService = require('../../services/JwtService');

describe('JwtService - Enhanced Role Validation', () => {
  const testSecret = 'test-secret-key';
  let testToken;
  let testUserId;
  let testEmail;

  beforeEach(() => {
    testUserId = 123;
    testEmail = 'test@example.com';
  });

  describe('Token Creation with Role and Permissions', () => {
    it('should create token with role and permissions', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['create_programme', 'manage_cohorts']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = JwtService.verifyAccessToken(token, testSecret);
      expect(decoded.user_id).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.role).toBe('convener');
      expect(decoded.permissions).toEqual(['create_programme', 'manage_cohorts']);
    });

    it('should create token with empty permissions for unassigned role', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'unassigned',
        permissions: []
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const decoded = JwtService.verifyAccessToken(token, testSecret);
      
      expect(decoded.role).toBe('unassigned');
      expect(decoded.permissions).toEqual([]);
    });
  });

  describe('verifyTokenMiddleware - Enhanced', () => {
    it('should extract role and permissions from token', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'student',
        permissions: ['view_lessons', 'complete_lessons']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyTokenMiddleware(testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.user_id).toBe(testUserId);
      expect(req.role).toBe('student');
      expect(req.permissions).toEqual(['view_lessons', 'complete_lessons']);
      expect(req.email).toBe(testEmail);
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing permissions gracefully', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'student'
        // No permissions field
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyTokenMiddleware(testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.permissions).toEqual([]);
      expect(next).toHaveBeenCalled();
    });

    it('should read auth_token cookie when access_token is not present', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'student',
        permissions: ['view_lessons']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyTokenMiddleware(testSecret);

      const req = {
        cookies: {
          auth_token: token
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.user_id).toBe(testUserId);
      expect(req.role).toBe('student');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyRoleMiddleware', () => {
    it('should allow access when user has required role', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['create_programme']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('convener', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.role).toBe('convener');
    });

    it('should allow access when user has one of multiple required roles', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['create_programme']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware(['convener', 'administrator'], testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow administrator to access convener routes (role hierarchy)', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'administrator',
        permissions: ['manage_users', 'create_programme']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('convener', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user lacks required role', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'student',
        permissions: ['view_lessons']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('convener', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: true,
          code: 'ROLE_REQUIRED',
          details: expect.objectContaining({
            required_roles: ['convener'],
            user_role: 'student'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user has unassigned role', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'unassigned',
        permissions: []
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('student', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ROLE_REQUIRED',
          message: expect.stringContaining('No role assigned')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is missing', () => {
      const middleware = JwtService.verifyRoleMiddleware('convener', testSecret);

      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['create_programme']
      };

      // Create token that expires in 1 second
      const token = JwtService.createAccessToken(payload, 1000, testSecret);
      
      // Wait for token to expire
      return new Promise(resolve => setTimeout(resolve, 1100)).then(() => {
        const middleware = JwtService.verifyRoleMiddleware('convener', testSecret);

        const req = {
          headers: {
            authorization: `Bearer ${token}`
          }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'TOKEN_EXPIRED'
          })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('verifyPermissionMiddleware', () => {
    it('should allow access when user has required permission', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['create_programme', 'manage_cohorts']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyPermissionMiddleware('create_programme', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.permissions).toContain('create_programme');
    });

    it('should allow access when user has one of multiple required permissions', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['manage_cohorts']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyPermissionMiddleware(
        ['create_programme', 'manage_cohorts'],
        testSecret
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user lacks required permission', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'student',
        permissions: ['view_lessons']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyPermissionMiddleware('create_programme', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: true,
          code: 'PERMISSION_REQUIRED',
          details: expect.objectContaining({
            required_permissions: ['create_programme'],
            user_permissions: ['view_lessons']
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user has no permissions', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'unassigned',
        permissions: []
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyPermissionMiddleware('view_lessons', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'PERMISSION_REQUIRED'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role Hierarchy', () => {
    it('should allow administrator to access student routes', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'administrator',
        permissions: ['manage_users', 'view_lessons']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('student', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow convener to access student routes', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['create_programme', 'view_lessons']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('student', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should not allow student to access convener routes', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'student',
        permissions: ['view_lessons']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('convener', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should not allow convener to access administrator routes', () => {
      const payload = {
        user_id: testUserId,
        email: testEmail,
        role: 'convener',
        permissions: ['create_programme']
      };

      const token = JwtService.createAccessToken(payload, 3600000, testSecret);
      const middleware = JwtService.verifyRoleMiddleware('administrator', testSecret);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
