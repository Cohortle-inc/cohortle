/**
 * FunnelService
 *
 * Business logic for the Cohortle marketing funnel.
 * Handles lead creation, retrieval, status updates, and email triggers.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.4, 8.5, 8.6
 */

const db = require('../models');
const ResendService = require('./ResendService');

const VALID_PROGRAMME_TYPES = ['fellowship', 'training', 'bootcamp', 'community', 'other'];
const VALID_STATUSES = ['new', 'contacted', 'demo_scheduled', 'demo_completed', 'partner'];

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract first name from a full name string
 * @param {string} fullName
 * @returns {string}
 */
function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.trim().split(/\s+/)[0];
}

class FunnelService {
  /**
   * Create a new lead from a submitted interest form.
   *
   * Validates required fields and email format, persists to funnel_leads,
   * and triggers the demo_booking_confirmation email.
   *
   * @param {Object} payload - Lead data from the interest form
   * @returns {Promise<Object>} - Created FunnelLead record
   * @throws {{ status: number, message: string }} - Validation or DB errors
   *
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async createLead(payload) {
    const { organisation_name, contact_name, email, programme_type } = payload;

    // Validate required fields (Req 4.3)
    const missingFields = [];
    if (!organisation_name) missingFields.push('organisation_name');
    if (!contact_name) missingFields.push('contact_name');
    if (!email) missingFields.push('email');
    if (!programme_type) missingFields.push('programme_type');

    if (missingFields.length > 0) {
      throw {
        status: 400,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        fields: missingFields,
      };
    }

    // Validate email format (Req 4.4)
    if (!isValidEmail(email)) {
      throw {
        status: 400,
        message: 'Invalid email address format',
        fields: ['email'],
      };
    }

    // Validate programme_type enum
    if (!VALID_PROGRAMME_TYPES.includes(programme_type)) {
      throw {
        status: 400,
        message: `Invalid programme_type. Must be one of: ${VALID_PROGRAMME_TYPES.join(', ')}`,
        fields: ['programme_type'],
      };
    }

    // Persist to DB (Req 4.2)
    const lead = await db.FunnelLead.create({
      organisation_name,
      contact_name,
      email,
      phone: payload.phone || null,
      website: payload.website || null,
      programme_type,
      participant_count: payload.participant_count || null,
      current_tools: payload.current_tools || null,
      pain_points: payload.pain_points || null,
      cohort_start_date: payload.cohort_start_date || null,
      demo_scheduled_at: payload.demo_scheduled_at || null,
      status: 'new',
    });

    // Trigger booking confirmation email (Req 4.5, 6.1)
    const confirmationUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/apply/confirmation`
      : '/apply/confirmation';

    const demoDate = lead.demo_scheduled_at
      ? new Date(lead.demo_scheduled_at).toLocaleString('en-GB', {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : 'TBC';

    ResendService.sendEmail({
      to: lead.email,
      type: 'demo_booking_confirmation',
      data: {
        first_name: getFirstName(lead.contact_name),
        organisation_name: lead.organisation_name,
        demo_date: demoDate,
        confirmation_url: confirmationUrl,
      },
    }).catch((err) => {
      console.error('[FunnelService] Failed to send booking confirmation email:', err);
    });

    // Notify the team of the new lead
    const leadsUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/internal/leads`
      : '/internal/leads';

    ResendService.sendEmail({
      to: 'team@cohortle.com',
      type: 'new_lead_notification',
      data: {
        organisation_name: lead.organisation_name,
        contact_name: lead.contact_name,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        programme_type: lead.programme_type,
        participant_count: lead.participant_count,
        current_tools: lead.current_tools,
        pain_points: lead.pain_points,
        cohort_start_date: lead.cohort_start_date,
        demo_scheduled_at: lead.demo_scheduled_at,
        leads_url: leadsUrl,
      },
    }).catch((err) => {
      console.error('[FunnelService] Failed to send team lead notification:', err);
    });

    return lead;
  }

  /**
   * Retrieve all leads ordered by creation date descending.
   *
   * @returns {Promise<Array>} - Array of FunnelLead records
   *
   * Requirements: 4.6
   */
  async getLeads() {
    return db.FunnelLead.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Update the status of a lead.
   *
   * @param {string} id - Lead UUID
   * @param {string} status - New status value
   * @returns {Promise<Object>} - Updated FunnelLead record
   * @throws {{ status: number, message: string }} - Validation or not-found errors
   *
   * Requirements: 8.4, 8.5, 8.6
   */
  async updateStatus(id, status) {
    // Validate status enum (Req 8.4)
    if (!VALID_STATUSES.includes(status)) {
      throw {
        status: 400,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      };
    }

    // Find the lead (Req 8.6)
    const lead = await db.FunnelLead.findByPk(id);
    if (!lead) {
      throw {
        status: 404,
        message: 'Lead not found',
      };
    }

    // Update and return (Req 8.5)
    await lead.update({ status });
    return lead;
  }

  /**
   * Trigger the post-demo closing email for a lead.
   *
   * @param {string} id - Lead UUID
   * @returns {Promise<Object>} - The lead record
   * @throws {{ status: number, message: string }} - Not-found errors
   *
   * Requirements: 8.1, 8.2, 8.3
   */
  async triggerClosingEmail(id) {
    const lead = await db.FunnelLead.findByPk(id);
    if (!lead) {
      throw {
        status: 404,
        message: 'Lead not found',
      };
    }

    const onboardingUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/apply`
      : '/apply';

    await ResendService.sendEmail({
      to: lead.email,
      type: 'demo_follow_up',
      data: {
        first_name: getFirstName(lead.contact_name),
        organisation_name: lead.organisation_name,
        onboarding_url: onboardingUrl,
      },
    });

    return lead;
  }
}

module.exports = new FunnelService();
