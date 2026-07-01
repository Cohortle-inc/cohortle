require("dotenv").config();

/**
 * Avatar Configuration for DiceBear API Integration
 * 
 * This configuration defines settings for generating culturally appropriate
 * profile avatars using the DiceBear Avatars API.
 * 
 * @see https://dicebear.com
 */

const AVATAR_CONFIG = {
  // Primary avatar style - 'big-smile' provides diverse, friendly avatars
  style: 'big-smile',
  
  // DiceBear API base URL (version 7.x)
  baseUrl: 'https://api.dicebear.com/7.x',
  
  // Default avatar size in pixels
  defaultSize: 200,
  
  // Cohortle brand colours for avatar backgrounds
  // These colours align with the platform's visual identity
  backgroundColors: [
    'b6e3f4', // Light blue
    'c2f0c2', // Light green
    'ffd4a3', // Light orange
    'e6ccff', // Light purple
  ],
  
  // Diverse African skin tones
  // Provides culturally appropriate representation reflecting African diversity
  skinTones: [
    'ae5d29', // Medium brown
    '614335', // Deep brown
    'd08b5b', // Light brown
    '8d5524', // Rich brown
    'a55728', // Warm brown
  ],
  
  // Request timeout for external API calls (milliseconds)
  requestTimeout: 10000, // 10 seconds
  
  // Maximum URL length for profile_image field in database
  maxUrlLength: 500,
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // Maximum 5 avatar generations per minute per user
  },
};

/**
 * Validates that the avatar configuration is properly set up
 * @returns {boolean} True if configuration is valid
 */
function validateAvatarConfig() {
  const requiredFields = ['style', 'baseUrl', 'backgroundColors', 'skinTones'];
  
  for (const field of requiredFields) {
    if (!AVATAR_CONFIG[field]) {
      console.error(`❌ Avatar configuration missing required field: ${field}`);
      return false;
    }
  }
  
  if (AVATAR_CONFIG.backgroundColors.length === 0) {
    console.error('❌ Avatar configuration must include at least one background colour');
    return false;
  }
  
  if (AVATAR_CONFIG.skinTones.length === 0) {
    console.error('❌ Avatar configuration must include at least one skin tone');
    return false;
  }
  
  return true;
}

// Validate configuration on module load
if (!validateAvatarConfig()) {
  console.warn('⚠️  Avatar configuration validation failed. Avatar generation may not work correctly.');
}

module.exports = {
  AVATAR_CONFIG,
  validateAvatarConfig,
};
