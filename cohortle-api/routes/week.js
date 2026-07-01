const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const ContentService = require("../services/ContentService");
const { multiLevelAccessControl } = require("../middleware/multiLevelAccessControl");

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/weeks/{week_id}:
   *   put:
   *     summary: Update a week
   *     tags: [Weeks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: week_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               start_date:
   *                 type: string
   *                 format: date
   *     responses:
   *       '200':
   *         description: Week updated successfully
   */
  app.put(
    "/v1/api/weeks/:week_id",
    [
      UrlMiddleware,
      ...multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'week',
        resourceIdParam: 'week_id',
        action: 'update'
      })
    ],
    async function (req, res) {
      try {
        const { week_id } = req.params;
        const { title, start_date } = req.body;

        // Validate week_id is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(week_id)) {
          return res.status(400).json({
            error: true,
            message: "Invalid week ID format",
          });
        }

        // Validate at least one field is provided
        if (title === undefined && start_date === undefined) {
          return res.status(400).json({
            error: true,
            message: "At least one field must be provided: title or start_date",
          });
        }

        // Validate request body fields if provided
        const validationRules = {};
        const validationData = {};

        if (title !== undefined) {
          validationRules.title = "string";
          validationData.title = title;
        }
        if (start_date !== undefined) {
          validationRules.start_date = "date";
          validationData.start_date = start_date;
        }

        const validationResult = await ValidationService.validateObject(
          validationRules,
          validationData
        );

        if (validationResult.error) {
          return res.status(400).json({
            error: true,
            message: validationResult.message || "Invalid request body",
          });
        }

        // Verify week exists
        const db = require("../models");
        const { weeks } = db;
        const week = await weeks.findByPk(week_id);

        if (!week) {
          return res.status(404).json({
            error: true,
            message: "Week not found",
          });
        }

        // Update week
        const fieldsToUpdate = {};
        if (title !== undefined) fieldsToUpdate.title = title;
        if (start_date !== undefined) fieldsToUpdate.start_date = start_date;

        await week.update(fieldsToUpdate);

        return res.status(200).json({
          error: false,
          message: "Week updated successfully",
          week: {
            id: week.id,
            programme_id: week.programme_id,
            week_number: week.week_number,
            title: week.title,
            start_date: week.start_date,
            created_at: week.created_at,
            updated_at: week.updated_at,
          },
        });
      } catch (err) {
        console.error("Error updating week:", err);
        return res.status(500).json({
          error: true,
          message: "Failed to update week. Please try again.",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/weeks/{week_id}:
   *   delete:
   *     summary: Delete a week
   *     tags: [Weeks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: week_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       '200':
   *         description: Week deleted successfully
   */
  app.delete(
    "/v1/api/weeks/:week_id",
    [
      UrlMiddleware,
      ...multiLevelAccessControl({
        requiredRoles: ['convener', 'administrator'],
        resourceType: 'week',
        resourceIdParam: 'week_id',
        action: 'delete'
      })
    ],
    async function (req, res) {
      try {
        const { week_id } = req.params;

        // Validate week_id is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(week_id)) {
          return res.status(400).json({
            error: true,
            message: "Invalid week ID format",
          });
        }

        // Verify week exists
        const db = require("../models");
        const { weeks } = db;
        const week = await weeks.findByPk(week_id);

        if (!week) {
          return res.status(404).json({
            error: true,
            message: "Week not found",
          });
        }

        // Delete week (cascade will handle lessons)
        await week.destroy();

        return res.status(200).json({
          error: false,
          message: "Week deleted successfully",
        });
      } catch (err) {
        console.error("Error deleting week:", err);
        return res.status(500).json({
          error: true,
          message: "Failed to delete week. Please try again.",
        });
      }
    }
  );

  return [];
};
