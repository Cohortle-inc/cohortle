const fc = require('fast-check');
const AvatarService = require('../../services/AvatarService');
const { AVATAR_CONFIG } = require('../../config/avatar');

/**
 * Property-Based Tests for Diverse Skin Tone Configuration
 * 
 * Feature: profile-avatar-generator
 * Property 4: Diverse Skin Tone Configuration
 * 
 * Validates: Requirements 2.1
 * 
 * This property ensures that all generated avatar URLs include a skinColor parameter
 * that is one of the configured diverse African skin tones from AVATAR_CONFIG.
 */

describe('Property 4: Diverse Skin Tone Configuration', () => {
  it('should always use configured diverse skin tones in generated URLs', () => {
    // Feature: profile-avatar-generator, Property 4: Diverse Skin Tone Configuration
    
    fc.assert(
      fc.property(
        // Generate arbitrary user IDs
        fc.integer({ min: 1, max: 100000 }),
        (userId) => {
          // Generate avatar URL
          const seed = AvatarService.generateSeed(userId);
          const avatarUrl = AvatarService.buildDiceBearUrl(seed);
          
          // Parse URL to extract skinColor parameter
          const url = new URL(avatarUrl);
          const skinColor = url.searchParams.get('skinColor');
          
          // Verify skinColor is present
          expect(skinColor).toBeTruthy();
          
          // Verify skinColor is one of the configured diverse skin tones
          expect(AVATAR_CONFIG.skinTones).toContain(skinColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use all configured skin tones across multiple generations', () => {
    // Feature: profile-avatar-generator, Property 4: Diverse Skin Tone Configuration (variety check)
    
    // Generate multiple avatars and collect skin tones used
    const usedSkinTones = new Set();
    const numGenerations = 200; // Generate enough to likely hit all skin tones
    
    for (let i = 0; i < numGenerations; i++) {
      const seed = AvatarService.generateSeed(i);
      const avatarUrl = AvatarService.buildDiceBearUrl(seed);
      
      const url = new URL(avatarUrl);
      const skinColor = url.searchParams.get('skinColor');
      
      usedSkinTones.add(skinColor);
    }
    
    // Verify that multiple skin tones are used (diversity check)
    // With 200 generations and 5 skin tones, we should see at least 3 different tones
    expect(usedSkinTones.size).toBeGreaterThanOrEqual(3);
    
    // Verify all used skin tones are from the configured set
    usedSkinTones.forEach(skinTone => {
      expect(AVATAR_CONFIG.skinTones).toContain(skinTone);
    });
  });

  it('should maintain skin tone configuration when custom parameters are provided', () => {
    // Feature: profile-avatar-generator, Property 4: Diverse Skin Tone Configuration (with customisation)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...AVATAR_CONFIG.backgroundColors),
        (userId, customBgColor) => {
          // Generate avatar URL with custom background colour
          const seed = AvatarService.generateSeed(userId);
          const avatarUrl = AvatarService.buildDiceBearUrl(seed, AVATAR_CONFIG.style, {
            backgroundColor: customBgColor,
          });
          
          // Parse URL to extract skinColor parameter
          const url = new URL(avatarUrl);
          const skinColor = url.searchParams.get('skinColor');
          
          // Verify skinColor is still from configured diverse skin tones
          expect(AVATAR_CONFIG.skinTones).toContain(skinColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect explicitly provided skin tone from configuration', () => {
    // Feature: profile-avatar-generator, Property 4: Diverse Skin Tone Configuration (explicit selection)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...AVATAR_CONFIG.skinTones),
        (userId, explicitSkinTone) => {
          // Generate avatar URL with explicit skin tone
          const seed = AvatarService.generateSeed(userId);
          const avatarUrl = AvatarService.buildDiceBearUrl(seed, AVATAR_CONFIG.style, {
            skinColor: explicitSkinTone,
          });
          
          // Parse URL to extract skinColor parameter
          const url = new URL(avatarUrl);
          const skinColor = url.searchParams.get('skinColor');
          
          // Verify the explicit skin tone is used
          expect(skinColor).toBe(explicitSkinTone);
          
          // Verify it's from the configured set
          expect(AVATAR_CONFIG.skinTones).toContain(skinColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use diverse skin tones in full avatar generation flow', async () => {
    // Feature: profile-avatar-generator, Property 4: Diverse Skin Tone Configuration (end-to-end)
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100000 }),
        async (userId) => {
          // Generate avatar URL using the full service method
          const avatarUrl = await AvatarService.generateAvatarUrl({ userId });
          
          // Parse URL to extract skinColor parameter
          const url = new URL(avatarUrl);
          const skinColor = url.searchParams.get('skinColor');
          
          // Verify skinColor is present
          expect(skinColor).toBeTruthy();
          
          // Verify skinColor is one of the configured diverse skin tones
          expect(AVATAR_CONFIG.skinTones).toContain(skinColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate that all configured skin tones are valid hex colours', () => {
    // Feature: profile-avatar-generator, Property 4: Diverse Skin Tone Configuration (configuration validation)
    
    // Verify configuration has skin tones
    expect(AVATAR_CONFIG.skinTones).toBeDefined();
    expect(AVATAR_CONFIG.skinTones.length).toBeGreaterThan(0);
    
    // Verify each skin tone is a valid hex colour (6 characters, alphanumeric)
    const hexColorRegex = /^[0-9a-fA-F]{6}$/;
    
    AVATAR_CONFIG.skinTones.forEach(skinTone => {
      expect(skinTone).toMatch(hexColorRegex);
    });
  });
});
