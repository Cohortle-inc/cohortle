const resendClient = require('../lib/resend');
const errorLogger = require('../utils/errorLogger');

const SENDER_EMAIL = 'noreply@mail.cohortle.com';
const SENDER_NAME = 'Cohortle';

/**
 * Email template definitions
 */
const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to Cohortle!',
    getHtml: (data) => {
      // Check if email verification is required (MVP mode)
      const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
      const dashboardUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : '#';
      
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .highlight { background-color: #EEF2FF; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Cohortle!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.first_name || 'there'},</p>
              <p>Welcome to Cohortle! We're excited to have you join our learning community.</p>
              ${requireVerification && data.verification_link ? `
                <p>To get started, please verify your email address:</p>
                <p><a href="${data.verification_link}" class="button">Verify Your Email</a></p>
              ` : `
                <div class="highlight">
                  <p><strong>You're all set!</strong> Your account is ready to go.</p>
                </div>
                <p><strong>Get started now:</strong></p>
                <ul>
                  <li>Browse and join learning programmes</li>
                  <li>Connect with fellow learners in cohorts</li>
                  <li>Track your progress and achievements</li>
                </ul>
                <p style="text-align: center;"><a href="${dashboardUrl}" class="button">Go to Your Dashboard</a></p>
              `}
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Happy learning!</p>
              <p>The Cohortle Team</p>
            </div>
          </div>
        </body>
      </html>
      `;
    }
  },
  password_reset: {
    subject: 'Reset Your Cohortle Password',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .warning { background-color: #FEF3C7; padding: 10px; border-left: 4px solid #F59E0B; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${data.first_name || 'there'},</p>
              <p>We received a request to reset your Cohortle password.</p>
              <p><a href="${data.reset_link}" class="button">Reset Password</a></p>
              <div class="warning">
                <strong>Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${data.reset_link}</p>
              <p>The Cohortle Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  enrollment_confirmation: {
    subject: 'Enrollment Confirmed',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .details { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Enrollment Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.first_name || 'there'},</p>
              <p>Congratulations! You've successfully enrolled in a programme.</p>
              <div class="details">
                <div class="details-row">
                  <strong>Programme:</strong>
                  <span>${data.programme_name}</span>
                </div>
                <div class="details-row">
                  <strong>Cohort:</strong>
                  <span>${data.cohort_name}</span>
                </div>
                <div class="details-row">
                  <strong>Start Date:</strong>
                  <span>${data.start_date}</span>
                </div>
              </div>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Check your dashboard for programme materials</li>
                <li>Join the cohort community to connect with peers</li>
                <li>Mark your calendar for the start date</li>
              </ul>
              <p>We're excited to have you on this learning journey!</p>
              <p>The Cohortle Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  demo_booking_confirmation: {
    subject: 'Your Cohortle Demo is Confirmed',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .agenda { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #4F46E5; }
            .agenda ol { margin: 10px 0; padding-left: 20px; }
            .agenda li { padding: 6px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Demo Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.first_name || 'there'},</p>
              <p>Great news — your demo for <strong>${data.organisation_name || 'your organisation'}</strong> is confirmed.</p>
              <p><strong>Demo Date:</strong> ${data.demo_date || 'To be confirmed'}</p>
              <div class="agenda">
                <p><strong>What we'll cover in your demo:</strong></p>
                <ol>
                  <li>Understand your programme</li>
                  <li>Walk through Cohortle</li>
                  <li>Define next steps</li>
                </ol>
              </div>
              <p>To review your booking details or make changes, visit your confirmation page:</p>
              <p><a href="${data.confirmation_url || '#'}" class="button">View Confirmation</a></p>
              <p>We look forward to speaking with you!</p>
              <p>The Cohortle Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  demo_follow_up: {
    subject: 'Next Steps After Your Cohortle Demo',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .highlight { background-color: #EEF2FF; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Time!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.first_name || 'there'},</p>
              <p>Thank you for taking the time to demo Cohortle with us. It was great learning more about <strong>${data.organisation_name || 'your organisation'}</strong> and how we can support your programme.</p>
              <div class="highlight">
                <p><strong>Your next step:</strong> Start your onboarding or pilot programme setup to get your first cohort running on Cohortle.</p>
              </div>
              <p>Click below to begin your onboarding journey:</p>
              <p><a href="${data.onboarding_url || '#'}" class="button">Begin Onboarding</a></p>
              <p>If you have any questions before getting started, just reply to this email — we're here to help.</p>
              <p>The Cohortle Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  new_lead_notification: {
    subject: (data) => `New Lead: ${data.organisation_name || 'Unknown Organisation'}`,
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .field { padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Lead Submitted</h1>
            </div>
            <div class="content">
              <p>A new interest form has been submitted. Here are the details:</p>
              <div class="field"><span class="label">Organisation:</span> ${data.organisation_name || '—'}</div>
              <div class="field"><span class="label">Contact Name:</span> ${data.contact_name || '—'}</div>
              <div class="field"><span class="label">Email:</span> ${data.email || '—'}</div>
              <div class="field"><span class="label">Phone:</span> ${data.phone || '—'}</div>
              <div class="field"><span class="label">Website:</span> ${data.website || '—'}</div>
              <div class="field"><span class="label">Programme Type:</span> ${data.programme_type || '—'}</div>
              <div class="field"><span class="label">Participant Count:</span> ${data.participant_count || '—'}</div>
              <div class="field"><span class="label">Current Tools:</span> ${data.current_tools || '—'}</div>
              <div class="field"><span class="label">Pain Points:</span> ${data.pain_points || '—'}</div>
              <div class="field"><span class="label">Cohort Start Date:</span> ${data.cohort_start_date || '—'}</div>
              <div class="field"><span class="label">Demo Scheduled:</span> ${data.demo_scheduled_at || '—'}</div>
              <br>
              <p style="color: #888; font-size: 13px;">View and manage leads in the <a href="${data.leads_url || '#'}">admin dashboard</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  demo_reminder: {
    subject: 'Reminder: Your Cohortle Demo is Coming Up',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .checklist { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .checklist ul { margin: 10px 0; padding-left: 20px; }
            .checklist li { padding: 4px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Demo Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${data.first_name || 'there'},</p>
              <p>Just a friendly reminder that your Cohortle demo for <strong>${data.organisation_name || 'your organisation'}</strong> is coming up${data.demo_date ? ` on <strong>${data.demo_date}</strong>` : ' soon'}.</p>
              <div class="checklist">
                <p><strong>To make the most of your demo, please prepare:</strong></p>
                <ul>
                  <li>A description of your current programme structure</li>
                  <li>Your biggest operational challenge right now</li>
                  <li>Your goals for the next cohort</li>
                </ul>
              </div>
              ${data.confirmation_url ? `<p><a href="${data.confirmation_url}" class="button">View Booking Details</a></p>` : ''}
              <p>We look forward to speaking with you!</p>
              <p>The Cohortle Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  notification: {
    subject: (data) => data.title || 'Notification from Cohortle',
    getHtml: (data) => {
      // Support custom HTML for backward compatibility
      if (data.customHtml) {
        return data.customHtml;
      }
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${data.title || 'Notification'}</h1>
              </div>
              <div class="content">
                <p>${data.message}</p>
                ${data.action_link && data.action_text ? `<p><a href="${data.action_link}" class="button">${data.action_text}</a></p>` : ''}
                <p>The Cohortle Team</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }
  }
};

/**
 * Send email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.type - Email type (welcome, password_reset, enrollment_confirmation, notification)
 * @param {Object} options.data - Template data
 * @param {string} [options.subject] - Optional custom subject (overrides template)
 * @returns {Promise<{error: boolean, message: string, messageId?: string}>}
 */
async function sendEmail({ to, type, data = {}, subject }) {
  try {
    // Check if Resend client is configured
    if (!resendClient) {
      const errorMsg = 'Email service is not configured. RESEND_API_KEY is missing.';
      console.error('[ResendService] CRITICAL:', errorMsg);
      throw new Error(errorMsg);
    }

    // Validate email address
    if (!isValidEmail(to)) {
      throw new Error('Invalid email address format');
    }

    // Validate email type
    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      throw new Error(`Invalid email type: ${type}`);
    }

    // Get subject and HTML content
    const emailSubject = subject || 
      (typeof template.subject === 'function' 
        ? template.subject(data) 
        : template.subject);
    const htmlContent = template.getHtml(data);

    // Send via Resend
    console.log('[ResendService] Attempting to send email:', { to, type, subject: emailSubject });
    const response = await resendClient.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [to],
      subject: emailSubject,
      html: htmlContent
    });
    console.log('[ResendService] Email sent successfully:', { to, type, messageId: response.id });

    // Log success
    errorLogger.logSuccess('Email sent successfully', null, {
      to,
      type,
      messageId: response.id,
      timestamp: new Date().toISOString()
    });

    return {
      error: false,
      message: 'Email sent successfully',
      messageId: response.id
    };
  } catch (error) {
    // Log error with full details
    console.error('[ResendService] Email sending failed:', {
      error: error.message,
      stack: error.stack,
      to,
      type,
      timestamp: new Date().toISOString()
    });
    
    errorLogger.logApiError('Email sending failed', error, null, {
      to,
      type,
      timestamp: new Date().toISOString()
    });

    return {
      error: true,
      message: error.message || 'Failed to send email'
    };
  }
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Add contact to Resend audience
 * @param {Object} options - Audience options
 * @param {string} options.email - Contact email address
 * @param {string} [options.firstName] - Contact first name
 * @param {string} [options.lastName] - Contact last name
 * @param {string} [options.audienceId] - Audience ID (defaults to RESEND_AUDIENCE_ID env var)
 * @returns {Promise<{error: boolean, message: string, contactId?: string}>}
 */
async function addToAudience({ email, firstName, lastName, audienceId }) {
  try {
    // Check if Resend client is configured
    if (!resendClient) {
      console.warn('[ResendService] Audience management skipped: RESEND_API_KEY is missing');
      return {
        error: false,
        message: 'Audience management skipped (service not configured)'
      };
    }

    // Get audience ID from parameter or environment
    const targetAudienceId = audienceId || process.env.RESEND_AUDIENCE_ID;
    
    if (!targetAudienceId) {
      console.warn('[ResendService] Audience management skipped: RESEND_AUDIENCE_ID is not configured');
      return {
        error: false,
        message: 'Audience management skipped (audience ID not configured)'
      };
    }

    // Validate email address
    if (!isValidEmail(email)) {
      throw new Error('Invalid email address format');
    }

    // Add contact to audience
    console.log('[ResendService] Adding contact to audience:', { email, audienceId: targetAudienceId });
    const response = await resendClient.contacts.create({
      email,
      firstName,
      lastName,
      audienceId: targetAudienceId
    });
    console.log('[ResendService] Contact added to audience successfully:', { email, contactId: response.id });

    // Log success
    errorLogger.logSuccess('Contact added to audience', null, {
      email,
      audienceId: targetAudienceId,
      contactId: response.id,
      timestamp: new Date().toISOString()
    });

    return {
      error: false,
      message: 'Contact added to audience successfully',
      contactId: response.id
    };
  } catch (error) {
    // Handle duplicate contact error gracefully
    if (error.message && error.message.includes('already exists')) {
      console.log('[ResendService] Contact already exists in audience:', { email });
      return {
        error: false,
        message: 'Contact already exists in audience'
      };
    }

    // Log error with full details
    console.error('[ResendService] Failed to add contact to audience:', {
      error: error.message,
      stack: error.stack,
      email,
      timestamp: new Date().toISOString()
    });
    
    errorLogger.logApiError('Failed to add contact to audience', error, null, {
      email,
      timestamp: new Date().toISOString()
    });

    return {
      error: true,
      message: error.message || 'Failed to add contact to audience'
    };
  }
}

module.exports = {
  sendEmail,
  addToAudience,
  isValidEmail,
  EMAIL_TEMPLATES,
  SENDER_EMAIL,
  SENDER_NAME
};
