/**
 * Multi-Level Access Control Middleware Tests
 * 
 * Tests for route-level and resource-level access control integration
 * Requirements: 6.4
 */

const { multiLevelAccessControl, routeLevelAccessControl, resourceLevelAccessControl } = require('../../middleware/multiLevelAccessControl');
const JwtService = require('../../services/JwtService');
const RoleBasedAccessControlService = require('../../services/RoleBasedAccessControlService');

// Mock dependencies
jest.mock('../../services/JwtService');
jest.mock('../../services/RoleBasedAccessControlService');

describe('Multi-Level Access Control Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user_id: 1,
      role: 'convener',
      permissions: [],
      params: {},
      body: {},
      path: '/api/test',
      method: 'GET'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('multiLevelAccessControl', () => {
    it('should throw error if requiredRoles is not provided', () => {
      expect(() => {
        multiLevelAccessControl({});
      }).toThrow('requiredRoles is required');
    });

    it('should throw error if resource params missing when skipResourceCheck is false', () => {
      expect(() => {
        multiLevelAccessControl({
          requiredRoles: 'convener',
          skipResourceCheck: false
        });
      }).toThrow('resourceType, resourceIdParam, and action are required');
    });

    it('should return array of middleware functions', () => {
      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'update'
      });

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares.length).toBe(2); // Route-level + resource-level
    });

    it('should return only route-level middleware when skipResourceCheck is true', () => {
      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        skipResourceCheck: true
      });

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares.length).toBe(1); // Only route-level
    });

    it('should allow access when both route and resource checks pass', async () => {
      // Mock route-level check (JwtService.verifyRoleMiddleware)
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        next();
      });

      // Mock resource-level check
      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: true,
        error: null
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'update'
      });

      req.params.id = '123';

      // Execute route-level middleware
      await middlewares[0](req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Execute resource-level middleware
      await middlewares[1](req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
      expect(req.resourceAccess).toEqual({
        resourceType: 'programme',
        resourceId: '123',
        action: 'update',
        validated: true
      });
    });

    it('should deny access when resource check fails', async () => {
      // Mock route-level check passes
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        next();
      });

      // Mock resource-level check fails
      const errorResponse = {
        error: true,
        message: 'Access denied',
        code: 'RESOURCE_ACCESS_DENIED'
      };
      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: false,
        error: errorResponse
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'update'
      });

      req.params.id = '123';

      // Execute route-level middleware
      await middlewares[0](req, res, next);

      // Execute resource-level middleware
      await middlewares[1](req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        ...errorResponse
      });
      expect(next).toHaveBeenCalledTimes(1); // Only from route-level
    });

    it('should return 400 if resource ID parameter is missing', async () => {
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        next();
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'update'
      });

      // No resource ID in params or body
      req.params = {};
      req.body = {};

      // Execute route-level middleware
      await middlewares[0](req, res, next);

      // Execute resource-level middleware
      await middlewares[1](req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
        message: "Resource ID parameter 'id' is required",
        code: 'MISSING_RESOURCE_ID'
      });
    });

    it('should handle resource ID from request body', async () => {
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        next();
      });

      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: true,
        error: null
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        resourceType: 'programme',
        resourceIdParam: 'programmeId',
        action: 'update'
      });

      req.body.programmeId = '456';

      // Execute middlewares
      await middlewares[0](req, res, next);
      await middlewares[1](req, res, next);

      expect(RoleBasedAccessControlService.canAccessResource).toHaveBeenCalledWith(
        1,
        'programme',
        '456',
        'update'
      );
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when resource not found', async () => {
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        next();
      });

      const errorResponse = {
        error: true,
        message: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND'
      };
      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: false,
        error: errorResponse
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'read'
      });

      req.params.id = '999';

      await middlewares[0](req, res, next);
      await middlewares[1](req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        ...errorResponse
      });
    });

    it('should handle errors gracefully', async () => {
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        next();
      });

      RoleBasedAccessControlService.canAccessResource = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      const middlewares = multiLevelAccessControl({
        requiredRoles: 'convener',
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'update'
      });

      req.params.id = '123';

      await middlewares[0](req, res, next);
      await middlewares[1](req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
        message: 'An error occurred while validating resource access',
        code: 'INTERNAL_ERROR'
      });
    });
  });

  describe('routeLevelAccessControl', () => {
    it('should create route-level only middleware', () => {
      const middlewares = routeLevelAccessControl('student');

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares.length).toBe(1);
    });

    it('should accept array of roles', () => {
      const middlewares = routeLevelAccessControl(['student', 'convener']);

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares.length).toBe(1);
    });
  });

  describe('resourceLevelAccessControl', () => {
    it('should throw error if required params missing', () => {
      expect(() => {
        resourceLevelAccessControl({});
      }).toThrow('resourceType, resourceIdParam, and action are required');
    });

    it('should return middleware function', () => {
      const middleware = resourceLevelAccessControl({
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'read'
      });

      expect(typeof middleware).toBe('function');
    });

    it('should return 401 if user not authenticated', async () => {
      const middleware = resourceLevelAccessControl({
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'read'
      });

      req.user_id = null;

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    });

    it('should validate resource access', async () => {
      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: true,
        error: null
      });

      const middleware = resourceLevelAccessControl({
        resourceType: 'cohort',
        resourceIdParam: 'cohortId',
        action: 'update'
      });

      req.params.cohortId = '789';

      await middleware(req, res, next);

      expect(RoleBasedAccessControlService.canAccessResource).toHaveBeenCalledWith(
        1,
        'cohort',
        '789',
        'update'
      );
      expect(next).toHaveBeenCalled();
      expect(req.resourceAccess).toEqual({
        resourceType: 'cohort',
        resourceId: '789',
        action: 'update',
        validated: true
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should enforce multi-level access for convener updating their own programme', async () => {
      // Convener has role
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        req.role = 'convener';
        next();
      });

      // Convener owns the programme
      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: true,
        error: null
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'update'
      });

      req.params.id = '100';

      await middlewares[0](req, res, next);
      await middlewares[1](req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(req.resourceAccess.validated).toBe(true);
    });

    it('should deny convener access to another conveners programme', async () => {
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        req.role = 'convener';
        next();
      });

      // Convener does NOT own this programme
      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: false,
        error: {
          error: true,
          message: 'You do not have permission to access this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        }
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'update'
      });

      req.params.id = '200';

      await middlewares[0](req, res, next);
      await middlewares[1](req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledTimes(1); // Only from route-level
    });

    it('should allow administrator access to any programme', async () => {
      JwtService.verifyRoleMiddleware = jest.fn(() => (req, res, next) => {
        req.role = 'administrator';
        next();
      });

      // Administrator has 'all' scope
      RoleBasedAccessControlService.canAccessResource = jest.fn().mockResolvedValue({
        allowed: true,
        error: null
      });

      const middlewares = multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'programme',
        resourceIdParam: 'id',
        action: 'delete'
      });

      req.params.id = '300';

      await middlewares[0](req, res, next);
      await middlewares[1](req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(req.resourceAccess.validated).toBe(true);
    });
  });
});
