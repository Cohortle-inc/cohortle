const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { COHORT_STATUSES, MEMBER_ROLES } = require("../utils/mappings");
const { logApiError, logValidationError, logSuccess } = require("../utils/errorLogger");
const { multiLevelAccessControl } = require("../middleware/multiLevelAccessControl");

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/cohorts:
   *   post:
   *     summary: Create a cohort in a programme
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: programme_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *               start_date:
   *                 type: string
   *                 format: date
   *               end_date:
   *                 type: string
   *                 format: date
   *               max_members:
   *                 type: integer
   *     responses:
   *       '201':
   *         description: Cohort created successfully
   */
  app.post(
    "/v1/api/programmes/:programme_id/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { programme_id } = req.params;
        const { name, enrollment_code, start_date, end_date, max_members } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            programme_id: "required|integer",
            name: "required|string",
            enrollment_code: "required|string",
            start_date: "date",
            end_date: "date",
            max_members: "integer",
          },
          { programme_id, name, enrollment_code, start_date, end_date, max_members }
        );

        if (validationResult.error) {
          logValidationError('Create cohort', validationResult.errors, req);
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("programmes");
        const programme = (await sdk.get({ id: programme_id }))[0];

        if (!programme) {
          return res.status(404).json({
            error: true,
            message: "Programme not found",
          });
        }

        // Verify ownership
        if (programme.created_by !== req.user_id) {
          return res.status(403).json({
            error: true,
            message: "You do not have permission to create cohorts in this programme",
          });
        }

        // Check if enrollment code is already in use
        sdk.setTable("cohorts");
        const existingCohort = await sdk.get({ enrollment_code });
        if (existingCohort.length > 0) {
          return res.status(400).json({
            error: true,
            message: "This enrollment code is already in use",
          });
        }

        const cohort_id = await sdk.insert({
          programme_id,
          name,
          enrollment_code,
          start_date,
          end_date,
          max_members,
          status: COHORT_STATUSES.ACTIVE,
        });

        // Fetch the created cohort to return it
        const createdCohort = (await sdk.get({ id: cohort_id }))[0];

        logSuccess('Create cohort', req, { cohort_id, name });

        return res.status(201).json({
          error: false,
          message: "Cohort created successfully",
          cohort_id,
          cohort: createdCohort,
        });
      } catch (err) {
        logApiError('Create cohort', err, req, { programme_id, name, enrollment_code });
        res.status(500).json({
          error: true,
          message: "Failed to create cohort. Please try again.",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/enrollment-codes/check:
   *   get:
   *     summary: Check if an enrollment code is available
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       '200':
   *         description: Availability status returned
   *       '400':
   *         description: Missing code parameter
   */
  app.get(
    "/v1/api/enrollment-codes/check",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { code } = req.query;

        // Validate code parameter is provided
        if (!code) {
          return res.status(400).json({
            error: true,
            message: "Enrollment code is required",
          });
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        
        // Check if enrollment code exists
        const existingCohort = await sdk.get({ enrollment_code: code });
        
        return res.status(200).json({
          available: existingCohort.length === 0,
        });
      } catch (err) {
        console.error("Error checking enrollment code availability:", err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/cohorts:
   *   get:
   *     summary: Get all cohorts in a programme
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: programme_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Cohorts fetched successfully
   */
  app.get(
    "/v1/api/programmes/:programme_id/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
    async function (req, res) {
      try {
        const { programme_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { programme_id: "required|integer" },
          { programme_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        const cohorts = await sdk.rawQuery(`
          SELECT c.*, COUNT(cm.id) as member_count
          FROM cohorts c
          LEFT JOIN cohort_members cm ON c.id = cm.cohort_id
          WHERE c.programme_id = ${programme_id}
          GROUP BY c.id
        `);

        return res.status(200).json({
          error: false,
          message: "Cohorts fetched successfully",
          cohorts,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}:
   *   get:
   *     summary: Get a single cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Cohort fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        // Get programme name for frontend metadata
        if (cohort.programme_id) {
          sdk.setTable("programmes");
          const programme = (await sdk.get({ id: cohort.programme_id }))[0];
          if (programme) {
            cohort.programme_name = programme.name;
          }
        }

        // Get member count
        sdk.setTable("cohort_members");
        const members = await sdk.get({ cohort_id });
        cohort.member_count = members.length;

        return res.status(200).json({
          error: false,
          message: "Cohort fetched successfully",
          cohort,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}:
   *   put:
   *     summary: Update a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               start_date:
   *                 type: string
   *               end_date:
   *                 type: string
   *               max_members:
   *                 type: integer
   *               status:
   *                 type: string
   *     responses:
   *       '200':
   *         description: Cohort updated successfully
   */
  app.put(
    "/v1/api/cohorts/:cohort_id",
    [
      UrlMiddleware,
      ...multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'cohort',
        resourceIdParam: 'cohort_id',
        action: 'update'
      })
    ],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { name, start_date, end_date, max_members, status } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            name: "string",
            start_date: "date",
            end_date: "date",
            max_members: "integer",
            status: "string",
          },
          { cohort_id, name, start_date, end_date, max_members, status }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        await sdk.update(
          {
            ...(name !== undefined ? { name } : {}),
            ...(start_date !== undefined ? { start_date } : {}),
            ...(end_date !== undefined ? { end_date } : {}),
            ...(max_members !== undefined ? { max_members } : {}),
            ...(status !== undefined ? { status } : {}),
          },
          cohort_id
        );

        // Fetch the updated cohort to return it
        const updatedCohort = (await sdk.get({ id: cohort_id }))[0];

        return res.status(200).json({
          error: false,
          message: "Cohort updated successfully",
          cohort: updatedCohort,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/join:
   *   post:
   *     summary: Join a cohort as a learner
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Joined cohort successfully
   */
  app.post(
    "/v1/api/cohorts/:cohort_id/join",
    [UrlMiddleware, TokenMiddleware({ role: "student" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { user_id } = req;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // Check cohort exists and is active
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        if (cohort.status !== COHORT_STATUSES.ACTIVE) {
          return res.status(400).json({
            error: true,
            message: "Cohort is not active",
          });
        }

        // Check if already a member
        sdk.setTable("cohort_members");
        const existing = await sdk.get({ cohort_id, user_id });

        if (existing.length > 0) {
          return res.status(400).json({
            error: true,
            message: "You are already a member of this cohort",
          });
        }

        // Check capacity if max_members is set
        if (cohort.max_members) {
          const currentMembers = await sdk.get({ cohort_id });
          if (currentMembers.length >= cohort.max_members) {
            return res.status(400).json({
              error: true,
              message: "Cohort is full",
            });
          }
        }

        // Add member
        const member_id = await sdk.insert({
          cohort_id,
          user_id,
          role: MEMBER_ROLES.LEARNER,
          status: "active",
        });

        return res.status(200).json({
          error: false,
          message: "Joined cohort successfully",
          member_id,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/members:
   *   post:
   *     summary: Add a member to a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [learner, instructor, facilitator]
   *     responses:
   *       '201':
   *         description: Member added successfully
   */
  app.post(
    "/v1/api/cohorts/:cohort_id/members",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { email, role = MEMBER_ROLES.LEARNER } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            email: "required|email",
            role: `in:${Object.values(MEMBER_ROLES).join(",")}`,
          },
          { cohort_id, email, role }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // Find user by email
        sdk.setTable("users");
        const user = (await sdk.get({ email }))[0];

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found with this email",
          });
        }

        // Check if already a member
        sdk.setTable("cohort_members");
        const existing = await sdk.get({ cohort_id, user_id: user.id });

        if (existing.length > 0) {
          return res.status(400).json({
            error: true,
            message: "User is already a member of this cohort",
          });
        }

        // Add member
        const member_id = await sdk.insert({
          cohort_id,
          user_id: user.id,
          role,
          status: "active",
        });

        return res.status(201).json({
          error: false,
          message: "Member added successfully",
          member_id,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/members:
   *   get:
   *     summary: Get all members in a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Members fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/members",
    [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        const members = await sdk.rawQuery(`
          SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.profile_image,
            cm.role,
            cm.status,
            cm.enrolled_at,
            cm.id AS member_id 
          FROM cohort_members cm
          JOIN users u ON u.id = cm.user_id
          WHERE cm.cohort_id = ${cohort_id}
          ORDER BY cm.enrolled_at DESC
        `);

        return res.status(200).json({
          error: false,
          message: "Members fetched successfully",
          members,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/members/{member_id}/role:
   *   patch:
   *     summary: Update a member's role
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: member_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - role
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [learner, instructor, facilitator]
   *     responses:
   *       '200':
   *         description: Role updated successfully
   */
  app.patch(
    "/v1/api/cohorts/:cohort_id/members/:member_id/role",
    [
      UrlMiddleware,
      ...multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'cohort',
        resourceIdParam: 'cohort_id',
        action: 'manage'
      })
    ],
    async function (req, res) {
      try {
        const { cohort_id, member_id } = req.params;
        const { role } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            member_id: "required|integer",
            role: `required|in:${Object.values(MEMBER_ROLES).join(",")}`,
          },
          { cohort_id, member_id, role }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohort_members");

        await sdk.update({ role }, member_id);

        return res.status(200).json({
          error: false,
          message: "Role updated successfully",
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/members/{member_id}:
   *   delete:
   *     summary: Remove a member from a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: member_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Member removed successfully
   */
  app.delete(
    "/v1/api/cohorts/:cohort_id/members/:member_id",
    [
      UrlMiddleware,
      ...multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'cohort',
        resourceIdParam: 'cohort_id',
        action: 'manage'
      })
    ],
    async function (req, res) {
      try {
        const { cohort_id, member_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            member_id: "required|integer",
          },
          { cohort_id, member_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohort_members");

        await sdk.deleteWhere({ id: member_id, cohort_id });

        return res.status(200).json({
          error: false,
          message: "Member removed successfully",
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/progress-summary:
   *   get:
   *     summary: Get aggregated progress summary for a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Progress summary fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/progress-summary",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );
        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // aggregate totals for the cohort using enrollments + lesson_completions:
        const aggSql = `
          SELECT
            COUNT(DISTINCT e.user_id) AS member_count,
            COUNT(DISTINCT lc.id) AS total_completed_lessons,
            CASE 
              WHEN COUNT(DISTINCT e.user_id) > 0 AND (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id JOIN cohorts c2 ON c2.programme_id = w2.programme_id WHERE c2.id = ${cohort_id}) > 0
              THEN ROUND(
                COUNT(DISTINCT lc.id) * 100.0 / 
                (COUNT(DISTINCT e.user_id) * (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id JOIN cohorts c2 ON c2.programme_id = w2.programme_id WHERE c2.id = ${cohort_id}))
              , 2)
              ELSE 0
            END AS average_completion_percentage
          FROM enrollments e
          LEFT JOIN lesson_completions lc ON lc.user_id = e.user_id AND lc.cohort_id = ${cohort_id}
          WHERE e.cohort_id = ${cohort_id}
        `;
        const aggResult = await sdk.rawQuery(aggSql);
        const agg = (aggResult && aggResult[0]) || {
          member_count: 0,
          total_completed_lessons: 0,
          average_completion_percentage: 0,
        };

        return res.status(200).json({
          error: false,
          message: "Cohort progress summary fetched successfully",
          data: {
            member_count: Number(agg.member_count) || 0,
            total_completed_lessons: Number(agg.total_completed_lessons) || 0,
            average_completion_percentage: Number(agg.average_completion_percentage) || 0,
          },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "Internal server error" });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}:
   *   delete:
   *     summary: Delete a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Cohort deleted successfully
   */
  app.delete(
    "/v1/api/cohorts/:cohort_id",
    [
      UrlMiddleware,
      ...multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'cohort',
        resourceIdParam: 'cohort_id',
        action: 'delete'
      })
    ],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        // Delete cohort (cascade will handle members)
        await sdk.deleteWhere({ id: cohort_id });

        return res.status(200).json({
          error: false,
          message: "Cohort deleted successfully",
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/learners:
   *   get:
   *     summary: Get all learners in a cohort with their progress
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Learners fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/learners",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        
        // Get cohort to verify it exists and get programme_id
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        // Get learners with their progress using lesson_completions
        const learners = await sdk.rawQuery(`
          SELECT 
            e.id as enrollment_id,
            e.status,
            e.payment_status,
            e.payment_due_date,
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.profile_image,
            CONCAT(u.first_name, ' ', u.last_name) as name,
            e.enrolled_at,
            COUNT(DISTINCT lc.id) as completed_lessons,
            (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}) as total_lessons,
            CASE 
              WHEN (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}) > 0
              THEN ROUND(COUNT(DISTINCT lc.id) * 100.0 / (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}), 2)
              ELSE 0
            END as completion_percentage,
            CASE 
              WHEN (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}) > 0
              THEN ROUND(COUNT(DISTINCT lc.id) * 100.0 / (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}), 2)
              ELSE 0
            END as progress,
            MAX(lc.completed_at) as last_activity_at
          FROM enrollments e
          JOIN users u ON u.id = e.user_id
          LEFT JOIN lesson_completions lc ON lc.user_id = e.user_id AND lc.cohort_id = ${cohort_id}
          WHERE e.cohort_id = ${cohort_id}
          GROUP BY u.id, u.first_name, u.last_name, u.email, u.profile_image, e.enrolled_at, e.id, e.status, e.payment_status, e.payment_due_date
          ORDER BY e.enrolled_at DESC
        `);

        return res.status(200).json({
          error: false,
          message: "Learners fetched successfully",
          learners,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/learners/{learner_id}:
   *   get:
   *     summary: Get a specific learner's details and progress in a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: learner_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Learner details fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/learners/:learner_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, learner_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            learner_id: "required|integer",
          },
          { cohort_id, learner_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        
        // Get cohort to verify it exists and get programme_id
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        // Get learner details with progress (using enrollments + lesson_completions)
        const learnerData = await sdk.rawQuery(`
          SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.profile_image,
            e.enrolled_at,
            COUNT(DISTINCT lc.id) as completed_lessons,
            (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}) as total_lessons,
            CASE 
              WHEN (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}) > 0
              THEN ROUND(COUNT(DISTINCT lc.id) * 100.0 / (SELECT COUNT(*) FROM lessons l2 JOIN weeks w2 ON l2.week_id = w2.id WHERE w2.programme_id = ${cohort.programme_id}), 2)
              ELSE 0
            END as completion_percentage,
            MAX(lc.completed_at) as last_activity_at
          FROM enrollments e
          JOIN users u ON u.id = e.user_id
          LEFT JOIN lesson_completions lc ON lc.user_id = e.user_id
            AND lc.cohort_id = ${cohort_id}
          WHERE e.cohort_id = ${cohort_id} 
            AND e.user_id = ${learner_id}
          GROUP BY u.id, u.first_name, u.last_name, u.email, u.profile_image, e.enrolled_at
        `);

        if (learnerData.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Learner not found in this cohort",
          });
        }

        const learner = learnerData[0];

        // Get lesson completion details using the correct tables
        const lessonProgress = await sdk.rawQuery(`
          SELECT 
            l.id as lesson_id,
            l.title as lesson_name,
            CONCAT('Week ', w.week_number) as module_name,
            CASE WHEN lc.id IS NOT NULL THEN 1 ELSE 0 END as completed,
            lc.completed_at
          FROM lessons l
          JOIN weeks w ON l.week_id = w.id
          LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id 
            AND lc.user_id = ${learner_id}
            AND lc.cohort_id = ${cohort_id}
          WHERE w.programme_id = ${cohort.programme_id}
          ORDER BY w.week_number, l.order_index
        `);

        return res.status(200).json({
          error: false,
          message: "Learner details fetched successfully",
          learner: {
            ...learner,
            lesson_progress: lessonProgress,
          },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/learners/{learner_id}/payments:
   *   get:
   *     summary: Get payment and installment plan information for a learner in a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: learner_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Payment details fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/learners/:learner_id/payments",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, learner_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            learner_id: "required|integer",
          },
          { cohort_id, learner_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        sdk.setTable("enrollments");
        const enrollment = (await sdk.get({ cohort_id, user_id: learner_id }))[0];

        if (!enrollment) {
          return res.status(404).json({
            error: true,
            message: "Learner enrollment not found in this cohort",
          });
        }

        sdk.setTable("learner_payments");
        const payments = await sdk.get({ enrollment_id: enrollment.id });

        sdk.setTable("installment_plans");
        const installmentPlans = await sdk.get({ enrollment_id: enrollment.id });

        return res.status(200).json({
          error: false,
          message: "Payment details fetched successfully",
          enrollment: {
            payment_status: enrollment.payment_status || null,
            payment_due_date: enrollment.payment_due_date || null,
          },
          payments,
          installment_plan: installmentPlans.length > 0 ? installmentPlans[0] : null,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/check-cohort-membership:
   *   post:
   *     summary: Check if a user is a member of any cohort within a programme
   *     description: Verify whether a user belongs to any cohort within a community's programme
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: programme_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *             properties:
   *               user_id:
   *                 type: integer
   *     responses:
   *       '200':
   *         description: Membership status returned
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 is_member:
   *                   type: boolean
   *                 cohorts:
   *                   type: array
   *                   description: List of cohorts the user is a member of
   *       '400':
   *         description: Invalid input
   *       '403':
   *         description: Unauthorized access
   *       '404':
   *         description: Programme not found
   */
  app.post(
    "/v1/api/programmes/:programme_id/check-cohort-membership",
    [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
    async function (req, res) {
      try {
        const { programme_id } = req.params;
        const { user_id } = req.body;
        const { user_id: requester_id, role } = req;

        // Validate inputs
        const validationResult = await ValidationService.validateObject(
          {
            programme_id: "required|integer",
            user_id: "required|integer",
          },
          { programme_id, user_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // Verify that the programme exists
        sdk.setTable("programmes");
        const programme = (await sdk.get({ id: programme_id }))[0];

        if (!programme) {
          return res.status(404).json({
            error: true,
            message: "Programme not found",
          });
        }

        // Check if requester has permission
        // Conveners can check any user, learners can only check themselves
        if (
          role === "learner" &&
          user_id !== requester_id
        ) {
          return res.status(403).json({
            error: true,
            message: "You do not have permission to check other users' membership",
          });
        }

        // Check if user is a member of any cohort within this programme
        const sql = `
          SELECT 
            c.id,
            c.name,
            c.programme_id,
            cm.status,
            cm.created_at as joined_at
          FROM cohort_members cm
          JOIN cohorts c ON cm.cohort_id = c.id
          WHERE c.programme_id = ${programme_id} AND cm.user_id = ${user_id}
          ORDER BY cm.created_at DESC
        `;

        const cohortMemberships = await sdk.rawQuery(sql);

        if (cohortMemberships.length > 0) {
          return res.status(200).json({
            error: false,
            message: `User is a member of ${cohortMemberships.length} cohort(s) in this programme`,
            is_member: true,
            cohorts: cohortMemberships.map(c => ({
              cohort_id: c.id,
              cohort_name: c.name,
              status: c.status,
              joined_at: c.joined_at,
            })),
          });
        } else {
          return res.status(200).json({
            error: false,
            message: "User is not a member of any cohort in this programme",
            is_member: false,
            cohorts: [],
          });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "Something went wrong",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/analytics:
   *   get:
   *     summary: Get detailed analytics for a cohort (per-week and per-lesson breakdown)
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Analytics fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/analytics",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );
        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // Verify cohort exists
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];
        if (!cohort) {
          return res.status(404).json({ error: true, message: "Cohort not found" });
        }

        const programme_id = cohort.programme_id;

        // Total enrolled learners
        const enrolledResult = await sdk.rawQuery(`
          SELECT COUNT(DISTINCT user_id) AS member_count
          FROM enrollments
          WHERE cohort_id = ${cohort_id}
        `);
        const memberCount = Number((enrolledResult[0] || {}).member_count) || 0;

        // Per-week breakdown: how many learners completed all lessons in each week
        const weekBreakdown = await sdk.rawQuery(`
          SELECT
            w.id AS week_id,
            w.week_number,
            w.title AS week_title,
            COUNT(DISTINCT l.id) AS total_lessons,
            COALESCE(SUM(per_learner.completed_in_week), 0) AS total_completions,
            CASE
              WHEN COUNT(DISTINCT l.id) > 0 AND ${memberCount} > 0
              THEN ROUND(
                COALESCE(SUM(per_learner.completed_in_week), 0) * 100.0
                / (COUNT(DISTINCT l.id) * ${memberCount})
              , 1)
              ELSE 0
            END AS completion_rate
          FROM weeks w
          JOIN lessons l ON l.week_id = w.id
          LEFT JOIN (
            SELECT lc.lesson_id, COUNT(DISTINCT lc.user_id) AS completed_in_week
            FROM lesson_completions lc
            JOIN lessons l2 ON lc.lesson_id = l2.id
            JOIN weeks w2 ON l2.week_id = w2.id
            WHERE w2.programme_id = ${programme_id}
              AND lc.cohort_id = ${cohort_id}
            GROUP BY lc.lesson_id
          ) per_learner ON per_learner.lesson_id = l.id
          WHERE w.programme_id = ${programme_id}
          GROUP BY w.id, w.week_number, w.title
          ORDER BY w.week_number ASC
        `);

        // Per-lesson breakdown: completion count per lesson
        const lessonBreakdown = await sdk.rawQuery(`
          SELECT
            l.id AS lesson_id,
            l.title AS lesson_title,
            l.content_type,
            l.order_index,
            w.id AS week_id,
            w.week_number,
            w.title AS week_title,
            COUNT(DISTINCT lc.user_id) AS completed_count,
            CASE
              WHEN ${memberCount} > 0
              THEN ROUND(COUNT(DISTINCT lc.user_id) * 100.0 / ${memberCount}, 1)
              ELSE 0
            END AS completion_rate
          FROM lessons l
          JOIN weeks w ON l.week_id = w.id
          LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id
            AND lc.cohort_id = ${cohort_id}
          WHERE w.programme_id = ${programme_id}
          GROUP BY l.id, l.title, l.content_type, l.order_index, w.id, w.week_number, w.title
          ORDER BY w.week_number ASC, l.order_index ASC
        `);

        // Overall summary
        const summaryResult = await sdk.rawQuery(`
          SELECT
            COUNT(DISTINCT lc.id) AS total_completions,
            COUNT(DISTINCT l.id) AS total_lessons,
            CASE
              WHEN COUNT(DISTINCT l.id) > 0 AND ${memberCount} > 0
              THEN ROUND(
                COUNT(DISTINCT lc.id) * 100.0
                / (COUNT(DISTINCT l.id) * ${memberCount})
              , 1)
              ELSE 0
            END AS overall_completion_rate
          FROM lessons l
          JOIN weeks w ON l.week_id = w.id
          LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id
            AND lc.cohort_id = ${cohort_id}
          WHERE w.programme_id = ${programme_id}
        `);
        const summary = summaryResult[0] || {};

        return res.status(200).json({
          error: false,
          message: "Analytics fetched successfully",
          data: {
            member_count: memberCount,
            total_lessons: Number(summary.total_lessons) || 0,
            total_completions: Number(summary.total_completions) || 0,
            overall_completion_rate: Number(summary.overall_completion_rate) || 0,
            weeks: weekBreakdown.map(w => ({
              week_id: w.week_id,
              week_number: Number(w.week_number),
              week_title: w.week_title,
              total_lessons: Number(w.total_lessons),
              total_completions: Number(w.total_completions),
              completion_rate: Number(w.completion_rate),
            })),
            lessons: lessonBreakdown.map(l => ({
              lesson_id: l.lesson_id,
              lesson_title: l.lesson_title,
              content_type: l.content_type,
              order_index: Number(l.order_index),
              week_id: l.week_id,
              week_number: Number(l.week_number),
              week_title: l.week_title,
              completed_count: Number(l.completed_count),
              completion_rate: Number(l.completion_rate),
            })),
          },
        });
      } catch (err) {
        console.error("Error fetching cohort analytics:", err);
        res.status(500).json({ error: true, message: "Internal server error" });
      }
    }
  );

  return [];
};
