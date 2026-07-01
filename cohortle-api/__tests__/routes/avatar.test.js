const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../services/AvatarService');
jest.mock('../../services/ProfileService');

jest.mock('../../middleware/TokenMiddleware', () => {
  // Create a counter inside the mock factory
  let mockUserIdCounter = 100;
  
  return () => (req, res, next) => {
    if (req.headers.authorization) {
      // Use incrementing user IDs to avoid rate limiting in tests
      req.user_id = mockUserIdCounter++;
      next();
    } else {
      res.status(401).json({ error: true, message: 'Unauthorized' });
    }
  };
});
jest.mock('../../middleware/UrlMiddleware', () => (req, res, next) => next());

const profileRoute = require('../../routes/profile');
const AvatarService = require('../../services/AvatarService');
const ProfileService = require('../../services/ProfileService');

describe('Avatar Generation Route', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh app instance for each test to reset rate limiter
    profileRoute(app);
  });

  describe('POST /v1/api/profile/avatar/generate', () => {
    test('should generate avatar successfully and return 200', async () => {
      const mockAvatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=user-123-1234567890-abc&backgroundColor=b6e3f4&skinColor=ae5d29&size=200';
      
      AvatarService.generateAvatarUrl.mockResolvedValue(mockAvatarUrl);
      ProfileService.updateProfileImage.mockResolvedValue({
        id: 100,
        name: 'Test User',
        email: 'test@example.com',
        profilePicture: mockAvatarUrl,
      });

      const response = await request(app)
        .post('/v1/api/profile/avatar/generate')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.message).toBe('Avatar generated successfully');
      expect(response.body.avatarUrl).toBe(mockAvatarUrl);
      expect(AvatarService.generateAvatarUrl).toHaveBeenCalledWith({
        userId: expect.any(Number),
      });
      expect(ProfileService.updateProfileImage).toHaveBeenCalledWith(expect.any(Number), mockAvatarUrl);
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/v1/api/profile/avatar/generate')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Unauthorized');
    });

    test('should return 400 when avatar URL validation fails', async () => {
      AvatarService.generateAvatarUrl.mockRejectedValue(
        new Error('Avatar URL validation failed: Invalid URL')
      );

      const response = await request(app)
        .post('/v1/api/profile/avatar/generate')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Generated avatar URL is invalid');
    });

    test('should return 400 when avatar URL exceeds maximum length', async () => {
      AvatarService.generateAvatarUrl.mockResolvedValue('https://example.com/avatar');
      ProfileService.updateProfileImage.mockRejectedValue(
        new Error('Avatar URL exceeds maximum length of 500 characters')
      );

      const response = await request(app)
        .post('/v1/api/profile/avatar/generate')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Avatar URL is too long to store');
    });

    test('should return 404 when user not found', async () => {
      AvatarService.generateAvatarUrl.mockResolvedValue('https://example.com/avatar');
      ProfileService.updateProfileImage.mockRejectedValue(
        new Error('User not found')
      );

      const response = await request(app)
        .post('/v1/api/profile/avatar/generate')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('User not found');
    });

    test('should return 500 when avatar generation fails', async () => {
      AvatarService.generateAvatarUrl.mockRejectedValue(
        new Error('DiceBear API unavailable')
      );

      const response = await request(app)
        .post('/v1/api/profile/avatar/generate')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Failed to generate avatar. Please try again later.');
    });

    test('should return 500 when profile update fails', async () => {
      AvatarService.generateAvatarUrl.mockResolvedValue('https://example.com/avatar');
      ProfileService.updateProfileImage.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/v1/api/profile/avatar/generate')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Failed to generate avatar. Please try again later.');
    });
  });
});
