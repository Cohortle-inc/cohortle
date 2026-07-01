const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/learner/cohorts:
   *   get:
   *     summary: Get all cohorts the learner is enrolled in with community and module counts
   *     description: Returns a list of communities the learner belongs to through their cohort enrollments, including the count of learning units (modules) in each programme.
   *     tags: [Learner]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Communities with module counts fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 communities:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       community_id:
   *                         type: integer
   *                       community_name:
   *                         type: string
   *                       cohort_id:
   *                         type: integer
   *                       cohort_name:
   *                         type: string
   *                       programme_id:
   *                         type: integer
   *                       module_count:
   *                         type: integer
   *       500:
   *         description: Internal server error
   */
  app.get(
    "/v1/api/learner/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "student" })],
    async (req, res) => {
      try {
        const userId = parseInt(req.user_id, 10);
        if (isNaN(userId)) {
          return res.status(400).json({ error: true, message: "Invalid user ID" });
        }

        const sdk = new BackendSDK();
        const sql = `
          SELECT
            c.id AS community_id,
            c.name AS community_name,
            c.description,
            c.thumbnail,
            co.id AS cohort_id,
            co.name AS cohort_name,
            p.id AS programme_id,
            p.name AS programme_name,
            COUNT(pm.id) AS module_count
          FROM communities c
          JOIN programmes p ON p.community_id = c.id
          JOIN cohorts co ON co.programme_id = p.id
          JOIN enrollments e ON e.cohort_id = co.id
          LEFT JOIN programme_modules pm ON pm.programme_id = p.id
          WHERE e.user_id = ${userId}
          GROUP BY c.id, c.name, c.description, c.thumbnail, co.id, co.name, p.id, p.name
        `;

        const communities = await sdk.rawQuery(sql);

        return res.status(200).json({
          error: false,
          message: "Learner cohorts and communities fetched successfully",
          communities,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "something went wrong" });
      }
    }
  );
};
