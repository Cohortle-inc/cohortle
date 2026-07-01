const UrlMiddleware = require("../middleware/UrlMiddleware");
const db = require("../models");
const { Op } = require("sequelize");

/**
 * Public routes for external opportunities.
 * No authentication required.
 */
module.exports = function (app) {

  /**
   * GET /v1/api/opportunities/public
   * Returns published, non-expired external opportunities.
   */
  app.get(
    "/v1/api/opportunities/public",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const q = req.query.q || '';
        const format = req.query.format || null;
        const free = req.query.free === 'true';
        const closingSoon = req.query.closingSoon === 'true';
        const sort = req.query.sort || 'closing';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Base visibility: published and not expired
        const where = {
          status: 'published',
          [Op.or]: [
            { deadline: null },
            { deadline: { [Op.gte]: today } },
          ],
        };

        // Keyword search
        if (q) {
          where[Op.and] = where[Op.and] || [];
          where[Op.and].push({
            [Op.or]: [
              { title: { [Op.like]: `%${q}%` } },
              { description: { [Op.like]: `%${q}%` } },
              { organisation: { [Op.like]: `%${q}%` } },
            ],
          });
        }

        // Format filter
        if (format) {
          where.format = format;
        }

        // Free/funded filter
        if (free) {
          where[Op.and] = where[Op.and] || [];
          where[Op.and].push({
            [Op.or]: [
              { price_info: null },
              { price_info: { [Op.like]: '%free%' } },
              { price_info: { [Op.like]: '%funded%' } },
            ],
          });
        }

        // Closing soon filter (within 7 days)
        if (closingSoon) {
          const sevenDaysFromNow = new Date(today);
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          where.deadline = {
            [Op.between]: [today, sevenDaysFromNow],
          };
        }

        // Sort order
        let order;
        if (sort === 'newest') {
          order = [['created_at', 'DESC']];
        } else if (sort === 'name') {
          order = [['title', 'ASC']];
        } else {
          // Default: featured first, then soonest deadline (nulls last)
          order = [
            ['is_featured', 'DESC'],
            [db.sequelize.literal('deadline IS NULL'), 'ASC'],
            ['deadline', 'ASC'],
          ];
        }

        const opportunities = await db.external_opportunities.findAll({
          where,
          order,
          limit,
          attributes: [
            'id', 'title', 'description', 'organisation', 'category',
            'format', 'duration', 'price_info', 'highlights',
            'thumbnail_url', 'apply_url', 'deadline', 'location',
            'is_featured',
          ],
        });

        const formatted = opportunities.map(o => ({
          source: 'external',
          id: o.id,
          title: o.title,
          description: o.description,
          organisation: o.organisation,
          category: o.category,
          format: o.format,
          duration: o.duration,
          price_info: o.price_info,
          highlights: Array.isArray(o.highlights)
            ? o.highlights
            : (typeof o.highlights === 'string' ? JSON.parse(o.highlights) : null),
          thumbnail_url: o.thumbnail_url,
          apply_url: o.apply_url,
          deadline: o.deadline,
          location: o.location,
          is_featured: o.is_featured === 1,
        }));

        return res.status(200).json({
          error: false,
          opportunities: formatted,
        });
      } catch (err) {
        console.error('[Opportunities] Error fetching public opportunities:', err);
        return res.status(500).json({ error: true, message: 'Failed to fetch opportunities' });
      }
    }
  );
};
