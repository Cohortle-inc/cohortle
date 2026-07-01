'use strict';

const TokenMiddleware = require('../middleware/TokenMiddleware');
const UrlMiddleware = require('../middleware/UrlMiddleware');
const CollectionLinkService = require('../services/CollectionLinkService');
const BackendSDK = require('../core/BackendSDK');

/**
 * Testimonial Collection Link Routes
 *
 * Convener management:
 *   POST   /v1/api/cohorts/:cohort_id/collection-link           — get or create link
 *   PUT    /v1/api/cohorts/:cohort_id/collection-link           — update settings
 *   DELETE /v1/api/cohorts/:cohort_id/collection-link           — revoke link
 *   POST   /v1/api/cohorts/:cohort_id/collection-link/regenerate — regenerate token
 *   GET    /v1/api/convener/collection-links                    — list all links
 *
 * Public / learner:
 *   GET    /v1/api/testimonial-links/:token                     — validate token
 *   POST   /v1/api/testimonial-links/:token/submit              — submit testimonial
 */
module.exports = function (app) {
  // ─── Helper: verify convener owns the cohort ────────────────────────────

  async function assertConvenerOwnsCohort(cohortId, convenerUserId, res) {
    const sdk = new BackendSDK();
    sdk.setTable('cohorts');
    const cohort = (await sdk.get({ id: cohortId }))[0];

    if (!cohort) {
      res.status(404).json({ error: true, message: 'Cohort not found' });
      return null;
    }

    // Cohorts belong to programmes; programmes have created_by = convener user_id
    sdk.setTable('programmes');
    const programme = (await sdk.get({ id: cohort.programme_id }))[0];

    if (!programme || programme.created_by !== convenerUserId) {
      res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'You do not own this cohort' });
      return null;
    }

    return cohort;
  }

  // ─── Convener: get or create link ────────────────────────────────────────

  // GET: fetch existing link for a cohort (with submission count)
  app.get(
    '/v1/api/cohorts/:cohort_id/collection-link',
    [UrlMiddleware, TokenMiddleware({ role: 'convener' })],
    async function (req, res) {
      try {
        const cohortId = parseInt(req.params.cohort_id, 10);
        const convenerUserId = req.user_id;

        const cohort = await assertConvenerOwnsCohort(cohortId, convenerUserId, res);
        if (!cohort) return;

        const result = await CollectionLinkService.getLinkForCohort(cohortId, convenerUserId);

        if (!result) {
          return res.status(200).json({ error: false, link: null, url: null });
        }

        return res.status(200).json({ error: false, link: result, url: result.url });
      } catch (err) {
        console.error('collection-link GET error:', err);
        return res.status(500).json({ error: true, message: 'Failed to fetch collection link' });
      }
    }
  );

  // POST: get or create link
  app.post(
    '/v1/api/cohorts/:cohort_id/collection-link',
    [UrlMiddleware, TokenMiddleware({ role: 'convener' })],
    async function (req, res) {
      try {
        const cohortId = parseInt(req.params.cohort_id, 10);
        const convenerUserId = req.user_id;

        const cohort = await assertConvenerOwnsCohort(cohortId, convenerUserId, res);
        if (!cohort) return;

        const { link, url } = await CollectionLinkService.getOrCreateLink(cohortId, convenerUserId);

        await CollectionLinkService.getOrCreateLink(cohortId, convenerUserId);
        // Re-fetch with submission count
        const result = await CollectionLinkService.getLinkForCohort(cohortId, convenerUserId);

        return res.status(200).json({ error: false, link: result, url: result.url });
      } catch (err) {
        console.error('collection-link POST error:', err);
        return res.status(500).json({ error: true, message: 'Failed to create collection link' });
      }
    }
  );

  // ─── Convener: update settings ───────────────────────────────────────────

  app.put(
    '/v1/api/cohorts/:cohort_id/collection-link',
    [UrlMiddleware, TokenMiddleware({ role: 'convener' })],
    async function (req, res) {
      try {
        const cohortId = parseInt(req.params.cohort_id, 10);
        const convenerUserId = req.user_id;

        const cohort = await assertConvenerOwnsCohort(cohortId, convenerUserId, res);
        if (!cohort) return;

        const { auto_approve, expires_at } = req.body;
        const link = await CollectionLinkService.updateLinkSettings(cohortId, convenerUserId, {
          auto_approve,
          expires_at,
        });

        return res.status(200).json({ error: false, link });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).json({ error: true, code: err.code, message: err.message });
        }
        console.error('collection-link PUT error:', err);
        return res.status(500).json({ error: true, message: 'Failed to update collection link' });
      }
    }
  );

  // ─── Convener: revoke link ───────────────────────────────────────────────

  app.delete(
    '/v1/api/cohorts/:cohort_id/collection-link',
    [UrlMiddleware, TokenMiddleware({ role: 'convener' })],
    async function (req, res) {
      try {
        const cohortId = parseInt(req.params.cohort_id, 10);
        const convenerUserId = req.user_id;

        const cohort = await assertConvenerOwnsCohort(cohortId, convenerUserId, res);
        if (!cohort) return;

        await CollectionLinkService.revokeLink(cohortId, convenerUserId);

        return res.status(200).json({ error: false, message: 'Collection link revoked' });
      } catch (err) {
        console.error('collection-link DELETE error:', err);
        return res.status(500).json({ error: true, message: 'Failed to revoke collection link' });
      }
    }
  );

  // ─── Convener: regenerate token ──────────────────────────────────────────

  app.post(
    '/v1/api/cohorts/:cohort_id/collection-link/regenerate',
    [UrlMiddleware, TokenMiddleware({ role: 'convener' })],
    async function (req, res) {
      try {
        const cohortId = parseInt(req.params.cohort_id, 10);
        const convenerUserId = req.user_id;

        const cohort = await assertConvenerOwnsCohort(cohortId, convenerUserId, res);
        if (!cohort) return;

        const { link, url } = await CollectionLinkService.regenerateLink(cohortId, convenerUserId);

        // Re-fetch with submission count
        const result = await CollectionLinkService.getLinkForCohort(cohortId, convenerUserId);
        return res.status(200).json({ error: false, link: result || link, url: result?.url || url });
      } catch (err) {
        console.error('collection-link regenerate error:', err);
        return res.status(500).json({ error: true, message: 'Failed to regenerate collection link' });
      }
    }
  );

  // ─── Convener: list all links ────────────────────────────────────────────

  app.get(
    '/v1/api/convener/collection-links',
    [UrlMiddleware, TokenMiddleware({ role: 'convener' })],
    async function (req, res) {
      try {
        const convenerUserId = req.user_id;
        const links = await CollectionLinkService.listLinksForConvener(convenerUserId);

        return res.status(200).json({ error: false, links });
      } catch (err) {
        console.error('collection-links list error:', err);
        return res.status(500).json({ error: true, message: 'Failed to fetch collection links' });
      }
    }
  );

  // ─── Public: validate token ──────────────────────────────────────────────

  app.get(
    '/v1/api/testimonial-links/:token',
    async function (req, res) {
      try {
        const { token } = req.params;
        const { link, cohort } = await CollectionLinkService.validateToken(token);

        const programme = cohort && cohort.programme ? cohort.programme : null;
        return res.status(200).json({
          error: false,
          cohort_name: cohort ? cohort.name : null,
          programme_name: programme ? programme.name : null,
          programme_description: programme ? programme.description : null,
          programme_thumbnail: programme ? programme.thumbnail : null,
          auto_approve: link.auto_approve,
        });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).json({ error: true, code: err.code, message: err.message });
        }
        console.error('testimonial-links GET error:', err);
        return res.status(500).json({ error: true, message: 'Failed to validate link' });
      }
    }
  );

  // ─── Learner: submit testimonial ─────────────────────────────────────────

  app.post(
    '/v1/api/testimonial-links/:token/submit',
    [UrlMiddleware, TokenMiddleware({ role: 'student' })],
    async function (req, res) {
      try {
        const { token } = req.params;
        const learnerUserId = req.user_id;
        const { quote, rating, display_name } = req.body;

        const result = await CollectionLinkService.submitTestimonial(token, learnerUserId, {
          quote,
          rating,
          display_name,
        });

        return res.status(201).json({ error: false, ...result });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).json({ error: true, code: err.code, message: err.message });
        }
        console.error('testimonial submit error:', err);
        return res.status(500).json({ error: true, message: 'Failed to submit testimonial' });
      }
    }
  );
};
