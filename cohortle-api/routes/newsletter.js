'use strict';

/**
 * Newsletter subscription routes
 * Handles email subscriptions for organisation updates
 */
module.exports = function (app) {

  // ── Public: Subscribe to organisation newsletter ──
  app.post('/v1/api/newsletter/subscribe', async (req, res) => {
    try {
      const db = require('../models');
      const { organisation_slug, email } = req.body;

      // Validate input
      if (!organisation_slug || !email) {
        return res.status(400).json({ 
          error: true, 
          message: 'Organisation slug and email are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: true, 
          message: 'Invalid email format' 
        });
      }

      // Verify organisation exists
      const org = await db.users.findOne({
        where: { organisation_slug },
        attributes: ['id'],
      });

      if (!org) {
        return res.status(404).json({ 
          error: true, 
          message: 'Organisation not found' 
        });
      }

      // Check if already subscribed
      const existing = await db.sequelize.models.newsletter_subscribers?.findOne({
        where: { organisation_slug, email },
      });

      if (existing) {
        return res.json({ 
          error: false, 
          message: 'Already subscribed',
          already_subscribed: true,
        });
      }

      // Create subscription
      await db.sequelize.models.newsletter_subscribers?.create({
        organisation_slug,
        email,
      });

      return res.json({ 
        error: false, 
        message: 'Successfully subscribed',
        already_subscribed: false,
      });
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      return res.status(500).json({ 
        error: true, 
        message: 'Failed to subscribe. Please try again.' 
      });
    }
  });
};
