'use strict';

const crypto = require('crypto');
const db = require('../models');

/**
 * Manages acceptance tokens for the post-acceptance onboarding flow.
 * Requirements: 5.3, 5.8
 */

const TOKEN_EXPIRY_DAYS = 7;

/**
 * Create a unique 64-char hex acceptance token for an accepted application.
 * @param {string} applicationId - UUID of the accepted application
 * @param {number} cohortId - Cohort the applicant will be enrolled into
 * @param {string} applicantEmail - Email address to send the token to
 * @returns {Promise<Object>} Created acceptance_token record
 */
async function createToken(applicationId, cohortId, applicantEmail) {
  const token = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  return db.acceptance_tokens.create({
    token,
    application_id: applicationId,
    cohort_id: cohortId,
    applicant_email: applicantEmail,
    expires_at: expiresAt,
    used_at: null,
    created_at: new Date(),
  });
}

/**
 * Validate a token and return its data.
 * Throws a structured error if the token is expired or already used.
 * @param {string} token - The raw token string
 * @returns {Promise<Object>} The acceptance_token record
 */
async function validateToken(token) {
  const record = await db.acceptance_tokens.findOne({ where: { token } });

  if (!record) {
    const err = new Error('Acceptance token not found');
    err.code = 'TOKEN_NOT_FOUND';
    throw err;
  }

  if (record.used_at) {
    const err = new Error('Acceptance token has already been used');
    err.code = 'TOKEN_ALREADY_USED';
    throw err;
  }

  if (new Date() > new Date(record.expires_at)) {
    const err = new Error('Acceptance token has expired');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  return record;
}

/**
 * Mark a token as consumed by setting used_at to now.
 * @param {string} token - The raw token string
 * @returns {Promise<Object>} Updated acceptance_token record
 */
async function consumeToken(token) {
  const record = await db.acceptance_tokens.findOne({ where: { token } });
  if (!record) {
    const err = new Error('Acceptance token not found');
    err.code = 'TOKEN_NOT_FOUND';
    throw err;
  }
  record.used_at = new Date();
  await record.save();
  return record;
}

module.exports = { createToken, validateToken, consumeToken };
