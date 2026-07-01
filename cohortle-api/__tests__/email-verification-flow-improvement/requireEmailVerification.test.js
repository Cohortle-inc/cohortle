/**
 * Unit tests for requireEmailVerification middleware
 * 
 * Tests access control enforcement for email verification
 * Requirements: 3.1, 3.2
 */

const requireEmailVerification = require('../../middleware/requireEmailVerification');

describe('requireEmailVerification middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user_id: 1,
      email: 'test@example.com',
      email_verified: false,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Verified users', () => {
    it('should allow verified users to access protected routes', () => {
      req.email_verified = true;

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next() without arguments for verified users', () => {
      req.email_verified = true;

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow verified users with email_verified = 1 (truthy)', () => {
      req.email_verified = 1;

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Unverified users', () => {
    it('should block unverified users with 403 error', () => {
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return correct error message for unverified users', () => {
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Please verify your email address to perform this action. Check your inbox for the verification email or request a new one.',
        code: 'EMAIL_VERIFICATION_REQUIRED',
        details: {
          action: 'verify_email',
          email: 'test@example.com',
        },
      });
    });

    it('should block users with email_verified = 0 (falsy)', () => {
      req.email_verified = 0;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should block users with email_verified = null', () => {
      req.email_verified = null;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should block users with email_verified = undefined', () => {
      req.email_verified = undefined;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should include user email in error details', () => {
      req.email = 'user@example.com';
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.details.email).toBe('user@example.com');
    });

    it('should include EMAIL_VERIFICATION_REQUIRED error code', () => {
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    });

    it('should include verify_email action in error details', () => {
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.details.action).toBe('verify_email');
    });
  });

  describe('Unauthenticated users', () => {
    it('should return 401 when user_id is missing', () => {
      req.user_id = null;
      req.email_verified = true;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return correct error message for unauthenticated users', () => {
      req.user_id = undefined;

      requireEmailVerification(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    });

    it('should return 401 when user_id is 0', () => {
      req.user_id = 0;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should check authentication before checking verification', () => {
      req.user_id = null;
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      // Should return 401 (unauthorized) not 403 (forbidden)
      expect(res.status).toHaveBeenCalledWith(401);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Error message content', () => {
    it('should provide actionable error message', () => {
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.message).toContain('verify your email');
      expect(jsonCall.message).toContain('Check your inbox');
      expect(jsonCall.message).toContain('request a new one');
    });

    it('should set error flag to true', () => {
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.error).toBe(true);
    });

    it('should include all required error response fields', () => {
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).toHaveProperty('error');
      expect(jsonCall).toHaveProperty('message');
      expect(jsonCall).toHaveProperty('code');
      expect(jsonCall).toHaveProperty('details');
      expect(jsonCall.details).toHaveProperty('action');
      expect(jsonCall.details).toHaveProperty('email');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing email field gracefully', () => {
      req.email = undefined;
      req.email_verified = false;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.details.email).toBeUndefined();
    });

    it('should not modify request object when blocking access', () => {
      req.email_verified = false;
      const originalReq = { ...req };

      requireEmailVerification(req, res, next);

      expect(req.user_id).toBe(originalReq.user_id);
      expect(req.email).toBe(originalReq.email);
      expect(req.email_verified).toBe(originalReq.email_verified);
    });

    it('should not modify request object when allowing access', () => {
      req.email_verified = true;
      const originalReq = { ...req };

      requireEmailVerification(req, res, next);

      expect(req.user_id).toBe(originalReq.user_id);
      expect(req.email).toBe(originalReq.email);
      expect(req.email_verified).toBe(originalReq.email_verified);
    });
  });

  describe('Integration with Express middleware chain', () => {
    it('should work as Express middleware', () => {
      expect(typeof requireEmailVerification).toBe('function');
      expect(requireEmailVerification.length).toBe(3); // req, res, next
    });

    it('should not throw errors when called', () => {
      req.email_verified = true;

      expect(() => {
        requireEmailVerification(req, res, next);
      }).not.toThrow();
    });

    it('should handle multiple sequential calls', () => {
      req.email_verified = true;

      requireEmailVerification(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset and call again
      next.mockClear();
      requireEmailVerification(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
