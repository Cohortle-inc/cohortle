const { AVATAR_CONFIG, validateAvatarConfig } = require('../../config/avatar');

describe('Avatar Configuration', () => {
  describe('AVATAR_CONFIG', () => {
    it('should have all required fields', () => {
      expect(AVATAR_CONFIG).toHaveProperty('style');
      expect(AVATAR_CONFIG).toHaveProperty('baseUrl');
      expect(AVATAR_CONFIG).toHaveProperty('defaultSize');
      expect(AVATAR_CONFIG).toHaveProperty('backgroundColors');
      expect(AVATAR_CONFIG).toHaveProperty('skinTones');
      expect(AVATAR_CONFIG).toHaveProperty('requestTimeout');
      expect(AVATAR_CONFIG).toHaveProperty('maxUrlLength');
      expect(AVATAR_CONFIG).toHaveProperty('rateLimit');
    });

    it('should use big-smile style', () => {
      expect(AVATAR_CONFIG.style).toBe('big-smile');
    });

    it('should use DiceBear API version 7.x', () => {
      expect(AVATAR_CONFIG.baseUrl).toBe('https://api.dicebear.com/7.x');
    });

    it('should have default size of 200 pixels', () => {
      expect(AVATAR_CONFIG.defaultSize).toBe(200);
    });

    it('should have at least 4 background colours', () => {
      expect(AVATAR_CONFIG.backgroundColors).toBeInstanceOf(Array);
      expect(AVATAR_CONFIG.backgroundColors.length).toBeGreaterThanOrEqual(4);
    });

    it('should have Cohortle brand colours', () => {
      const expectedColors = ['b6e3f4', 'c2f0c2', 'ffd4a3', 'e6ccff'];
      expectedColors.forEach(color => {
        expect(AVATAR_CONFIG.backgroundColors).toContain(color);
      });
    });

    it('should have at least 5 diverse skin tones', () => {
      expect(AVATAR_CONFIG.skinTones).toBeInstanceOf(Array);
      expect(AVATAR_CONFIG.skinTones.length).toBeGreaterThanOrEqual(5);
    });

    it('should have diverse African skin tones', () => {
      const expectedTones = ['ae5d29', '614335', 'd08b5b', '8d5524', 'a55728'];
      expectedTones.forEach(tone => {
        expect(AVATAR_CONFIG.skinTones).toContain(tone);
      });
    });

    it('should have request timeout of 10 seconds', () => {
      expect(AVATAR_CONFIG.requestTimeout).toBe(10000);
    });

    it('should have max URL length of 500 characters', () => {
      expect(AVATAR_CONFIG.maxUrlLength).toBe(500);
    });

    it('should have rate limit configuration', () => {
      expect(AVATAR_CONFIG.rateLimit).toHaveProperty('windowMs');
      expect(AVATAR_CONFIG.rateLimit).toHaveProperty('maxRequests');
      expect(AVATAR_CONFIG.rateLimit.windowMs).toBe(60000); // 1 minute
      expect(AVATAR_CONFIG.rateLimit.maxRequests).toBe(5);
    });
  });

  describe('validateAvatarConfig', () => {
    it('should return true for valid configuration', () => {
      expect(validateAvatarConfig()).toBe(true);
    });

    it('should validate that required fields exist', () => {
      const originalStyle = AVATAR_CONFIG.style;
      AVATAR_CONFIG.style = null;
      
      const result = validateAvatarConfig();
      
      AVATAR_CONFIG.style = originalStyle;
      expect(result).toBe(false);
    });

    it('should validate that backgroundColors is not empty', () => {
      const originalColors = AVATAR_CONFIG.backgroundColors;
      AVATAR_CONFIG.backgroundColors = [];
      
      const result = validateAvatarConfig();
      
      AVATAR_CONFIG.backgroundColors = originalColors;
      expect(result).toBe(false);
    });

    it('should validate that skinTones is not empty', () => {
      const originalTones = AVATAR_CONFIG.skinTones;
      AVATAR_CONFIG.skinTones = [];
      
      const result = validateAvatarConfig();
      
      AVATAR_CONFIG.skinTones = originalTones;
      expect(result).toBe(false);
    });
  });

  describe('Configuration Values', () => {
    it('should have valid hex colour codes for backgrounds', () => {
      const hexPattern = /^[0-9a-f]{6}$/i;
      AVATAR_CONFIG.backgroundColors.forEach(color => {
        expect(color).toMatch(hexPattern);
      });
    });

    it('should have valid hex colour codes for skin tones', () => {
      const hexPattern = /^[0-9a-f]{6}$/i;
      AVATAR_CONFIG.skinTones.forEach(tone => {
        expect(tone).toMatch(hexPattern);
      });
    });

    it('should have positive request timeout', () => {
      expect(AVATAR_CONFIG.requestTimeout).toBeGreaterThan(0);
    });

    it('should have positive max URL length', () => {
      expect(AVATAR_CONFIG.maxUrlLength).toBeGreaterThan(0);
    });

    it('should have positive rate limit window', () => {
      expect(AVATAR_CONFIG.rateLimit.windowMs).toBeGreaterThan(0);
    });

    it('should have positive rate limit max requests', () => {
      expect(AVATAR_CONFIG.rateLimit.maxRequests).toBeGreaterThan(0);
    });
  });
});
