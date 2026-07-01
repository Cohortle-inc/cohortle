const ResendService = require('../services/ResendService');
const ValidationService = require('../services/ValidationService');
const TokenMiddleware = require('../middleware/TokenMiddleware');
const UrlMiddleware = require('../middleware/UrlMiddleware');

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/email/send:
   *   post:
   *     summary: Send an email using Resend
   *     tags: [Email]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - to
   *               - type
   *             properties:
   *               to:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               type:
   *                 type: string
   *                 enum: [welcome, password_reset, enrollment_confirmation, notification, demo_booking_confirmation, demo_follow_up, demo_reminder]
   *                 example: welcome
   *               data:
   *                 type: object
   *                 description: Template-specific data
   *               subject:
   *                 type: string
   *                 description: Optional custom subject line (max 200 characters)
   *     responses:
   *       200:
   *         description: Email sent successfully
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.post(
    '/v1/api/email/send',
    [TokenMiddleware, UrlMiddleware],
    async function (req, res) {
      try {
        const { to, type, data, subject } = req.body;

        // Validate required fields
        const validationResult = await ValidationService.validateObject(
          {
            to: 'required|email',
            type: 'required|in:welcome,password_reset,enrollment_confirmation,notification,demo_booking_confirmation,demo_follow_up,demo_reminder',
            data: 'object'
          },
          { to, type, data: data || {} }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        // Additional email validation
        if (!ResendService.isValidEmail(to)) {
          return res.status(400).json({
            error: true,
            message: 'Invalid email address format'
          });
        }

        // Validate subject length if provided
        if (subject && subject.length > 200) {
          return res.status(400).json({
            error: true,
            message: 'Subject line must be 200 characters or less'
          });
        }

        // Send email
        const result = await ResendService.sendEmail({
          to,
          type,
          data: data || {},
          subject
        });

        if (result.error) {
          return res.status(500).json(result);
        }

        return res.status(200).json(result);
      } catch (error) {
        console.error('Email route error:', error);
        return res.status(500).json({
          error: true,
          message: 'Failed to send email'
        });
      }
    }
  );

  return [];
};
