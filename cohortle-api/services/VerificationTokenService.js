'use strict';

/**
 * Verification Token Service
 * 
 * Manages verification token lifecycle for email verification.
 * Handles token generation, validation, invalidation, and cleanup.
 * 
 * Requirements: 4.1, 7.1, 7.2, 7.3, 7.4
 */

const crypto = require('crypto');
const { verification_tokens, users } = require('../models');
const { Op } = require('sequelize');
const { logSecurityEvent } = require('../utils/errorLogger');

class VerificationTokenService {
  /**
   * Generate a new verification token for a user
   * Creates a cryptographically secure random token (32 bytes, hex encoded = 64 chars)
   * Sets expiration to 24 hours from creation
   * Invalidates any existing tokens for the user
   * 
   * @param {number} userId - User ID
   * @returns {Promise<string>} - Verification token (64 character hex string)
   */
  static async generateToken(userId) {
    if (!userId) {
      throw new Error('User ID is required to generate verification token');
    }

    // Generate cryptographically secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Invalidate any existing unused tokens for this user
    await verification_tokens.update(
      { used_at: new Date() },
      {
        where: {
          user_id: userId,
          used_at: null,
        },
      }
    );

    // Create new verification token
    await verification_tokens.create({
      user_id: userId,
      token: token,
      expires_at: expiresAt,
      created_at: new Date(),
      used_at: null,
    });

    return token;
  }

  /**
   * Validate a verification token
   * Checks token existence, expiration, usage status, and user association
   * Logs all validation failures for security monitoring
   * 
   * @param {string} token - Token to validate
   * @returns {Promise<{valid: boolean, userId?: number, error?: string}>}
   */
  static async validateToken(token) {
    // Helper function to log validation failure
    const logValidationFailure = (reason, tokenValue = null) => {
      logSecurityEvent({
        type: 'token_validation_failed',
        timestamp: new Date().toISOString(),
        reason: reason,
        token: tokenValue ? `${tokenValue.substring(0, 8)}...` : 'N/A', // Log only first 8 chars for security
        action: 'email_verification_attempt',
      });
    };

    if (!token || typeof token !== 'string') {
      logValidationFailure('Invalid token format');
      return {
        valid: false,
        error: 'Invalid token format',
      };
    }

    // Check token format (should be 64 character hex string)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      logValidationFailure('Invalid token format', token);
      return {
        valid: false,
        error: 'Invalid token format',
      };
    }

    // Find token in database
    const tokenRecord = await verification_tokens.findOne({
      where: { token },
      include: [
        {
          model: users,
          as: 'user',
          attributes: ['id', 'email', 'email_verified'],
        },
      ],
    });

    if (!tokenRecord) {
      logValidationFailure('Token not found', token);
      return {
        valid: false,
        error: 'Token not found',
      };
    }

    // Check if token has been used
    if (tokenRecord.isUsed()) {
      logValidationFailure('Token already used', token);
      return {
        valid: false,
        error: 'Token already used',
      };
    }

    // Check if token has expired
    if (tokenRecord.isExpired()) {
      logValidationFailure('Token expired', token);
      return {
        valid: false,
        error: 'Token expired',
      };
    }

    // Check if user exists
    if (!tokenRecord.user) {
      logValidationFailure('User not found', token);
      return {
        valid: false,
        error: 'User not found',
      };
    }

    // Token is valid - no logging needed for successful validation
    return {
      valid: true,
      userId: tokenRecord.user_id,
    };
  }

  /**
   * Invalidate a token after successful verification
   * Marks the token as used with current timestamp
   * 
   * @param {string} token - Token to invalidate
   * @returns {Promise<void>}
   */
  static async invalidateToken(token) {
    if (!token) {
      throw new Error('Token is required for invalidation');
    }

    const tokenRecord = await verification_tokens.findOne({
      where: { token },
    });

    if (tokenRecord) {
      await tokenRecord.markAsUsed();
    }
  }

  /**
   * Clean up expired tokens (called by cron job)
   * Deletes tokens that have expired and been used or are older than 30 days
   * 
   * @returns {Promise<number>} - Number of tokens deleted
   */
  static async cleanupExpiredTokens() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await verification_tokens.destroy({
      where: {
        [Op.or]: [
          // Delete expired tokens that have been used
          {
            expires_at: { [Op.lt]: new Date() },
            used_at: { [Op.not]: null },
          },
          // Delete any tokens older than 30 days
          {
            created_at: { [Op.lt]: thirtyDaysAgo },
          },
        ],
      },
    });

    return result;
  }
}

module.exports = VerificationTokenService;
