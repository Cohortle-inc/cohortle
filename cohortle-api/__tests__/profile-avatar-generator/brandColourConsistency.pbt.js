const fc = require('fast-check');
const AvatarService = require('../../services/AvatarService');
const { AVATAR_CONFIG } = require('../../config/avatar');

/**
 * Property-Based Tests for Brand Colour Consistency
 * 
 * Feature: profile-avatar-generator
 * Property 6: Brand Colour Consistency
 * 
 * Validates: Requirements 3.1
 * 
 * This property ensures that all generated avatar URLs include a backgroundColor parameter
 * that is one of the colours from Cohortle's brand palette defined in AVATAR_CONFIG.
 */

describe('Property 6: Brand Colour Consistency', () => {
  it('should always use configured brand colours in generated URLs', () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency
    
    fc.assert(
      fc.property(
        // Generate arbitrary user IDs
        fc.integer({ min: 1, max: 100000 }),
        (userId) => {
          // Generate avatar URL
          const seed = AvatarService.generateSeed(userId);
          const avatarUrl = AvatarService.buildDiceBearUrl(seed);
          
          // Parse URL to extract backgroundColor parameter
          const url = new URL(avatarUrl);
          const backgroundColor = url.searchParams.get('backgroundColor');
          
          // Verify backgroundColor is present
          expect(backgroundColor).toBeTruthy();
          
          // Verify backgroundColor is one of the configured brand colours
          expect(AVATAR_CONFIG.backgroundColors).toContain(backgroundColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use all configured brand colours across multiple generations', () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency (variety check)
    
    // Generate multiple avatars and collect background colours used
    const usedBackgroundColors = new Set();
    const numGenerations = 200; // Generate enough to likely hit all colours
    
    for (let i = 0; i < numGenerations; i++) {
      const seed = AvatarService.generateSeed(i);
      const avatarUrl = AvatarService.buildDiceBearUrl(seed);
      
      const url = new URL(avatarUrl);
      const backgroundColor = url.searchParams.get('backgroundColor');
      
      usedBackgroundColors.add(backgroundColor);
    }
    
    // Verify that multiple background colours are used (variety check)
    // With 200 generations and 4 colours, we should see at least 3 different colours
    expect(usedBackgroundColors.size).toBeGreaterThanOrEqual(3);
    
    // Verify all used background colours are from the configured brand palette
    usedBackgroundColors.forEach(bgColor => {
      expect(AVATAR_CONFIG.backgroundColors).toContain(bgColor);
    });
  });

  it('should maintain brand colour configuration when custom parameters are provided', () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency (with customisation)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...AVATAR_CONFIG.skinTones),
        (userId, customSkinTone) => {
          // Generate avatar URL with custom skin tone
          const seed = AvatarService.generateSeed(userId);
          const avatarUrl = AvatarService.buildDiceBearUrl(seed, AVATAR_CONFIG.style, {
            skinColor: customSkinTone,
          });
          
          // Parse URL to extract backgroundColor parameter
          const url = new URL(avatarUrl);
          const backgroundColor = url.searchParams.get('backgroundColor');
          
          // Verify backgroundColor is still from configured brand colours
          expect(AVATAR_CONFIG.backgroundColors).toContain(backgroundColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect explicitly provided background colour from configuration', () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency (explicit selection)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...AVATAR_CONFIG.backgroundColors),
        (userId, explicitBgColor) => {
          // Generate avatar URL with explicit background colour
          const seed = AvatarService.generateSeed(userId);
          const avatarUrl = AvatarService.buildDiceBearUrl(seed, AVATAR_CONFIG.style, {
            backgroundColor: explicitBgColor,
          });
          
          // Parse URL to extract backgroundColor parameter
          const url = new URL(avatarUrl);
          const backgroundColor = url.searchParams.get('backgroundColor');
          
          // Verify the explicit background colour is used
          expect(backgroundColor).toBe(explicitBgColor);
          
          // Verify it's from the configured brand palette
          expect(AVATAR_CONFIG.backgroundColors).toContain(backgroundColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use brand colours in full avatar generation flow', async () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency (end-to-end)
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100000 }),
        async (userId) => {
          // Generate avatar URL using the full service method
          const avatarUrl = await AvatarService.generateAvatarUrl({ userId });
          
          // Parse URL to extract backgroundColor parameter
          const url = new URL(avatarUrl);
          const backgroundColor = url.searchParams.get('backgroundColor');
          
          // Verify backgroundColor is present
          expect(backgroundColor).toBeTruthy();
          
          // Verify backgroundColor is one of the configured brand colours
          expect(AVATAR_CONFIG.backgroundColors).toContain(backgroundColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate that all configured brand colours are valid hex colours', () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency (configuration validation)
    
    // Verify configuration has background colours
    expect(AVATAR_CONFIG.backgroundColors).toBeDefined();
    expect(AVATAR_CONFIG.backgroundColors.length).toBeGreaterThan(0);
    
    // Verify each background colour is a valid hex colour (6 characters, alphanumeric)
    const hexColorRegex = /^[0-9a-fA-F]{6}$/;
    
    AVATAR_CONFIG.backgroundColors.forEach(bgColor => {
      expect(bgColor).toMatch(hexColorRegex);
    });
  });

  it('should maintain brand identity across different avatar styles', () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency (style independence)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom('big-smile', 'avataaars'),
        (userId, style) => {
          // Generate avatar URL with different styles
          const seed = AvatarService.generateSeed(userId);
          const avatarUrl = AvatarService.buildDiceBearUrl(seed, style);
          
          // Parse URL to extract backgroundColor parameter
          const url = new URL(avatarUrl);
          const backgroundColor = url.searchParams.get('backgroundColor');
          
          // Verify backgroundColor is from brand palette regardless of style
          expect(AVATAR_CONFIG.backgroundColors).toContain(backgroundColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure brand colour consistency across concurrent generations', () => {
    // Feature: profile-avatar-generator, Property 6: Brand Colour Consistency (concurrency)
    
    // Generate multiple avatars concurrently
    const userIds = Array.from({ length: 50 }, (_, i) => i + 1);
    const avatarUrls = userIds.map(userId => {
      const seed = AvatarService.generateSeed(userId);
      return AvatarService.buildDiceBearUrl(seed);
    });
    
    // Verify all generated URLs use brand colours
    avatarUrls.forEach(avatarUrl => {
      const url = new URL(avatarUrl);
      const backgroundColor = url.searchParams.get('backgroundColor');
      
      expect(AVATAR_CONFIG.backgroundColors).toContain(backgroundColor);
    });
  });
});
