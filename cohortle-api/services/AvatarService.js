const crypto = require('crypto');
const { AVATAR_CONFIG } = require('../config/avatar');

/**
 * Service for generating culturally appropriate profile avatars using DiceBear API
 * 
 * This service provides methods to generate unique, diverse avatar URLs that reflect
 * African representation and align with Cohortle's brand identity.
 * 
 * Requirements: 1.2, 2.1, 2.4, 3.1, 3.2, 4.2, 5.1, 5.2, 5.4, 5.5
 */
class AvatarService {
  /**
   * Generates a unique seed for avatar generation
   * Combines userId, timestamp, and random value for uniqueness
   * 
   * @param {string|number} userId - User ID for additional entropy
   * @returns {string} - Unique seed string
   * 
   * Requirements: 2.4
   */
  generateSeed(userId) {
    const timestamp = Date.now();
    const randomValue = crypto.randomBytes(8).toString('hex');
    return `user-${userId}-${timestamp}-${randomValue}`;
  }

  /**
   * Builds DiceBear API URL with parameters
   * Constructs a complete URL with style, seed, and customisation parameters
   * 
   * @param {string} seed - Unique seed for avatar generation
   * @param {string} style - Avatar style (default: from config)
   * @param {Object} params - Additional parameters
   * @param {string} [params.backgroundColor] - Background colour (hex without #)
   * @param {string} [params.skinColor] - Skin tone (hex without #)
   * @param {number} [params.size] - Avatar size in pixels
   * @returns {string} - Complete DiceBear URL
   * 
   * Requirements: 2.1, 3.1, 3.2, 5.1
   */
  buildDiceBearUrl(seed, style = AVATAR_CONFIG.style, params = {}) {
    // Select random background colour if not provided
    const backgroundColor = params.backgroundColor || 
      this._selectRandom(AVATAR_CONFIG.backgroundColors);
    
    // Select random skin tone if not provided
    const skinColor = params.skinColor || 
      this._selectRandom(AVATAR_CONFIG.skinTones);
    
    // Use default size if not provided
    const size = params.size || AVATAR_CONFIG.defaultSize;
    
    // Construct URL with query parameters
    const baseUrl = `${AVATAR_CONFIG.baseUrl}/${style}/svg`;
    const queryParams = new URLSearchParams({
      seed,
      backgroundColor,
      skinColor,
      size: size.toString(),
    });
    
    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Validates that an avatar URL meets requirements
   * Checks URL format and length constraints
   * 
   * @param {string} url - Avatar URL to validate
   * @returns {Object} - Validation result with isValid flag and error message
   * 
   * Requirements: 4.2, 5.2
   */
  validateAvatarUrl(url) {
    // Check if URL is provided
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'Avatar URL is required and must be a string',
      };
    }
    
    // Check URL length
    if (url.length > AVATAR_CONFIG.maxUrlLength) {
      return {
        isValid: false,
        error: `Avatar URL exceeds maximum length of ${AVATAR_CONFIG.maxUrlLength} characters`,
      };
    }
    
    // Check URL format (must be HTTPS and from DiceBear)
    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol !== 'https:') {
        return {
          isValid: false,
          error: 'Avatar URL must use HTTPS protocol',
        };
      }
      
      if (!urlObj.hostname.includes('dicebear.com')) {
        return {
          isValid: false,
          error: 'Avatar URL must be from DiceBear API',
        };
      }
      
      return {
        isValid: true,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Avatar URL is not a valid URL',
      };
    }
  }

  /**
   * Generates a new avatar URL for a user
   * Main entry point for avatar generation
   * 
   * @param {Object} options - Generation options
   * @param {string|number} options.userId - User ID for seed generation
   * @param {string} [options.style] - Avatar style (default: from config)
   * @param {Object} [options.customisation] - Optional customisation parameters
   * @returns {Promise<string>} - Generated avatar URL
   * @throws {Error} - If URL generation or validation fails
   * 
   * Requirements: 1.2, 2.1, 2.4, 3.1, 3.2, 5.1, 5.2, 5.4
   */
  async generateAvatarUrl(options) {
    const startTime = Date.now();
    
    try {
      // Validate userId is provided
      if (!options.userId) {
        const error = new Error('User ID is required for avatar generation');
        console.error('[AvatarService] Avatar generation failed:', {
          error: error.message,
          userId: options.userId || 'undefined',
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        });
        throw error;
      }
      
      // Generate unique seed
      const seed = this.generateSeed(options.userId);
      
      // Build DiceBear URL
      const style = options.style || AVATAR_CONFIG.style;
      const params = options.customisation || {};
      const avatarUrl = this.buildDiceBearUrl(seed, style, params);
      
      // Validate generated URL
      const validation = this.validateAvatarUrl(avatarUrl);
      if (!validation.isValid) {
        const error = new Error(`Avatar URL validation failed: ${validation.error}`);
        console.error('[AvatarService] Avatar URL validation failed:', {
          error: validation.error,
          userId: options.userId,
          urlLength: avatarUrl.length,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        });
        throw error;
      }
      
      // Log successful generation (info level)
      console.log('[AvatarService] Avatar generated successfully:', {
        userId: options.userId,
        urlLength: avatarUrl.length,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      });
      
      return avatarUrl;
    } catch (error) {
      // Log error with full context (no sensitive data)
      console.error('[AvatarService] Error generating avatar URL:', {
        error: error.message,
        userId: options.userId || 'undefined',
        style: options.style || AVATAR_CONFIG.style,
        hasCustomisation: !!options.customisation,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Selects a random item from an array
   * Private helper method
   * 
   * @param {Array} array - Array to select from
   * @returns {*} - Random item from array
   * @private
   */
  _selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = new AvatarService();
