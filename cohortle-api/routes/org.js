'use strict';

const { Op } = require('sequelize');
const TokenMiddleware = require('../middleware/TokenMiddleware');
const UrlMiddleware = require('../middleware/UrlMiddleware');

/**
 * Organisation page routes — public discovery layer + convener management.
 * Requirements: 13.1, 13.2, 13.4, 13.7
 */
module.exports = function (app) {

  // ── Public: check slug availability ──
  app.get('/v1/api/org/:slug/check', async (req, res) => {
    try {
      const db = require('../models');
      const existing = await db.users.findOne({
        where: { organisation_slug: req.params.slug },
        attributes: ['id'],
      });
      return res.json({ available: !existing });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Public: get organisation page data ──
  app.get('/v1/api/org/:slug', async (req, res) => {
    try {
      const db = require('../models');

      // Validate slug format: lowercase alphanumeric + hyphens, 3–50 chars
      const slugPattern = /^[a-z0-9-]{3,50}$/;
      if (!slugPattern.test(req.params.slug)) {
        return res.status(400).json({ error: true, message: 'Invalid organisation slug format', code: 'INVALID_SLUG' });
      }

      // Find the convener by slug
      const convener = await db.users.findOne({
        where: { organisation_slug: req.params.slug },
        attributes: [
          'id', 'first_name', 'last_name', 'organisation_name', 'organisation_description', 'organisation_slug',
          'organisation_tagline', 'contact_email', 'contact_phone', 'website_url',
          'linkedin_url', 'twitter_url', 'facebook_url', 'instagram_url',
          'organisation_logo_url', 'hero_image_url', 'intro_video_url', 'tawk_property_id', 'tawk_widget_id',
        ],
      });

      if (!convener) {
        return res.status(404).json({ error: true, message: 'Organisation not found', code: 'ORG_NOT_FOUND' });
      }

      // Find all recruiting programmes with application or hybrid mode
      const programmes = await db.programmes.findAll({
        where: {
          created_by: convener.id,
          lifecycle_status: 'recruiting',
          onboarding_mode: { [Op.in]: ['application', 'hybrid'] },
        },
        attributes: ['id', 'name', 'description', 'application_deadline', 'application_form_slug', 'onboarding_mode',
          'format', 'duration', 'highlights', 'learning_outcomes', 'prerequisites', 'price_info', 'intro_video_url', 'thumbnail_url'],
        order: [['id', 'ASC']],
      });

      // Fetch organisation stats
      const stats = await db.sequelize.models.organisation_stats?.findOne({
        where: { user_id: convener.id },
        attributes: ['total_learners', 'programmes_completed', 'success_rate', 'years_experience'],
      }) || null;

      // Fetch testimonials
      const testimonials = await db.sequelize.models.testimonials?.findAll({
        where: { user_id: convener.id, is_featured: true },
        attributes: ['id', 'learner_name', 'learner_avatar', 'programme_name', 'quote', 'rating'],
        order: [['created_at', 'DESC']],
        limit: 6,
      }) || [];

      // Fetch FAQs
      const faqs = await db.sequelize.models.organisation_faqs?.findAll({
        where: { user_id: convener.id },
        attributes: ['id', 'question', 'answer'],
        order: [['order_index', 'ASC']],
      }) || [];

      return res.json({
        error: false,
        convener: {
          name: [convener.first_name, convener.last_name].filter(Boolean).join(' '),
          organisation_name: convener.organisation_name,
          organisation_description: convener.organisation_description,
          organisation_slug: convener.organisation_slug,
          organisation_tagline: convener.organisation_tagline,
          contact_email: convener.contact_email,
          contact_phone: convener.contact_phone,
          website_url: convener.website_url,
          linkedin_url: convener.linkedin_url,
          twitter_url: convener.twitter_url,
          facebook_url: convener.facebook_url,
          instagram_url: convener.instagram_url,
          organisation_logo_url: convener.organisation_logo_url,
          hero_image_url: convener.hero_image_url,
          intro_video_url: convener.intro_video_url,
          tawk_property_id: convener.tawk_property_id,
          tawk_widget_id: convener.tawk_widget_id,
        },
        programmes,
        stats,
        testimonials,
        faqs,
      });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: get/upsert organisation stats ──
  app.get('/v1/api/convener/org/stats', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const stats = await db.organisation_stats.findOne({ where: { user_id: req.user_id } });
      return res.json({ error: false, stats: stats || { total_learners: 0, programmes_completed: 0, success_rate: 0, years_experience: 0 } });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  app.put('/v1/api/convener/org/stats', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const { total_learners, programmes_completed, success_rate, years_experience } = req.body;
      const [stats] = await db.organisation_stats.upsert({
        user_id: req.user_id,
        total_learners: parseInt(total_learners) || 0,
        programmes_completed: parseInt(programmes_completed) || 0,
        success_rate: parseInt(success_rate) || 0,
        years_experience: parseInt(years_experience) || 0,
      });
      return res.json({ error: false, stats });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: testimonials CRUD ──
  app.get('/v1/api/convener/org/testimonials', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const testimonials = await db.testimonials.findAll({
        where: { user_id: req.user_id },
        order: [['created_at', 'DESC']],
      });
      return res.json({ error: false, testimonials });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  app.post('/v1/api/convener/org/testimonials', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const { learner_name, learner_avatar, programme_name, quote, rating, is_featured } = req.body;
      if (!learner_name || !quote) return res.status(400).json({ error: true, message: 'learner_name and quote are required' });
      const t = await db.testimonials.create({
        user_id: req.user_id,
        learner_name: learner_name.trim(),
        learner_avatar: learner_avatar || null,
        programme_name: programme_name || null,
        quote: quote.trim(),
        rating: parseInt(rating) || 5,
        is_featured: !!is_featured,
      });
      return res.status(201).json({ error: false, testimonial: t });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  app.put('/v1/api/convener/org/testimonials/:id', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const t = await db.testimonials.findOne({ where: { id: req.params.id, user_id: req.user_id } });
      if (!t) return res.status(404).json({ error: true, message: 'Not found' });
      const { learner_name, learner_avatar, programme_name, quote, rating, is_featured } = req.body;
      await t.update({
        learner_name: learner_name?.trim() ?? t.learner_name,
        learner_avatar: learner_avatar !== undefined ? learner_avatar : t.learner_avatar,
        programme_name: programme_name !== undefined ? programme_name : t.programme_name,
        quote: quote?.trim() ?? t.quote,
        rating: rating !== undefined ? parseInt(rating) : t.rating,
        is_featured: is_featured !== undefined ? !!is_featured : t.is_featured,
      });
      return res.json({ error: false, testimonial: t });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  app.delete('/v1/api/convener/org/testimonials/:id', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const t = await db.testimonials.findOne({ where: { id: req.params.id, user_id: req.user_id } });
      if (!t) return res.status(404).json({ error: true, message: 'Not found' });
      await t.destroy();
      return res.json({ error: false });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: FAQs CRUD ──
  app.get('/v1/api/convener/org/faqs', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const faqs = await db.organisation_faqs.findAll({
        where: { user_id: req.user_id },
        order: [['order_index', 'ASC'], ['id', 'ASC']],
      });
      return res.json({ error: false, faqs });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  app.post('/v1/api/convener/org/faqs', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const { question, answer, order_index } = req.body;
      if (!question || !answer) return res.status(400).json({ error: true, message: 'question and answer are required' });
      const faq = await db.organisation_faqs.create({
        user_id: req.user_id,
        question: question.trim(),
        answer: answer.trim(),
        order_index: parseInt(order_index) || 0,
      });
      return res.status(201).json({ error: false, faq });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  app.put('/v1/api/convener/org/faqs/:id', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const faq = await db.organisation_faqs.findOne({ where: { id: req.params.id, user_id: req.user_id } });
      if (!faq) return res.status(404).json({ error: true, message: 'Not found' });
      const { question, answer, order_index } = req.body;
      await faq.update({
        question: question?.trim() ?? faq.question,
        answer: answer?.trim() ?? faq.answer,
        order_index: order_index !== undefined ? parseInt(order_index) : faq.order_index,
      });
      return res.json({ error: false, faq });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  app.delete('/v1/api/convener/org/faqs/:id', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const faq = await db.organisation_faqs.findOne({ where: { id: req.params.id, user_id: req.user_id } });
      if (!faq) return res.status(404).json({ error: true, message: 'Not found' });
      await faq.destroy();
      return res.json({ error: false });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Public: track org page view ──
  app.post('/v1/api/org/:slug/view', async (req, res) => {
    try {
      const db = require('../models');
      const { slug } = req.params;
      // Validate slug exists
      const convener = await db.users.findOne({ where: { organisation_slug: slug }, attributes: ['id'] });
      if (!convener) return res.status(404).json({ error: true, message: 'Not found' });
      // Insert view — fire and forget style, don't block response
      db.sequelize.query(
        'INSERT INTO org_page_views (organisation_slug, referrer, user_agent) VALUES (?, ?, ?)',
        { replacements: [slug, req.headers.referer || null, (req.headers['user-agent'] || '').substring(0, 500)] }
      ).catch(() => {}); // swallow errors
      return res.json({ error: false });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: get org page analytics ──
  app.get('/v1/api/convener/org/analytics', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');
      const user = await db.users.findOne({ where: { id: req.user_id }, attributes: ['organisation_slug'] });
      if (!user?.organisation_slug) return res.json({ error: false, analytics: { total_views: 0, views_30d: 0, views_7d: 0, daily: [] } });

      const slug = user.organisation_slug;

      const [totalRows] = await db.sequelize.query(
        'SELECT COUNT(*) as total FROM org_page_views WHERE organisation_slug = ?',
        { replacements: [slug] }
      );
      const [rows30d] = await db.sequelize.query(
        'SELECT COUNT(*) as total FROM org_page_views WHERE organisation_slug = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
        { replacements: [slug] }
      );
      const [rows7d] = await db.sequelize.query(
        'SELECT COUNT(*) as total FROM org_page_views WHERE organisation_slug = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        { replacements: [slug] }
      );
      const [daily] = await db.sequelize.query(
        'SELECT DATE(viewed_at) as date, COUNT(*) as views FROM org_page_views WHERE organisation_slug = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(viewed_at) ORDER BY date ASC',
        { replacements: [slug] }
      );

      // Application conversion: applications submitted in last 30d for this convener's programmes
      const [appRows] = await db.sequelize.query(
        `SELECT COUNT(*) as total FROM applications a
         JOIN programmes p ON a.programme_id = p.id
         WHERE p.created_by = ? AND a.submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        { replacements: [req.user_id] }
      );

      const total_views = parseInt((totalRows[0] && totalRows[0].total) || 0);
      const views_30d = parseInt((rows30d[0] && rows30d[0].total) || 0);
      const views_7d = parseInt((rows7d[0] && rows7d[0].total) || 0);
      const applications_30d = parseInt((appRows[0] && appRows[0].total) || 0);
      const conversion_rate = views_30d > 0 ? ((applications_30d / views_30d) * 100).toFixed(1) : '0.0';

      return res.json({
        error: false,
        analytics: {
          total_views,
          views_30d,
          views_7d,
          applications_30d,
          conversion_rate,
          daily,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: sync stats from real data ──
  app.post('/v1/api/convener/org/stats/sync', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const db = require('../models');

      // Count distinct enrolled learners across all convener's programmes
      const [learnerRows] = await db.sequelize.query(
        `SELECT COUNT(DISTINCT e.user_id) as total
         FROM enrollments e
         JOIN cohorts c ON e.cohort_id = c.id
         JOIN programmes p ON c.programme_id = p.id
         WHERE p.created_by = ?`,
        { replacements: [req.user_id] }
      );
      const total_learners = parseInt((learnerRows[0] && learnerRows[0].total) || 0);

      // Count programmes that have at least one cohort with enrollments
      const [progRows] = await db.sequelize.query(
        `SELECT COUNT(DISTINCT p.id) as total
         FROM programmes p
         JOIN cohorts c ON c.programme_id = p.id
         JOIN enrollments e ON e.cohort_id = c.id
         WHERE p.created_by = ?`,
        { replacements: [req.user_id] }
      );
      const programmes_completed = parseInt((progRows[0] && progRows[0].total) || 0);

      // Upsert stats
      await db.organisation_stats.upsert({
        user_id: req.user_id,
        total_learners,
        programmes_completed,
      });

      const stats = await db.organisation_stats.findOne({ where: { user_id: req.user_id } });
      return res.json({ error: false, stats });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });
};
