'use strict';

const { randomUUID } = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const ApplicationHistoryService = require('./ApplicationHistoryService');
const AcceptanceTokenService = require('./AcceptanceTokenService');
const ResendService = require('./ResendService');
const EnrollmentService = require('./EnrollmentService');

// Valid status transitions per the state machine in the design doc
const VALID_TRANSITIONS = {
  draft:        ['submitted'],
  submitted:    ['under_review'],
  under_review: ['accepted', 'rejected', 'waitlisted'],
  waitlisted:   ['accepted', 'rejected'],
  accepted:     [],
  rejected:     [],
};

// Statuses that count as "pending" for duplicate detection
const PENDING_STATUSES = ['submitted', 'under_review', 'accepted'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeError(message, code, statusCode = 422) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

// ─── Task 5.1: submitApplication ────────────────────────────────────────────

/**
 * Submit a new application to a programme (public, no auth required).
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 1.1, 1.3, 1.4
 */
async function submitApplication(programmeId, { name, email, responses = {} }) {
  // Basic field validation
  if (!name || !name.trim()) {
    throw makeError('Applicant name is required', 'VALIDATION_ERROR', 400);
  }
  if (!email || !email.trim()) {
    throw makeError('Applicant email is required', 'VALIDATION_ERROR', 400);
  }

  // Load programme
  const programme = await db.programmes.findByPk(programmeId);
  if (!programme) {
    throw makeError('Programme not found', 'PROGRAMME_NOT_FOUND', 404);
  }

  // Must be in recruiting status
  if (programme.lifecycle_status !== 'recruiting') {
    throw makeError('Programme is not currently accepting applications', 'PROGRAMME_NOT_RECRUITING');
  }

  // Must not be code-only mode
  if (programme.onboarding_mode === 'code') {
    throw makeError('This programme does not accept applications', 'APPLICATIONS_NOT_ENABLED');
  }

  // Deadline check
  if (programme.application_deadline && new Date() > new Date(programme.application_deadline)) {
    throw makeError('The application deadline has passed', 'APPLICATION_DEADLINE_PASSED');
  }

  // Capacity check — all cohorts must not be full
  const cohorts = await db.cohorts.findAll({ where: { programme_id: programmeId } });
  if (cohorts.length > 0) {
    const allFull = await Promise.all(
      cohorts.map(async (cohort) => {
        if (!cohort.max_members) return false; // no cap
        const count = await db.enrollments.count({ where: { cohort_id: cohort.id } });
        return count >= cohort.max_members;
      })
    );
    if (allFull.every(Boolean)) {
      throw makeError('Programme has no remaining capacity', 'PROGRAMME_AT_CAPACITY');
    }
  }

  // Duplicate pending application check
  const duplicate = await db.applications.findOne({
    where: {
      programme_id: programmeId,
      applicant_email: email.trim().toLowerCase(),
      status: { [Op.in]: PENDING_STATUSES },
    },
  });
  if (duplicate) {
    throw makeError('An application from this email is already pending for this programme', 'DUPLICATE_APPLICATION', 409);
  }

  // Required template question validation
  const questions = await db.application_template_questions.findAll({
    where: { programme_id: programmeId, is_required: true },
  });
  for (const q of questions) {
    const answer = responses[q.id];
    if (answer === undefined || answer === null || answer === '') {
      throw makeError(`Required question "${q.question_text}" is not answered`, 'VALIDATION_ERROR', 400);
    }
  }

  // Auto-generate application_form_slug if not set
  if (!programme.application_form_slug) {
    await programme.update({ application_form_slug: randomUUID() });
  }

  // Create the application
  const application = await db.applications.create({
    programme_id: programmeId,
    applicant_name: name.trim(),
    applicant_email: email.trim().toLowerCase(),
    status: 'submitted',
    responses,
    submitted_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Record initial history transition: null → submitted
  await ApplicationHistoryService.recordTransition(application.id, {
    fromStatus: null,
    toStatus: 'submitted',
    changedBy: null,
    notes: 'Application submitted',
  });

  // Send confirmation email to applicant (graceful failure)
  try {
    await ResendService.sendEmail({
      to: application.applicant_email,
      type: 'notification',
      data: {
        title: 'Application Received',
        message: `Thank you for applying to ${programme.name}. We have received your application and will be in touch soon.`,
      },
    });
  } catch (emailErr) {
    console.warn('[ApplicationService] Failed to send applicant confirmation email:', emailErr.message);
  }

  // Notify convener (graceful failure) — load convener email via programme owner
  try {
    const convener = await db.users.findByPk(programme.created_by);
    if (convener && convener.email) {
      await ResendService.sendEmail({
        to: convener.email,
        type: 'notification',
        data: {
          title: 'New Application Received',
          message: `A new application has been submitted to your programme "${programme.name}" by ${application.applicant_name} (${application.applicant_email}).`,
        },
      });
    }
  } catch (emailErr) {
    console.warn('[ApplicationService] Failed to send convener notification email:', emailErr.message);
  }

  return application;
}

// ─── Task 5.2: Query methods ─────────────────────────────────────────────────

/**
 * Get paginated list of applications for a programme with optional filters.
 * Requirements: 4.1, 4.5, 4.6, 12.3
 */
async function getProgrammeApplications(programmeId, { status, sort = 'desc', cohortId, page = 1, limit = 20 } = {}) {
  const where = { programme_id: programmeId };
  if (status) where.status = status;
  if (cohortId) where.cohort_id = cohortId;

  const offset = (page - 1) * limit;
  const order = [['submitted_at', sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']];

  const { count, rows } = await db.applications.findAndCountAll({
    where,
    order,
    limit: parseInt(limit, 10),
    offset,
  });

  return {
    total: count,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    applications: rows,
  };
}

/**
 * Get status counts for all applications in a programme.
 * Requirements: 12.2
 */
async function getStatusCounts(programmeId) {
  const statuses = ['submitted', 'under_review', 'accepted', 'rejected', 'waitlisted'];
  const counts = { submitted: 0, under_review: 0, accepted: 0, rejected: 0, waitlisted: 0 };

  const results = await db.applications.findAll({
    where: { programme_id: programmeId },
    attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  for (const row of results) {
    if (statuses.includes(row.status)) {
      counts[row.status] = parseInt(row.count, 10);
    }
  }

  return counts;
}

/**
 * Get a single application by ID.
 * If status is 'submitted', auto-transitions to 'under_review'.
 * Requirements: 4.2, 4.3
 */
async function getApplication(applicationId, requestingUserId) {
  const application = await db.applications.findByPk(applicationId);
  if (!application) {
    throw makeError('Application not found', 'APPLICATION_NOT_FOUND', 404);
  }

  // Auto-transition submitted → under_review when a convener opens it
  if (application.status === 'submitted') {
    await transitionStatus(applicationId, 'under_review', { reviewerId: requestingUserId });
    await application.reload();
  }

  return application;
}

/**
 * Get all applications for a learner (by user_id or matching email).
 * Requirements: 9.1
 */
async function getLearnerApplications(userId) {
  // Find the user's email to also match by email
  const user = await db.users.findByPk(userId, { attributes: ['id', 'email'] });
  if (!user) {
    throw makeError('User not found', 'USER_NOT_FOUND', 404);
  }

  const applications = await db.applications.findAll({
    where: {
      [Op.or]: [
        { user_id: userId },
        { applicant_email: user.email.toLowerCase() },
      ],
    },
    include: [
      {
        model: db.programmes,
        as: 'programme',
        attributes: ['id', 'name'],
      },
    ],
    order: [['submitted_at', 'DESC']],
  });

  return applications;
}

/**
 * Export applications for a programme as a CSV string.
 * Requirements: 12.5
 */
async function exportApplicationsCsv(programmeId, requestingUserId) {
  const applications = await db.applications.findAll({
    where: { programme_id: programmeId },
    order: [['submitted_at', 'ASC']],
  });

  const headers = ['name', 'email', 'status', 'submitted_at', 'reviewer_notes'];
  const rows = applications.map((app) => [
    `"${(app.applicant_name || '').replace(/"/g, '""')}"`,
    `"${(app.applicant_email || '').replace(/"/g, '""')}"`,
    `"${app.status}"`,
    `"${app.submitted_at ? new Date(app.submitted_at).toISOString() : ''}"`,
    `"${(app.reviewer_notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ─── Task 5.3: Status transition methods ────────────────────────────────────

/**
 * Transition an application to a new status, enforcing the state machine.
 * Requirements: 5.1, 5.2, 5.3, 5.7, 6.1, 6.2, 6.3, 4.7, 8.1, 8.5
 */
async function transitionStatus(applicationId, newStatus, { reviewerId, cohortId, rejectionReason, notes } = {}) {
  const application = await db.applications.findByPk(applicationId);
  if (!application) {
    throw makeError('Application not found', 'APPLICATION_NOT_FOUND', 404);
  }

  const currentStatus = application.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw makeError(
      `Cannot transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${allowed.join(', ') || 'none'}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const updates = {
    status: newStatus,
    updated_at: new Date(),
  };

  if (reviewerId) updates.reviewer_id = reviewerId;

  if (newStatus === 'accepted') {
    if (!cohortId) {
      throw makeError('A cohort must be specified when accepting an application', 'COHORT_REQUIRED_FOR_ACCEPTANCE', 400);
    }

    // Check cohort capacity
    const cohort = await db.cohorts.findByPk(cohortId);
    if (!cohort) {
      throw makeError('Cohort not found', 'COHORT_NOT_FOUND', 404);
    }
    if (cohort.max_members) {
      const enrollmentCount = await db.enrollments.count({ where: { cohort_id: cohortId } });
      if (enrollmentCount >= cohort.max_members) {
        throw makeError('The specified cohort is at full capacity', 'COHORT_AT_CAPACITY');
      }
    }

    updates.cohort_id = cohortId;
    updates.decision_at = new Date();

    // Create acceptance token
    let tokenRecord;
    try {
      tokenRecord = await AcceptanceTokenService.createToken(
        applicationId,
        cohortId,
        application.applicant_email
      );
    } catch (tokenErr) {
      console.error('[ApplicationService] Failed to create acceptance token:', tokenErr.message);
      throw tokenErr;
    }

    // Send acceptance email (graceful failure)
    try {
      const programme = await db.programmes.findByPk(application.programme_id);
      const frontendUrl = process.env.FRONTEND_URL || '';
      const acceptLink = `${frontendUrl}/accept/${tokenRecord.token}`;
      await ResendService.sendEmail({
        to: application.applicant_email,
        type: 'notification',
        data: {
          title: `Congratulations! Your application to ${programme ? programme.name : 'the programme'} has been accepted`,
          message: `We are pleased to inform you that your application has been accepted. Click the link below to complete your enrolment.`,
          action_link: acceptLink,
          action_text: 'Complete Enrolment',
        },
      });
    } catch (emailErr) {
      console.warn('[ApplicationService] Failed to send acceptance email:', emailErr.message);
    }
  }

  if (newStatus === 'rejected') {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw makeError('A rejection reason is required', 'REJECTION_REASON_REQUIRED', 400);
    }
    updates.rejection_reason = rejectionReason.trim();
    updates.decision_at = new Date();

    // Send rejection email (graceful failure)
    try {
      const programme = await db.programmes.findByPk(application.programme_id);
      await ResendService.sendEmail({
        to: application.applicant_email,
        type: 'notification',
        data: {
          title: `Update on your application to ${programme ? programme.name : 'the programme'}`,
          message: `Thank you for your interest. After careful consideration, we are unable to offer you a place at this time. Reason: ${rejectionReason.trim()}`,
        },
      });
    } catch (emailErr) {
      console.warn('[ApplicationService] Failed to send rejection email:', emailErr.message);
    }
  }

  await application.update(updates);

  // Record history
  await ApplicationHistoryService.recordTransition(applicationId, {
    fromStatus: currentStatus,
    toStatus: newStatus,
    changedBy: reviewerId || null,
    notes: notes || null,
  });

  await application.reload();
  return application;
}

/**
 * Bulk transition multiple applications to a new status.
 * Requirements: 4.7
 */
async function bulkTransition(applicationIds, newStatus, { reviewerId, cohortId, rejectionReason } = {}) {
  const results = [];
  for (const id of applicationIds) {
    try {
      const updated = await transitionStatus(id, newStatus, { reviewerId, cohortId, rejectionReason });
      results.push({ id, success: true, application: updated });
    } catch (err) {
      results.push({ id, success: false, error: err.message, code: err.code });
    }
  }
  return results;
}

// ─── Task 5.4: Acceptance token redemption ───────────────────────────────────

/**
 * Redeem an acceptance token to enroll the applicant.
 * Requirements: 5.4, 5.5, 5.6
 *
 * If userId is null (new user path): validate token, return pre-fill data — do NOT consume yet.
 * If userId is provided: create enrollment, consume token, return enrolled result.
 */
async function redeemAcceptanceToken(token, userId) {
  // Validate token (throws TOKEN_NOT_FOUND / TOKEN_EXPIRED / TOKEN_ALREADY_USED)
  const tokenRecord = await AcceptanceTokenService.validateToken(token);

  const { cohort_id: cohortId, application_id: applicationId, applicant_email: applicantEmail } = tokenRecord;

  // Load application for pre-fill data
  const application = await db.applications.findByPk(applicationId);
  const programme = application ? await db.programmes.findByPk(application.programme_id) : null;

  if (!userId) {
    // New user path — return pre-fill data, do NOT consume token
    return {
      requiresSignup: true,
      prefill: {
        name: application ? application.applicant_name : '',
        email: applicantEmail,
      },
      cohortId,
      programmeId: application ? application.programme_id : null,
    };
  }

  // Existing user path — create enrollment and consume token
  const enrollment = await EnrollmentService.enrollLearner(userId, cohortId, {
    enrollmentSource: 'application',
    applicationId,
  });

  // Consume the token
  await AcceptanceTokenService.consumeToken(token);

  return {
    enrolled: true,
    cohortId,
    programmeId: application ? application.programme_id : null,
    enrollmentId: enrollment.id,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  submitApplication,
  getProgrammeApplications,
  getStatusCounts,
  getApplication,
  getLearnerApplications,
  exportApplicationsCsv,
  transitionStatus,
  bulkTransition,
  redeemAcceptanceToken,
  VALID_TRANSITIONS,
};
