const FunnelService = require('../services/FunnelService');
const TokenMiddleware = require('../middleware/TokenMiddleware');
const UrlMiddleware = require('../middleware/UrlMiddleware');

module.exports = function funnelRoutes(app) {
  /**
   * POST /v1/api/funnel/leads
   * Public — submit an interest form lead.
   * Returns 201 with { id: lead.id } on success.
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  app.post('/v1/api/funnel/leads', [UrlMiddleware], async function (req, res) {
    try {
      const lead = await FunnelService.createLead(req.body);
      return res.status(201).json({ id: lead.id });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({
        error: true,
        message: err.message || 'Failed to create lead',
        ...(err.fields ? { fields: err.fields } : {}),
      });
    }
  });

  /**
   * GET /v1/api/funnel/leads
   * Admin auth required — retrieve all leads ordered by creation date desc.
   * Requirements: 4.6
   */
  app.get(
    '/v1/api/funnel/leads',
    [UrlMiddleware, TokenMiddleware({ role: 'administrator' })],
    async function (req, res) {
      try {
        const leads = await FunnelService.getLeads();
        return res.status(200).json(leads);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({
          error: true,
          message: err.message || 'Failed to retrieve leads',
        });
      }
    }
  );

  /**
   * PATCH /v1/api/funnel/leads/:id/status
   * Admin auth required — update the status of a lead.
   * Returns 200 with the updated lead record.
   * Requirements: 8.4, 8.5, 8.6
   */
  app.patch(
    '/v1/api/funnel/leads/:id/status',
    [UrlMiddleware, TokenMiddleware({ role: 'administrator' })],
    async function (req, res) {
      try {
        const lead = await FunnelService.updateStatus(req.params.id, req.body.status);
        return res.status(200).json(lead);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({
          error: true,
          message: err.message || 'Failed to update lead status',
        });
      }
    }
  );

  /**
   * POST /v1/api/funnel/leads/:id/close
   * Admin auth required — trigger the post-demo closing email for a lead.
   * Returns 200 with { success: true }.
   * Requirements: 8.1, 8.2, 8.3
   */
  app.post(
    '/v1/api/funnel/leads/:id/close',
    [UrlMiddleware, TokenMiddleware({ role: 'administrator' })],
    async function (req, res) {
      try {
        await FunnelService.triggerClosingEmail(req.params.id);
        return res.status(200).json({ success: true });
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({
          error: true,
          message: err.message || 'Failed to trigger closing email',
        });
      }
    }
  );
};
