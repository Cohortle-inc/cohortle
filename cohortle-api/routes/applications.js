'use strict';

const TokenMiddleware = require('../middleware/TokenMiddleware');
const ApplicationService = require('../services/ApplicationService');
const ApplicationTemplateService = require('../services/ApplicationTemplateService');
const ApplicationHistoryService = require('../services/ApplicationHistoryService');

/**
 * Application routes — all endpoints for the programme application flow.
 * Requirements: 4.1–4.7, 5.1–5.8, 6.1–6.5, 9.1–9.5, 10.1, 10.2, 12.1–12.5
 */
module.exports = function (app) {

  // ── Public: get application form data by programme ID or application_form_slug ──
  app.get('/v1/api/programmes/:id/application-form', async (req, res) => {
    try {
      const db = require('../models');
      const idOrSlug = req.params.id;

      // Try numeric ID first, then fall back to application_form_slug lookup
      let programme;
      if (/^\d+$/.test(idOrSlug)) {
        programme = await db.programmes.findByPk(idOrSlug, {
          attributes: ['id', 'name', 'description', 'onboarding_mode', 'application_deadline', 'application_form_slug', 'lifecycle_status'],
        });
      } else {
        programme = await db.programmes.findOne({
          where: { application_form_slug: idOrSlug },
          attributes: ['id', 'name', 'description', 'onboarding_mode', 'application_deadline', 'application_form_slug', 'lifecycle_status'],
        });
      }

      if (!programme) return res.status(404).json({ error: true, message: 'Programme not found' });

      const questions = await ApplicationTemplateService.getTemplate(programme.id);
      return res.json({ programme, questions });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Public: submit an application ──
  app.post('/v1/api/programmes/:id/applications', async (req, res) => {
    try {
      const { name, email, responses, source } = req.body;
      const application = await ApplicationService.submitApplication(req.params.id, { name, email, responses, source });
      return res.status(201).json({ error: false, application });
    } catch (err) {
      const status = err.statusCode || (err.code === 'DUPLICATE_APPLICATION' ? 409 : 422);
      return res.status(status).json({ error: true, message: err.message, code: err.code });
    }
  });

  // ── Convener: list applications for a programme ──
  app.get('/v1/api/programmes/:id/applications', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const { status, sort, cohortId, page, limit } = req.query;
      const result = await ApplicationService.getProgrammeApplications(req.params.id, { status, sort, cohortId, page, limit });
      return res.json({ error: false, ...result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: status counts for a programme ──
  app.get('/v1/api/programmes/:id/applications/counts', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const counts = await ApplicationService.getStatusCounts(req.params.id);
      return res.json({ error: false, counts });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: CSV export ──
  app.get('/v1/api/programmes/:id/applications/export', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const csv = await ApplicationService.exportApplicationsCsv(req.params.id, req.user_id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="applications-${req.params.id}.csv"`);
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: get single application (triggers auto under_review) ──
  app.get('/v1/api/applications/:id', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const application = await ApplicationService.getApplication(req.params.id, req.user_id);
      const history = await ApplicationHistoryService.getHistory(req.params.id);
      return res.json({ error: false, application, history });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ error: true, message: err.message, code: err.code });
    }
  });

  // ── Convener: transition application status ──
  app.patch('/v1/api/applications/:id/status', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const { status, cohortId, rejectionReason, notes } = req.body;
      const application = await ApplicationService.transitionStatus(req.params.id, status, {
        reviewerId: req.user_id,
        cohortId,
        rejectionReason,
        notes,
      });
      return res.json({ error: false, application });
    } catch (err) {
      return res.status(err.statusCode || 422).json({ error: true, message: err.message, code: err.code });
    }
  });

  // ── Convener: add/update reviewer notes ──
  app.patch('/v1/api/applications/:id/notes', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const { notes } = req.body;
      const db = require('../models');
      const application = await db.applications.findByPk(req.params.id);
      if (!application) return res.status(404).json({ error: true, message: 'Application not found' });
      await application.update({ reviewer_notes: notes, reviewer_id: req.user_id, updated_at: new Date() });
      return res.json({ error: false, application });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: bulk action ──
  app.post('/v1/api/applications/bulk-action', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const { applicationIds, status, cohortId, rejectionReason } = req.body;
      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        return res.status(400).json({ error: true, message: 'applicationIds must be a non-empty array' });
      }
      const results = await ApplicationService.bulkTransition(applicationIds, status, {
        reviewerId: req.user_id,
        cohortId,
        rejectionReason,
      });
      return res.json({ error: false, results });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Learner: my applications ──
  app.get('/v1/api/me/applications', TokenMiddleware({ role: 'student' }), async (req, res) => {
    try {
      const applications = await ApplicationService.getLearnerApplications(req.user_id);
      return res.json({ error: false, applications });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ error: true, message: err.message });
    }
  });

  // ── Learner: edit draft application ──
  app.put('/v1/api/applications/:id', TokenMiddleware({ role: 'student' }), async (req, res) => {
    try {
      const db = require('../models');
      const application = await db.applications.findByPk(req.params.id);
      if (!application) return res.status(404).json({ error: true, message: 'Application not found' });
      if (application.status !== 'draft') {
        return res.status(422).json({ error: true, message: 'Only draft applications can be edited', code: 'APPLICATION_NOT_EDITABLE' });
      }
      const { responses } = req.body;
      await application.update({ responses, updated_at: new Date() });
      return res.json({ error: false, application });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Public: redeem acceptance token ──
  app.post('/v1/api/acceptance-tokens/:token/redeem', async (req, res) => {
    try {
      // userId may be null for unauthenticated users
      const userId = req.user_id || null;
      const result = await ApplicationService.redeemAcceptanceToken(req.params.token, userId);
      return res.json({ error: false, ...result });
    } catch (err) {
      const status = err.code === 'TOKEN_NOT_FOUND' ? 404 : (err.statusCode || 422);
      return res.status(status).json({ error: true, message: err.message, code: err.code });
    }
  });

  // ── Convener: cross-programme applications view ──
  app.get('/v1/api/convener/applications', TokenMiddleware({ role: 'convener' }), async (req, res) => {
    try {
      const db = require('../models');
      const { Op } = require('sequelize');
      const { programmeId, status, page = 1, limit = 20 } = req.query;

      // Find all programmes owned by this convener
      const programmes = await db.programmes.findAll({
        where: { created_by: req.user_id },
        attributes: ['id'],
      });
      const programmeIds = programmes.map((p) => p.id);

      if (programmeIds.length === 0) {
        return res.json({ error: false, total: 0, applications: [] });
      }

      const where = { programme_id: { [Op.in]: programmeIds } };
      if (programmeId) where.programme_id = programmeId;
      if (status) where.status = status;

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const { count, rows } = await db.applications.findAndCountAll({
        where,
        include: [{ model: db.programmes, as: 'programme', attributes: ['id', 'name'] }],
        order: [['submitted_at', 'DESC']],
        limit: parseInt(limit, 10),
        offset,
      });

      return res.json({ error: false, total: count, page: parseInt(page, 10), limit: parseInt(limit, 10), applications: rows });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });
};
