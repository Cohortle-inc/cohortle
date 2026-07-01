/**
 * Unit tests for ProfileService
 * 
 * Tests the profile management functionality including:
 * - Profile image updates
 * - URL validation
 * - Error handling
 */

const ProfileService = require('../../services/ProfileService');
const db = require('../../models');

// Mock the database models
jest.mock('../../models', () => ({
  users: {
    findByPk: jest.fn(),
  },
  enrollments: {
    count: jest.fn(),
    findAll: jest.fn(),
  },
  lesson_completions: {
    count: jest.fn(),
  },
  user_preferences: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOrCreate: jest.fn(),
  },
  learning_goals: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
  },
  user_achievements: {
    findAll: jest.fn(),
  },
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfileImage', () => {
    it('should successfully update profile image with valid URL', async () => {
      const userId = 1;
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';
      
      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'learner',
        profile_image: null,
        bio: null,
        linkedin_username: null,
        joined_at: new Date('2024-01-01'),
        update: jest.fn().mockResolvedValue(true),
      };

      // Mock the update to change profile_image
      mockUser.update.mockImplementation(async (data) => {
        mockUser.profile_image = data.profile_image;
        return true;
      });

      db.users.findByPk.mockResolvedValue(mockUser);

      const result = await ProfileService.updateProfileImage(userId, avatarUrl);

      expect(db.users.findByPk).toHaveBeenCalledWith(userId);
      expect(mockUser.update).toHaveBeenCalledWith({
        profile_image: avatarUrl,
      });
      expect(result).toEqual({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'learner',
        profilePicture: avatarUrl,
        bio: null,
        linkedinUsername: null,
        joinedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should reject URL exceeding 500 characters', async () => {
      const userId = 1;
      const longUrl = 'https://example.com/' + 'a'.repeat(500);

      await expect(ProfileService.updateProfileImage(userId, longUrl)).rejects.toThrow(
        'Avatar URL exceeds maximum length of 500 characters'
      );

      expect(db.users.findByPk).not.toHaveBeenCalled();
    });

    it('should reject URL exactly at 501 characters', async () => {
      const userId = 1;
      // Create a URL that is exactly 501 characters
      const baseUrl = 'https://example.com/';
      const longUrl = baseUrl + 'a'.repeat(501 - baseUrl.length);

      expect(longUrl.length).toBe(501);

      await expect(ProfileService.updateProfileImage(userId, longUrl)).rejects.toThrow(
        'Avatar URL exceeds maximum length of 500 characters'
      );

      expect(db.users.findByPk).not.toHaveBeenCalled();
    });

    it('should accept URL exactly at 500 characters', async () => {
      const userId = 1;
      // Create a URL that is exactly 500 characters
      const baseUrl = 'https://example.com/';
      const maxLengthUrl = baseUrl + 'a'.repeat(500 - baseUrl.length);

      expect(maxLengthUrl.length).toBe(500);

      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'learner',
        profile_image: null,
        bio: null,
        linkedin_username: null,
        joined_at: new Date('2024-01-01'),
        update: jest.fn().mockImplementation(async (data) => {
          mockUser.profile_image = data.profile_image;
          return true;
        }),
      };

      db.users.findByPk.mockResolvedValue(mockUser);

      const result = await ProfileService.updateProfileImage(userId, maxLengthUrl);

      expect(db.users.findByPk).toHaveBeenCalledWith(userId);
      expect(mockUser.update).toHaveBeenCalledWith({
        profile_image: maxLengthUrl,
      });
      expect(result.profilePicture).toBe(maxLengthUrl);
    });

    it('should throw error when user not found', async () => {
      const userId = 999;
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';

      db.users.findByPk.mockResolvedValue(null);

      await expect(ProfileService.updateProfileImage(userId, avatarUrl)).rejects.toThrow(
        'User not found'
      );

      expect(db.users.findByPk).toHaveBeenCalledWith(userId);
    });

    it('should handle database errors gracefully', async () => {
      const userId = 1;
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';

      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'learner',
        profile_image: null,
        bio: null,
        linkedin_username: null,
        joined_at: new Date('2024-01-01'),
        update: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };

      db.users.findByPk.mockResolvedValue(mockUser);

      await expect(ProfileService.updateProfileImage(userId, avatarUrl)).rejects.toThrow(
        'Database connection failed'
      );

      expect(db.users.findByPk).toHaveBeenCalledWith(userId);
      expect(mockUser.update).toHaveBeenCalledWith({
        profile_image: avatarUrl,
      });
    });

    it('should replace existing profile image with new URL', async () => {
      const userId = 1;
      const oldAvatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=old123';
      const newAvatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=new456';

      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'learner',
        profile_image: oldAvatarUrl,
        bio: null,
        linkedin_username: null,
        joined_at: new Date('2024-01-01'),
        update: jest.fn().mockImplementation(async (data) => {
          mockUser.profile_image = data.profile_image;
          return true;
        }),
      };

      db.users.findByPk.mockResolvedValue(mockUser);

      const result = await ProfileService.updateProfileImage(userId, newAvatarUrl);

      expect(mockUser.update).toHaveBeenCalledWith({
        profile_image: newAvatarUrl,
      });
      expect(result.profilePicture).toBe(newAvatarUrl);
    });

    it('should handle null avatar URL', async () => {
      const userId = 1;
      const avatarUrl = null;

      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'learner',
        profile_image: 'https://old-avatar.com/image.png',
        bio: null,
        linkedin_username: null,
        joined_at: new Date('2024-01-01'),
        update: jest.fn().mockImplementation(async (data) => {
          mockUser.profile_image = data.profile_image;
          return true;
        }),
      };

      db.users.findByPk.mockResolvedValue(mockUser);

      const result = await ProfileService.updateProfileImage(userId, avatarUrl);

      expect(mockUser.update).toHaveBeenCalledWith({
        profile_image: null,
      });
      expect(result.profilePicture).toBe(null);
    });

    it('should handle empty string avatar URL', async () => {
      const userId = 1;
      const avatarUrl = '';

      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'learner',
        profile_image: 'https://old-avatar.com/image.png',
        bio: null,
        linkedin_username: null,
        joined_at: new Date('2024-01-01'),
        update: jest.fn().mockImplementation(async (data) => {
          mockUser.profile_image = data.profile_image;
          return true;
        }),
      };

      db.users.findByPk.mockResolvedValue(mockUser);

      const result = await ProfileService.updateProfileImage(userId, avatarUrl);

      expect(mockUser.update).toHaveBeenCalledWith({
        profile_image: '',
      });
      expect(result.profilePicture).toBe('');
    });

    it('should return complete user profile after update', async () => {
      const userId = 1;
      const avatarUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test123';

      const mockUser = {
        id: userId,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        role: 'convener',
        profile_image: null,
        bio: 'Software developer',
        linkedin_username: 'janesmith',
        joined_at: new Date('2024-03-01'),
        update: jest.fn().mockImplementation(async (data) => {
          mockUser.profile_image = data.profile_image;
          return true;
        }),
      };

      db.users.findByPk.mockResolvedValue(mockUser);

      const result = await ProfileService.updateProfileImage(userId, avatarUrl);

      expect(result).toEqual({
        id: userId,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'convener',
        profilePicture: avatarUrl,
        bio: 'Software developer',
        linkedinUsername: 'janesmith',
        joinedAt: '2024-03-01T00:00:00.000Z',
      });
    });
  });
});
