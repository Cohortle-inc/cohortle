const UrlMiddleware = require("../middleware/UrlMiddleware");
const JwtService = require("../services/JwtService");
const db = require("../models");

/**
 * Admin-only routes for platform management.
 * All routes require administrator role.
 */
module.exports = function (app) {

  /**
   * GET /v1/api/admin/stats
   * Platform-wide overview stats
   */
  app.get(
    "/v1/api/admin/stats",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        // Count users by role
        const [roleCounts] = await db.sequelize.query(`
          SELECT r.name AS role, COUNT(u.id) AS count
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.role_id
          GROUP BY r.name
        `);

        const roleMap = {};
        roleCounts.forEach(row => {
          roleMap[row.role || 'unassigned'] = parseInt(row.count);
        });

        const totalUsers = Object.values(roleMap).reduce((a, b) => a + b, 0);

        // Count programmes
        const totalProgrammes = await db.programmes.count();
        const activeProgrammes = await db.programmes.count({
          where: { lifecycle_status: 'active' }
        });

        // Count enrollments
        const totalEnrollments = await db.enrollments.count();

        // Count cohorts
        const totalCohorts = await db.cohorts.count();

        // Recent signups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSignups = await db.users.count({
          where: {
            joined_at: { [db.Sequelize.Op.gte]: thirtyDaysAgo }
          }
        });

        // Lesson completions
        let totalLessonCompletions = 0;
        try {
          totalLessonCompletions = await db.lesson_completions.count();
        } catch (e) {
          // table may not exist
        }

        return res.status(200).json({
          error: false,
          stats: {
            users: {
              total: totalUsers,
              students: roleMap['student'] || 0,
              conveners: roleMap['convener'] || 0,
              administrators: roleMap['administrator'] || 0,
              unassigned: roleMap['unassigned'] || 0,
              recentSignups,
            },
            programmes: {
              total: totalProgrammes,
              active: activeProgrammes,
            },
            cohorts: {
              total: totalCohorts,
            },
            enrollments: {
              total: totalEnrollments,
            },
            learning: {
              totalLessonCompletions,
            },
          }
        });
      } catch (err) {
        console.error('[Admin] Error fetching stats:', err);
        res.status(500).json({ error: true, message: 'Failed to fetch platform stats' });
      }
    }
  );

  /**
   * GET /v1/api/admin/users
   * List all users with role info, pagination, and search
   */
  app.get(
    "/v1/api/admin/users",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search || '';
        const roleFilter = req.query.role || null;

        // Build where clause
        const where = {};
        if (search) {
          where[db.Sequelize.Op.or] = [
            { email: { [db.Sequelize.Op.like]: `%${search}%` } },
            { first_name: { [db.Sequelize.Op.like]: `%${search}%` } },
            { last_name: { [db.Sequelize.Op.like]: `%${search}%` } },
          ];
        }

        // Role filter via join
        const includeRole = {
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id'],
          required: false,
        };

        if (roleFilter) {
          includeRole.where = { name: roleFilter };
          includeRole.required = true;
        }

        const { count, rows: users } = await db.users.findAndCountAll({
          where,
          attributes: ['id', 'email', 'first_name', 'last_name', 'joined_at', 'status', 'email_verified', 'role_id'],
          include: [includeRole],
          limit,
          offset,
          order: [['joined_at', 'DESC']],
        });

        const formatted = users.map(u => ({
          id: u.id,
          email: u.email,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          role: u.role ? u.role.name : 'unassigned',
          role_id: u.role_id,
          joined_at: u.joined_at,
          status: u.status,
          email_verified: u.email_verified === 1,
        }));

        return res.status(200).json({
          error: false,
          users: formatted,
          pagination: {
            total: count,
            limit,
            offset,
            has_more: offset + limit < count,
          }
        });
      } catch (err) {
        console.error('[Admin] Error fetching users:', err);
        res.status(500).json({ error: true, message: 'Failed to fetch users' });
      }
    }
  );

  /**
   * GET /v1/api/admin/conveners
   * List all conveners with their organisation and programme counts
   */
  app.get(
    "/v1/api/admin/conveners",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;

        // Get convener role
        const convenerRole = await db.roles.findOne({ where: { name: 'convener' } });
        if (!convenerRole) {
          return res.status(200).json({ error: false, conveners: [], pagination: { total: 0 } });
        }

        const { count, rows: conveners } = await db.users.findAndCountAll({
          where: { role_id: convenerRole.role_id },
          attributes: ['id', 'email', 'first_name', 'last_name', 'joined_at', 'organisation_name', 'organisation_slug'],
          limit,
          offset,
          order: [['joined_at', 'DESC']],
        });

        // Get programme counts per convener
        const convenerIds = conveners.map(c => c.id);
        const programmeCounts = await db.programmes.findAll({
          where: { created_by: { [db.Sequelize.Op.in]: convenerIds } },
          attributes: ['created_by', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
          group: ['created_by'],
          raw: true,
        });

        const progCountMap = {};
        programmeCounts.forEach(p => { progCountMap[p.created_by] = parseInt(p.count); });

        const formatted = conveners.map(c => ({
          id: c.id,
          email: c.email,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
          organisation_name: c.organisation_name || null,
          organisation_slug: c.organisation_slug || null,
          joined_at: c.joined_at,
          programme_count: progCountMap[c.id] || 0,
        }));

        return res.status(200).json({
          error: false,
          conveners: formatted,
          pagination: { total: count, limit, offset, has_more: offset + limit < count }
        });
      } catch (err) {
        console.error('[Admin] Error fetching conveners:', err);
        res.status(500).json({ error: true, message: 'Failed to fetch conveners' });
      }
    }
  );

  /**
   * GET /v1/api/admin/programmes
   * List all programmes across the platform
   */
  app.get(
    "/v1/api/admin/programmes",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;

        const [programmes] = await db.sequelize.query(`
          SELECT
            p.id,
            p.name,
            p.lifecycle_status,
            p.onboarding_mode,
            p.created_at,
            p.created_by,
            CONCAT_WS(' ', u.first_name, u.last_name) AS convener_name,
            u.email AS convener_email,
            u.organisation_name AS convener_org,
            u.id AS convener_id,
            COUNT(DISTINCT e.id) AS enrollment_count
          FROM programmes p
          LEFT JOIN users u ON u.id = p.created_by
          LEFT JOIN cohorts c ON c.programme_id = p.id
          LEFT JOIN enrollments e ON e.cohort_id = c.id
          GROUP BY p.id, u.id
          ORDER BY p.created_at DESC
          LIMIT :limit OFFSET :offset
        `, { replacements: { limit, offset } });

        const [[{ total }]] = await db.sequelize.query(
          'SELECT COUNT(*) AS total FROM programmes'
        );

        const formatted = programmes.map(p => ({
          id: p.id,
          name: p.name,
          lifecycle_status: p.lifecycle_status,
          onboarding_mode: p.onboarding_mode,
          created_at: p.created_at,
          convener: p.convener_id ? {
            id: p.convener_id,
            name: p.convener_name || p.convener_email,
            organisation: p.convener_org || null,
          } : null,
          enrollment_count: parseInt(p.enrollment_count) || 0,
        }));

        return res.status(200).json({
          error: false,
          programmes: formatted,
          pagination: { total: parseInt(total), limit, offset, has_more: offset + limit < parseInt(total) }
        });
      } catch (err) {
        console.error('[Admin] Error fetching programmes:', err);
        res.status(500).json({ error: true, message: 'Failed to fetch programmes' });
      }
    }
  );

  // =====================
  // External Opportunities
  // =====================

  /**
   * GET /v1/api/admin/opportunities
   * List all external opportunities (all statuses) with pagination
   */
  app.get(
    "/v1/api/admin/opportunities",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const statusFilter = req.query.status || null;

        const where = {};
        if (statusFilter) where.status = statusFilter;

        const { count, rows } = await db.external_opportunities.findAndCountAll({
          where,
          limit,
          offset,
          order: [['created_at', 'DESC']],
          attributes: [
            'id', 'title', 'organisation', 'category', 'status',
            'deadline', 'is_featured', 'created_at', 'published_at', 'archived_at',
          ],
        });

        return res.status(200).json({
          error: false,
          opportunities: rows,
          pagination: { total: count, limit, offset, has_more: offset + limit < count },
        });
      } catch (err) {
        console.error('[Admin] Error fetching opportunities:', err);
        return res.status(500).json({ error: true, message: 'Failed to fetch opportunities' });
      }
    }
  );

  /**
   * POST /v1/api/admin/opportunities
   * Create a new external opportunity (draft)
   */
  app.post(
    "/v1/api/admin/opportunities",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const {
          title, description, organisation, category, format,
          duration, price_info, highlights, thumbnail_url,
          apply_url, deadline, location, tags, is_featured,
        } = req.body;

        if (!title || !organisation || !category || !apply_url) {
          return res.status(400).json({ error: true, message: 'title, organisation, category, and apply_url are required' });
        }

        const opportunity = await db.external_opportunities.create({
          title,
          description: description || null,
          organisation,
          category,
          format: format || null,
          duration: duration || null,
          price_info: price_info || null,
          highlights: highlights || null,
          thumbnail_url: thumbnail_url || null,
          apply_url,
          deadline: deadline || null,
          location: location || null,
          tags: tags || null,
          is_featured: is_featured ? 1 : 0,
          status: 'draft',
          created_by: req.user_id,
        });

        return res.status(201).json({ error: false, opportunity });
      } catch (err) {
        console.error('[Admin] Error creating opportunity:', err);
        return res.status(500).json({ error: true, message: 'Failed to create opportunity' });
      }
    }
  );

  /**
   * GET /v1/api/admin/opportunities/:id
   * Get a single opportunity by id
   */
  app.get(
    "/v1/api/admin/opportunities/:id",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const opportunity = await db.external_opportunities.findByPk(req.params.id);
        if (!opportunity) {
          return res.status(404).json({ error: true, message: 'Opportunity not found' });
        }
        return res.status(200).json({ error: false, opportunity });
      } catch (err) {
        console.error('[Admin] Error fetching opportunity:', err);
        return res.status(500).json({ error: true, message: 'Failed to fetch opportunity' });
      }
    }
  );

  /**
   * PATCH /v1/api/admin/opportunities/:id
   * Update editable fields (not status)
   */
  app.patch(
    "/v1/api/admin/opportunities/:id",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const opportunity = await db.external_opportunities.findByPk(req.params.id);
        if (!opportunity) {
          return res.status(404).json({ error: true, message: 'Opportunity not found' });
        }

        const allowedFields = [
          'title', 'description', 'organisation', 'category', 'format',
          'duration', 'price_info', 'highlights', 'thumbnail_url',
          'apply_url', 'deadline', 'location', 'tags', 'is_featured',
        ];

        const updates = {};
        allowedFields.forEach(field => {
          if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
          }
        });

        if (updates.is_featured !== undefined) {
          updates.is_featured = updates.is_featured ? 1 : 0;
        }

        await opportunity.update(updates);
        return res.status(200).json({ error: false, opportunity });
      } catch (err) {
        console.error('[Admin] Error updating opportunity:', err);
        return res.status(500).json({ error: true, message: 'Failed to update opportunity' });
      }
    }
  );

  /**
   * PATCH /v1/api/admin/opportunities/:id/status
   * Publish or archive an opportunity
   */
  app.patch(
    "/v1/api/admin/opportunities/:id/status",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const { status } = req.body;
        if (!['published', 'archived'].includes(status)) {
          return res.status(400).json({ error: true, message: 'Status must be published or archived' });
        }

        const opportunity = await db.external_opportunities.findByPk(req.params.id);
        if (!opportunity) {
          return res.status(404).json({ error: true, message: 'Opportunity not found' });
        }

        const updates = { status };
        if (status === 'published' && !opportunity.published_at) {
          updates.published_at = new Date();
        }
        if (status === 'archived') {
          updates.archived_at = new Date();
        }

        await opportunity.update(updates);
        return res.status(200).json({
          error: false,
          message: `Opportunity ${status} successfully`,
          opportunity,
        });
      } catch (err) {
        console.error('[Admin] Error updating opportunity status:', err);
        return res.status(500).json({ error: true, message: 'Failed to update opportunity status' });
      }
    }
  );

  /**
   * DELETE /v1/api/admin/opportunities/:id
   * Delete a draft opportunity only
   */
  app.delete(
    "/v1/api/admin/opportunities/:id",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const opportunity = await db.external_opportunities.findByPk(req.params.id);
        if (!opportunity) {
          return res.status(404).json({ error: true, message: 'Opportunity not found' });
        }
        if (opportunity.status !== 'draft') {
          return res.status(400).json({ error: true, message: 'Only draft opportunities can be deleted. Archive it instead.' });
        }
        await opportunity.destroy();
        return res.status(200).json({ error: false, message: 'Opportunity deleted' });
      } catch (err) {
        console.error('[Admin] Error deleting opportunity:', err);
        return res.status(500).json({ error: true, message: 'Failed to delete opportunity' });
      }
    }
  );

  // =====================
  // User Status
  // =====================

  /**
   * PATCH /v1/api/admin/users/:id/status
   * Deactivate or reactivate a user account
   */
  app.patch(
    "/v1/api/admin/users/:id/status",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const userId = parseInt(req.params.id);
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
          return res.status(400).json({ error: true, message: 'Status must be active or inactive' });
        }

        // Prevent admin from deactivating themselves
        if (userId === req.user_id) {
          return res.status(400).json({ error: true, message: 'You cannot change your own account status' });
        }

        const user = await db.users.findByPk(userId);
        if (!user) {
          return res.status(404).json({ error: true, message: 'User not found' });
        }

        await db.users.update({ status }, { where: { id: userId } });

        return res.status(200).json({
          error: false,
          message: `User account ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        });
      } catch (err) {
        console.error('[Admin] Error updating user status:', err);
        res.status(500).json({ error: true, message: 'Failed to update user status' });
      }
    }
  );
};
