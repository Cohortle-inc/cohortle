const fc = require('fast-check');
const AvatarService = require('../../services/AvatarService');

/**
 * Property-Based Tests for Avatar Variety Through Unique Seeds
 * 
 * Feature: profile-avatar-generator
 * Property 5: Avatar Variety Through Unique Seeds
 * 
 * Validates: Requirements 2.4
 * 
 * This property ensures that each avatar generation produces different seed values,
 * ensuring visual variety when users regenerate their avatars.
 */

describe('Property 5: Avatar Variety Through Unique Seeds', () => {
  it('should generate unique seeds for consecutive avatar generations', () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (userId) => {
          // Generate multiple seeds for the same user
          const seed1 = AvatarService.generateSeed(userId);
          const seed2 = AvatarService.generateSeed(userId);
          const seed3 = AvatarService.generateSeed(userId);
          
          // Verify all seeds are different
          expect(seed1).not.toBe(seed2);
          expect(seed2).not.toBe(seed3);
          expect(seed1).not.toBe(seed3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique avatar URLs for consecutive generations', async () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds (URL level)
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100000 }),
        async (userId) => {
          // Generate multiple avatar URLs for the same user
          const url1 = await AvatarService.generateAvatarUrl({ userId });
          const url2 = await AvatarService.generateAvatarUrl({ userId });
          const url3 = await AvatarService.generateAvatarUrl({ userId });
          
          // Extract seeds from URLs
          const parsedUrl1 = new URL(url1);
          const parsedUrl2 = new URL(url2);
          const parsedUrl3 = new URL(url3);
          
          const seed1 = parsedUrl1.searchParams.get('seed');
          const seed2 = parsedUrl2.searchParams.get('seed');
          const seed3 = parsedUrl3.searchParams.get('seed');
          
          // Verify all seeds are different
          expect(seed1).not.toBe(seed2);
          expect(seed2).not.toBe(seed3);
          expect(seed1).not.toBe(seed3);
          
          // Verify all URLs are different
          expect(url1).not.toBe(url2);
          expect(url2).not.toBe(url3);
          expect(url1).not.toBe(url3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique seeds across different users', () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds (cross-user)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 100000 }),
        (userId1, userId2) => {
          fc.pre(userId1 !== userId2); // Ensure different users
          
          // Generate seeds for different users
          const seed1 = AvatarService.generateSeed(userId1);
          const seed2 = AvatarService.generateSeed(userId2);
          
          // Seeds should be different for different users
          expect(seed1).not.toBe(seed2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain seed uniqueness in rapid succession', () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds (timing)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (userId) => {
          // Generate multiple seeds rapidly
          const seeds = [];
          for (let i = 0; i < 10; i++) {
            seeds.push(AvatarService.generateSeed(userId));
          }
          
          // Verify all seeds are unique
          const uniqueSeeds = new Set(seeds);
          expect(uniqueSeeds.size).toBe(seeds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure seed variety across large generation batches', () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds (batch)
    
    const userId = 12345;
    const numGenerations = 100;
    const seeds = [];
    
    // Generate many seeds
    for (let i = 0; i < numGenerations; i++) {
      seeds.push(AvatarService.generateSeed(userId));
    }
    
    // Verify all seeds are unique
    const uniqueSeeds = new Set(seeds);
    expect(uniqueSeeds.size).toBe(numGenerations);
  });

  it('should produce different avatar URLs even with same parameters', async () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds (parameter consistency)
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100000 }),
        async (userId) => {
          // Generate multiple avatars with identical parameters
          const options = { userId };
          const url1 = await AvatarService.generateAvatarUrl(options);
          const url2 = await AvatarService.generateAvatarUrl(options);
          
          // URLs should be different due to different seeds
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate seeds with sufficient entropy', () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds (entropy)
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (userId) => {
          const seed = AvatarService.generateSeed(userId);
          
          // Verify seed is non-empty
          expect(seed).toBeTruthy();
          expect(seed.length).toBeGreaterThan(0);
          
          // Verify seed contains some randomness (not just userId)
          expect(seed).not.toBe(userId.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure seed uniqueness across concurrent generations', () => {
    // Feature: profile-avatar-generator, Property 5: Avatar Variety Through Unique Seeds (concurrency)
    
    const userId = 67890;
    const numConcurrent = 50;
    
    // Generate seeds concurrently
    const seeds = Array.from({ length: numConcurrent }, () => 
      AvatarService.generateSeed(userId)
    );
    
    // Verify all seeds are unique
    const uniqueSeeds = new Set(seeds);
    expect(uniqueSeeds.size).toBe(numConcurrent);
  });
});
