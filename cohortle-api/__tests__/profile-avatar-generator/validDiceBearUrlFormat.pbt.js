const fc = require('fast-check');
const AvatarService = require('../../services/AvatarService');
const { AVATAR_CONFIG } = require('../../config/avatar');

/**
 * Property-Based Tests for Avatar URL Format
 * 
 * Property 13: Valid DiceBear URL Format
 * For any avatar generation request, the resulting URL should match the DiceBear API format:
 * `https://api.dicebear.com/7.x/{style}/svg?seed={seed}&...` with all required parameters present.
 * 
 * Validates: Requirements 5.1, 5.2
 */
describe('Property 13: Valid DiceBear URL Format', () => {
  it('should generate URLs matching DiceBear API format for any valid userId', async () => {
    // Feature: profile-avatar-generator, Property 13: Valid DiceBear URL Format
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        async (userId) => {
          // Generate avatar URL
          const avatarUrl = await AvatarService.generateAvatarUrl({ userId });
          
          // Parse URL
          const urlObj = new URL(avatarUrl);
          
          // Verify protocol is HTTPS
          expect(urlObj.protocol).toBe('https:');
          
          // Verify hostname is DiceBear
          expect(urlObj.hostname).toBe('api.dicebear.com');
          
          // Verify path matches format: /7.x/{style}/svg
          const pathRegex = /^\/7\.x\/[a-z-]+\/svg$/;
          expect(urlObj.pathname).toMatch(pathRegex);
          
          // Verify required query parameters are present
          const params = urlObj.searchParams;
          expect(params.has('seed')).toBe(true);
          expect(params.has('backgroundColor')).toBe(true);
          expect(params.has('skinColor')).toBe(true);
          expect(params.has('size')).toBe(true);
          
          // Verify seed is non-empty
          expect(params.get('seed')).toBeTruthy();
          expect(params.get('seed').length).toBeGreaterThan(0);
          
          // Verify backgroundColor is a valid hex colour (6 characters)
          const bgColor = params.get('backgroundColor');
          expect(bgColor).toMatch(/^[0-9a-f]{6}$/i);
          expect(AVATAR_CONFIG.backgroundColors).toContain(bgColor);
          
          // Verify skinColor is a valid hex colour (6 characters)
          const skinColor = params.get('skinColor');
          expect(skinColor).toMatch(/^[0-9a-f]{6}$/i);
          expect(AVATAR_CONFIG.skinTones).toContain(skinColor);
          
          // Verify size is a positive integer
          const size = parseInt(params.get('size'), 10);
          expect(size).toBeGreaterThan(0);
          expect(size).toBe(AVATAR_CONFIG.defaultSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid URLs with custom style parameter', async () => {
    // Feature: profile-avatar-generator, Property 13: Valid DiceBear URL Format (custom style)
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        fc.constantFrom('big-smile', 'avataaars', 'bottts', 'lorelei'), // style
        async (userId, style) => {
          // Generate avatar URL with custom style
          const avatarUrl = await AvatarService.generateAvatarUrl({ 
            userId,
            style 
          });
          
          // Parse URL
          const urlObj = new URL(avatarUrl);
          
          // Verify path includes the specified style
          expect(urlObj.pathname).toContain(`/${style}/`);
          
          // Verify all required parameters are still present
          const params = urlObj.searchParams;
          expect(params.has('seed')).toBe(true);
          expect(params.has('backgroundColor')).toBe(true);
          expect(params.has('skinColor')).toBe(true);
          expect(params.has('size')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid URLs with custom parameters', async () => {
    // Feature: profile-avatar-generator, Property 13: Valid DiceBear URL Format (custom params)
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        fc.constantFrom(...AVATAR_CONFIG.backgroundColors), // backgroundColor
        fc.constantFrom(...AVATAR_CONFIG.skinTones), // skinColor
        fc.integer({ min: 50, max: 500 }), // size
        async (userId, backgroundColor, skinColor, size) => {
          // Generate avatar URL with custom parameters
          const avatarUrl = await AvatarService.generateAvatarUrl({ 
            userId,
            customisation: {
              backgroundColor,
              skinColor,
              size
            }
          });
          
          // Parse URL
          const urlObj = new URL(avatarUrl);
          const params = urlObj.searchParams;
          
          // Verify custom parameters are applied
          expect(params.get('backgroundColor')).toBe(backgroundColor);
          expect(params.get('skinColor')).toBe(skinColor);
          expect(params.get('size')).toBe(size.toString());
          
          // Verify URL is still valid DiceBear format
          expect(urlObj.protocol).toBe('https:');
          expect(urlObj.hostname).toBe('api.dicebear.com');
          expect(urlObj.pathname).toMatch(/^\/7\.x\/[a-z-]+\/svg$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate URLs with unique seeds for the same user', async () => {
    // Feature: profile-avatar-generator, Property 13: Valid DiceBear URL Format (unique seeds)
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        async (userId) => {
          // Generate multiple avatar URLs for the same user
          const url1 = await AvatarService.generateAvatarUrl({ userId });
          const url2 = await AvatarService.generateAvatarUrl({ userId });
          
          // Parse URLs
          const params1 = new URL(url1).searchParams;
          const params2 = new URL(url2).searchParams;
          
          // Verify seeds are different (ensuring variety)
          const seed1 = params1.get('seed');
          const seed2 = params2.get('seed');
          expect(seed1).not.toBe(seed2);
          
          // Verify both seeds are valid (non-empty)
          expect(seed1).toBeTruthy();
          expect(seed2).toBeTruthy();
        }
      ),
      { numRuns: 50 } // Fewer runs since we generate 2 URLs per iteration
    );
  });

  it('should generate URLs within maximum length constraint', async () => {
    // Feature: profile-avatar-generator, Property 13: Valid DiceBear URL Format (length constraint)
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        async (userId) => {
          // Generate avatar URL
          const avatarUrl = await AvatarService.generateAvatarUrl({ userId });
          
          // Verify URL length is within constraint
          expect(avatarUrl.length).toBeLessThanOrEqual(AVATAR_CONFIG.maxUrlLength);
          expect(avatarUrl.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle string and numeric userIds consistently', async () => {
    // Feature: profile-avatar-generator, Property 13: Valid DiceBear URL Format (userId types)
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId as number
        async (userId) => {
          // Generate URLs with numeric and string userIds
          const urlNumeric = await AvatarService.generateAvatarUrl({ userId });
          const urlString = await AvatarService.generateAvatarUrl({ userId: userId.toString() });
          
          // Both should be valid DiceBear URLs
          const urlObjNumeric = new URL(urlNumeric);
          const urlObjString = new URL(urlString);
          
          expect(urlObjNumeric.protocol).toBe('https:');
          expect(urlObjString.protocol).toBe('https:');
          
          expect(urlObjNumeric.hostname).toBe('api.dicebear.com');
          expect(urlObjString.hostname).toBe('api.dicebear.com');
          
          // Both should have all required parameters
          expect(urlObjNumeric.searchParams.has('seed')).toBe(true);
          expect(urlObjString.searchParams.has('seed')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
