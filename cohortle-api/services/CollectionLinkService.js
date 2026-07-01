'use strict';

/**
 * Collection Link Service
 *
 * Manages testimonial collection link lifecycle:
 * - Token generation and URL construction
 * - Idempotent link creation per cohort/convener pair
 * - Revocation and regeneration
 * - Token validation (404 / 410 semantics)
 * - Testimonial submission via a valid link
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 3.5,
 *               4.2, 4.3, 4.4, 4.5, 4.6
 */

const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');

// Error codes used in API responses
const ERRORS = {
  LINK_NOT_FOUND: 'LINK_NOT_FOUND',
  LINK_EXPIRED: 'LINK_EXPIRED',
  NOT_ENROLLED: 'NOT_ENROLLED',
  ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN: 'FORBIDDEN',
};

class CollectionLinkService {
  // ─── Token helpers ────────────────────────────────────────────────────────

  /**
   * Generate a cryptographically random 64-character hex token.
   * @returns {string}
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Build the public-facing shareable URL for a token.
   * @param {string} token
   * @returns {string}
   */
  static buildUrl(token) {
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${base}/testimonial/${token}`;
  }

  /**
   * Get the current (non-revoked) link for a cohort, with submission count.
   * Returns null if no active link exists.
   */
  static async getLinkForCohort(cohortId, convenerUserId) {
    const link = await db.testimonial_collection_links.findOne({
      where: {
        cohort_id: cohortId,
        convener_user_id: convenerUserId,
      },
      order: [['created_at', 'DESC']],
    });

    if (!link) return null;

    const submissionCount = await db.testimonial_submissions.count({
      where: { collection_link_id: link.id },
    });

    let status = 'active';
    if (link.revoked_at) {
      status = 'revoked';
    } else if (link.expires_at && new Date(link.expires_at) < new Date()) {
      status = 'expired';
    }

    return {
      ...link.toJSON(),
      submission_count: submissionCount,
      status,
      url: CollectionLinkService.buildUrl(link.token),
    };
  }

  // ─── Convener management ─────────────────────────────────────────────────

  /**
   * Idempotent: return the existing non-revoked link for this cohort/convener,
   * or create a new one.
   *
   * Requirements: 1.1, 1.3
   * @param {number} cohortId
   * @param {number} convenerUserId
   * @returns {Promise<{link: object, url: string}>}
   */
  static async getOrCreateLink(cohortId, convenerUserId) {
    const existing = await db.testimonial_collection_links.findOne({
      where: {
        cohort_id: cohortId,
        convener_user_id: convenerUserId,
        revoked_at: null,
      },
    });

    if (existing) {
      return { link: existing, url: CollectionLinkService.buildUrl(existing.token) };
    }

    const token = CollectionLinkService.generateToken();
    const link = await db.testimonial_collection_links.create({
      token,
      cohort_id: cohortId,
      convener_user_id: convenerUserId,
      auto_approve: false,
      expires_at: null,
      revoked_at: null,
    });

    return { link, url: CollectionLinkService.buildUrl(token) };
  }

  /**
   * Revoke the active link for a cohort/convener pair.
   *
   * Requirements: 2.4
   * @param {number} cohortId
   * @param {number} convenerUserId
   * @returns {Promise<void>}
   */
  static async revokeLink(cohortId, convenerUserId) {
    await db.testimonial_collection_links.update(
      { revoked_at: new Date() },
      {
        where: {
          cohort_id: cohortId,
          convener_user_id: convenerUserId,
          revoked_at: null,
        },
      }
    );
  }

  /**
   * Revoke the current token and issue a fresh one.
   *
   * Requirements: 1.6
   * @param {number} cohortId
   * @param {number} convenerUserId
   * @returns {Promise<{link: object, url: string}>}
   */
  static async regenerateLink(cohortId, convenerUserId) {
    await CollectionLinkService.revokeLink(cohortId, convenerUserId);

    const token = CollectionLinkService.generateToken();
    const link = await db.testimonial_collection_links.create({
      token,
      cohort_id: cohortId,
      convener_user_id: convenerUserId,
      auto_approve: false,
      expires_at: null,
      revoked_at: null,
    });

    return { link, url: CollectionLinkService.buildUrl(token) };
  }

  /**
   * Update auto_approve and/or expires_at on the active link.
   *
   * Requirements: 2.2, 2.3
   * @param {number} cohortId
   * @param {number} convenerUserId
   * @param {{ auto_approve?: boolean, expires_at?: string|null }} settings
   * @returns {Promise<object>} Updated link
   */
  static async updateLinkSettings(cohortId, convenerUserId, settings) {
    const link = await db.testimonial_collection_links.findOne({
      where: {
        cohort_id: cohortId,
        convener_user_id: convenerUserId,
        revoked_at: null,
      },
    });

    if (!link) {
      const err = new Error('No active link found for this cohort');
      err.code = ERRORS.LINK_NOT_FOUND;
      err.status = 404;
      throw err;
    }

    const updates = {};
    if (typeof settings.auto_approve === 'boolean') {
      updates.auto_approve = settings.auto_approve;
    }
    if ('expires_at' in settings) {
      updates.expires_at = settings.expires_at ? new Date(settings.expires_at) : null;
    }
    updates.updated_at = new Date();

    await link.update(updates);
    return link;
  }

  /**
   * List all collection links for a convener, with submission counts and status.
   *
   * Requirements: 2.1
   * @param {number} convenerUserId
   * @returns {Promise<Array>}
   */
  static async listLinksForConvener(convenerUserId) {
    const links = await db.testimonial_collection_links.findAll({
      where: { convener_user_id: convenerUserId },
      order: [['created_at', 'DESC']],
    });

    // Attach submission counts and status
    const results = await Promise.all(
      links.map(async (link) => {
        const submissionCount = await db.testimonial_submissions.count({
          where: { collection_link_id: link.id },
        });

        let status = 'active';
        if (link.revoked_at) {
          status = 'revoked';
        } else if (link.expires_at && new Date(link.expires_at) < new Date()) {
          status = 'expired';
        }

        return {
          ...link.toJSON(),
          submission_count: submissionCount,
          status,
          url: CollectionLinkService.buildUrl(link.token),
        };
      })
    );

    return results;
  }

  // ─── Public token validation ──────────────────────────────────────────────

  /**
   * Validate a token and return cohort/programme info.
   * Throws with .code = LINK_NOT_FOUND (404) or LINK_EXPIRED (410).
   *
   * Requirements: 3.2, 3.3
   * @param {string} token
   * @returns {Promise<{link: object, cohort: object, programme: object}>}
   */
  static async validateToken(token) {
    const link = await db.testimonial_collection_links.findOne({
      where: { token },
    });

    if (!link || link.revoked_at) {
      const err = new Error('Collection link not found or has been revoked');
      err.code = ERRORS.LINK_NOT_FOUND;
      err.status = 404;
      throw err;
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      const err = new Error('Collection link has expired');
      err.code = ERRORS.LINK_EXPIRED;
      err.status = 410;
      throw err;
    }

    // Load cohort and programme info
    const cohort = await db.cohorts.findByPk(link.cohort_id, {
      include: [{ model: db.programmes, as: 'programme' }],
    });

    return { link, cohort };
  }

  // ─── Learner submission ───────────────────────────────────────────────────

  /**
   * Submit a testimonial via a collection link.
   *
   * Requirements: 3.4, 3.5, 4.2, 4.3, 4.4, 4.5, 4.6
   * @param {string} token
   * @param {number} learnerUserId
   * @param {{ quote: string, rating: number, display_name?: string }} body
   * @returns {Promise<{testimonial_id: number}>}
   */
  static async submitTestimonial(token, learnerUserId, body) {
    // 1. Validate token
    const { link, cohort } = await CollectionLinkService.validateToken(token);

    // 2. Check enrollment
    const enrollment = await db.enrollments.findOne({
      where: {
        user_id: learnerUserId,
        cohort_id: link.cohort_id,
      },
    });

    if (!enrollment) {
      const err = new Error('Learner is not enrolled in this cohort');
      err.code = ERRORS.NOT_ENROLLED;
      err.status = 403;
      throw err;
    }

    // 3. Check for duplicate submission
    const existing = await db.testimonial_submissions.findOne({
      where: {
        collection_link_id: link.id,
        learner_user_id: learnerUserId,
      },
    });

    if (existing) {
      const err = new Error('You have already submitted a testimonial via this link');
      err.code = ERRORS.ALREADY_SUBMITTED;
      err.status = 409;
      throw err;
    }

    // 4. Validate quote and rating
    const { quote, rating, display_name } = body;

    if (!quote || typeof quote !== 'string' || quote.trim().length < 10) {
      const err = new Error('Quote must be at least 10 characters');
      err.code = ERRORS.VALIDATION_ERROR;
      err.status = 400;
      throw err;
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      const err = new Error('Rating must be an integer between 1 and 5');
      err.code = ERRORS.VALIDATION_ERROR;
      err.status = 400;
      throw err;
    }

    // 5. Resolve learner name and programme name
    const learner = await db.users.findByPk(learnerUserId, {
      attributes: ['id', 'first_name', 'last_name', 'email'],
    });

    const fullName = [learner.first_name, learner.last_name].filter(Boolean).join(' ').trim();
    const learnerName = display_name || fullName || learner.email;
    const programmeName = cohort.programme ? cohort.programme.name : '';

    // 6. Create testimonial record
    const testimonial = await db.testimonials.create({
      user_id: link.convener_user_id,
      learner_name: learnerName,
      learner_avatar: null,
      programme_name: programmeName,
      quote: quote.trim(),
      rating: ratingNum,
      is_featured: link.auto_approve,
    });

    // 7. Record submission for deduplication
    await db.testimonial_submissions.create({
      collection_link_id: link.id,
      learner_user_id: learnerUserId,
      testimonial_id: testimonial.id,
    });

    return { testimonial_id: testimonial.id };
  }
}

CollectionLinkService.ERRORS = ERRORS;

module.exports = CollectionLinkService;
