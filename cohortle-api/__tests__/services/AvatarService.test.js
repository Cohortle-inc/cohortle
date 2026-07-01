const AvatarService = require('../../services/AvatarService');
const { AVATAR_CONFIG } = require('../../config/avatar');

describe('AvatarService', () => {
  describe('generateSeed', () => {
    it('should generate a unique seed with userId', () => {
      const userId = 123;
      const seed = AvatarService.generateSeed(userId);
      
      expect(seed).toBeTruthy();
      expect(typeof seed).toBe('string');
      expect(seed).toContain(`user-${userId}`);
    });

    it('should generate different seeds for the same user on subsequent calls', () => {
      const userId = 456;
      const seed1 = AvatarService.generateSeed(userId);
      const seed2 = AvatarService.generateSeed(userId);
      
      expect(seed1).not.toBe(seed2);
    });

    it('should generate different seeds for different users', () => {
      const seed1 = AvatarService.generateSeed(1);
      const seed2 = AvatarService.generateSeed(2);
      
      expect(seed1).not.toBe(seed2);
    });

    it('should handle string userId', () => {
      const userId = 'user-abc-123';
      const seed = AvatarService.generateSeed(userId);
      
      expect(seed).toBeTruthy();
      expect(seed).toContain(`user-${userId}`);
    });
  });

  describe('buildDiceBearUrl', () => {
    it('should construct a valid DiceBear URL with required parameters', () => {
      const seed = 'test-seed-123';
      const url = AvatarService.buildDiceBearUrl(seed);
      
      expect(url).toContain(AVATAR_CONFIG.baseUrl);
      expect(url).toContain(AVATAR_CONFIG.style);
      expect(url).toContain(`seed=${seed}`);
      expect(url).toContain('backgroundColor=');
      expect(url).toContain('skinColor=');
      expect(url).toContain(`size=${AVATAR_CONFIG.defaultSize}`);
    });

    it('should use custom style when provided', () => {
      const seed = 'test-seed-123';
      const customStyle = 'avataaars';
      const url = AvatarService.buildDiceBearUrl(seed, customStyle);
      
      expect(url).toContain(customStyle);
    });

    it('should use custom backgroundColor when provided', () => {
      const seed = 'test-seed-123';
      const customBgColor = 'ff0000';
      const url = AvatarService.buildDiceBearUrl(seed, AVATAR_CONFIG.style, {
        backgroundColor: customBgColor,
      });
      
      expect(url).toContain(`backgroundColor=${customBgColor}`);
    });

    it('should use custom skinColor when provided', () => {
      const seed = 'test-seed-123';
      const customSkinColor = '00ff00';
      const url = AvatarService.buildDiceBearUrl(seed, AVATAR_CONFIG.style, {
        skinColor: customSkinColor,
      });
      
      expect(url).toContain(`skinColor=${customSkinColor}`);
    });

    it('should use custom size when provided', () => {
      const seed = 'test-seed-123';
      const customSize = 300;
      const url = AvatarService.buildDiceBearUrl(seed, AVATAR_CONFIG.style, {
        size: customSize,
      });
      
      expect(url).toContain(`size=${customSize}`);
    });

    it('should select backgroundColor from configured options', () => {
      const seed = 'test-seed-123';
      const url = AvatarService.buildDiceBearUrl(seed);
      
      const hasValidBgColor = AVATAR_CONFIG.backgroundColors.some(color => 
        url.includes(`backgroundColor=${color}`)
      );
      expect(hasValidBgColor).toBe(true);
    });

    it('should select skinColor from configured options', () => {
      const seed = 'test-seed-123';
      const url = AvatarService.buildDiceBearUrl(seed);
      
      const hasValidSkinColor = AVATAR_CONFIG.skinTones.some(tone => 
        url.includes(`skinColor=${tone}`)
      );
      expect(hasValidSkinColor).toBe(true);
    });
  });

  describe('validateAvatarUrl', () => {
    it('should validate a correct DiceBear URL', () => {
      const validUrl = 'https://api.dicebear.com/7.x/big-smile/svg?seed=test&backgroundColor=b6e3f4&skinColor=ae5d29&size=200';
      const result = AvatarService.validateAvatarUrl(validUrl);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null or undefined URL', () => {
      const result1 = AvatarService.validateAvatarUrl(null);
      const result2 = AvatarService.validateAvatarUrl(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBeTruthy();
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBeTruthy();
    });

    it('should reject non-string URL', () => {
      const result = AvatarService.validateAvatarUrl(123);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    it('should reject URL exceeding maximum length', () => {
      const longUrl = 'https://api.dicebear.com/7.x/big-smile/svg?' + 'a'.repeat(500);
      const result = AvatarService.validateAvatarUrl(longUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    it('should reject non-HTTPS URL', () => {
      const httpUrl = 'http://api.dicebear.com/7.x/big-smile/svg?seed=test';
      const result = AvatarService.validateAvatarUrl(httpUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('HTTPS');
    });

    it('should reject URL not from DiceBear', () => {
      const externalUrl = 'https://example.com/avatar.png';
      const result = AvatarService.validateAvatarUrl(externalUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('DiceBear');
    });

    it('should reject invalid URL format', () => {
      const invalidUrl = 'not-a-valid-url';
      const result = AvatarService.validateAvatarUrl(invalidUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not a valid URL');
    });
  });

  describe('generateAvatarUrl', () => {
    it('should generate a valid avatar URL', async () => {
      const options = { userId: 123 };
      const url = await AvatarService.generateAvatarUrl(options);
      
      expect(url).toBeTruthy();
      expect(url).toContain(AVATAR_CONFIG.baseUrl);
      expect(url).toContain('seed=user-123');
    });

    it('should throw error if userId is missing', async () => {
      await expect(AvatarService.generateAvatarUrl({}))
        .rejects
        .toThrow('User ID is required');
    });

    it('should use custom style when provided', async () => {
      const options = { 
        userId: 123, 
        style: 'avataaars' 
      };
      const url = await AvatarService.generateAvatarUrl(options);
      
      expect(url).toContain('avataaars');
    });

    it('should use customisation parameters when provided', async () => {
      const options = { 
        userId: 123,
        customisation: {
          backgroundColor: 'ff0000',
          skinColor: '00ff00',
        }
      };
      const url = await AvatarService.generateAvatarUrl(options);
      
      expect(url).toContain('backgroundColor=ff0000');
      expect(url).toContain('skinColor=00ff00');
    });

    it('should generate different URLs for the same user on subsequent calls', async () => {
      const options = { userId: 123 };
      const url1 = await AvatarService.generateAvatarUrl(options);
      const url2 = await AvatarService.generateAvatarUrl(options);
      
      expect(url1).not.toBe(url2);
    });

    it('should validate generated URL', async () => {
      const options = { userId: 123 };
      const url = await AvatarService.generateAvatarUrl(options);
      
      const validation = AvatarService.validateAvatarUrl(url);
      expect(validation.isValid).toBe(true);
    });
  });
});
