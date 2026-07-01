const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const ProgressService = require("../services/ProgressService");
const { checkEnrollmentStatus } = require("../middleware/AccessControlMiddleware");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/dashboard/upcoming-sessions:
     *   get:
     *     summary: Get upcoming live sessions across all enrolled programmes
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Upcoming sessions fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 sessions:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       title:
     *                         type: string
     *                       programmeName:
     *                         type: string
     *                       programmeId:
     *                         type: integer
     *                       dateTime:
     *                         type: string
     *                       joinUrl:
     *                         type: string
     */
    app.get(
        "/v1/api/dashboard/upcoming-sessions",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            const { logApiError, logSuccess } = require("../utils/errorLogger");
            
            try {
                const sdk = new BackendSDK();

                // Get all cohorts the user is enrolled in
                sdk.setTable("enrollments");
                const enrollments = await sdk.get({ user_id: req.user_id });

                if (enrollments.length === 0) {
                    return res.status(200).json({
                        error: false,
                        message: "No upcoming sessions",
                        sessions: [],
                    });
                }

                const cohortIds = enrollments.map((e) => e.cohort_id);

                // Get cohorts with their programmes
                sdk.setTable("cohorts");
                const cohorts = await sdk.get({ id: cohortIds });

                const programmeIds = [...new Set(cohorts.map((c) => c.programme_id))];

                const db = require("../models");
                const now = new Date();
                const sessions = [];

                // ── Source 1: WLIMP lessons table (content_type = 'live_session') ──────────
                // Get all weeks for these programmes
                sdk.setTable("weeks");
                const weeks = await sdk.get({ programme_id: programmeIds });
                const weekIds = weeks.map((w) => w.id);

                if (weekIds.length > 0) {
                    const wlimpSessions = await db.lessons.findAll({
                        where: {
                            week_id: weekIds,
                            content_type: "live_session",
                        },
                        include: [
                            {
                                model: db.weeks,
                                as: "week",
                                attributes: ["id", "programme_id"],
                                include: [
                                    {
                                        model: db.programmes,
                                        as: "programme",
                                        attributes: ["id", "name"],
                                    },
                                ],
                            },
                        ],
                    });

                    for (const lesson of wlimpSessions) {
                        if (!lesson.week || !lesson.week.programme) continue;

                        let sessionDate = null;
                        if (lesson.content_text) {
                            try {
                                const content = JSON.parse(lesson.content_text);
                                const rawDate = content.scheduled_date || content.sessionDate;
                                if (rawDate) {
                                    sessionDate = new Date(rawDate);
                                    if (isNaN(sessionDate.getTime())) sessionDate = null;
                                }
                            } catch (e) {
                                try {
                                    sessionDate = new Date(lesson.content_text);
                                    if (isNaN(sessionDate.getTime())) sessionDate = null;
                                } catch (e2) {
                                    sessionDate = null;
                                }
                            }
                        }
                        if (!sessionDate && lesson.content_url) {
                            const candidate = new Date(lesson.content_url);
                            if (!isNaN(candidate.getTime())) sessionDate = candidate;
                        }

                        if (sessionDate && sessionDate > now) {
                            let joinUrl = lesson.content_url || null;
                            if (lesson.content_text) {
                                try {
                                    const content = JSON.parse(lesson.content_text);
                                    joinUrl = content.join_url || content.meetingLink || content.joinUrl || joinUrl;
                                } catch (e) { /* ignore */ }
                            }
                            sessions.push({
                                id: String(lesson.id),
                                title: lesson.title,
                                programmeName: lesson.week.programme.name,
                                programmeId: lesson.week.programme.id,
                                dateTime: sessionDate.toISOString(),
                                joinUrl,
                            });
                        }
                    }
                }

                // ── Source 2: module_lessons table (type = 'live_session') ────────────────
                // Get all programme_modules for these programmes
                sdk.setTable("programme_modules");
                const modules = await sdk.get({ programme_id: programmeIds });
                const moduleIds = modules.map((m) => m.id);

                if (moduleIds.length > 0) {
                    const moduleSessions = await db.module_lessons.findAll({
                        where: {
                            module_id: moduleIds,
                            type: "live_session",
                        },
                        include: [
                            {
                                model: db.programme_modules,
                                as: "module",
                                attributes: ["id", "programme_id"],
                                include: [
                                    {
                                        model: db.programmes,
                                        as: "programme",
                                        attributes: ["id", "name"],
                                    },
                                ],
                            },
                        ],
                    });

                    for (const lesson of moduleSessions) {
                        if (!lesson.module || !lesson.module.programme) continue;

                        // Session data is stored as JSON in the description field
                        // Keys may be camelCase (sessionDate, meetingLink) or snake_case (scheduled_date, join_url)
                        let sessionDate = null;
                        let joinUrl = null;

                        if (lesson.description) {
                            try {
                                const content = JSON.parse(lesson.description);
                                const rawDate = content.scheduled_date || content.sessionDate;
                                if (rawDate) {
                                    sessionDate = new Date(rawDate);
                                    if (isNaN(sessionDate.getTime())) sessionDate = null;
                                }
                                joinUrl = content.join_url || content.meetingLink || content.joinUrl || null;
                            } catch (e) {
                                // description is not JSON — skip
                            }
                        }

                        if (sessionDate && sessionDate > now) {
                            sessions.push({
                                id: String(lesson.id),
                                title: lesson.name,
                                programmeName: lesson.module.programme.name,
                                programmeId: lesson.module.programme.id,
                                dateTime: sessionDate.toISOString(),
                                joinUrl,
                            });
                        }
                    }
                }

                // Sort all sessions chronologically
                sessions.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

                logSuccess('Get upcoming sessions', req, { count: sessions.length });

                return res.status(200).json({
                    error: false,
                    message: "Upcoming sessions fetched successfully",
                    sessions,
                });
            } catch (err) {
                logApiError('Get upcoming sessions', err, req);
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch upcoming sessions. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/dashboard/recent-activity:
     *   get:
     *     summary: Get recently completed lessons
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 5
     *     responses:
     *       '200':
     *         description: Recent activity fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 activities:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       title:
     *                         type: string
     *                       programmeName:
     *                         type: string
     *                       completedAt:
     *                         type: string
     */
    app.get(
        "/v1/api/dashboard/recent-activity",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            const { logApiError, logSuccess } = require("../utils/errorLogger");
            
            try {
                const limit = parseInt(req.query.limit) || 5;

                // Use ProgressService to get recent activity
                const activities = await ProgressService.getRecentActivity(req.user_id, limit);

                logSuccess('Get recent activity', req, { count: activities.length });

                return res.status(200).json({
                    error: false,
                    message: "Recent activity fetched successfully",
                    activities,
                });
            } catch (err) {
                logApiError('Get recent activity', err, req);
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch recent activity. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/dashboard/next-lesson:
     *   get:
     *     summary: Get the next incomplete lesson across all enrolled programmes
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Next lesson fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 lesson:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     title:
     *                       type: string
     *                     programmeId:
     *                       type: integer
     */
    app.get(
        "/v1/api/dashboard/next-lesson",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            const { logApiError, logSuccess } = require("../utils/errorLogger");
            
            try {
                // Use ProgressService to get next incomplete lesson
                const lesson = await ProgressService.getNextIncompleteLesson(req.user_id);

                if (!lesson) {
                    return res.status(200).json({
                        error: false,
                        message: "No incomplete lessons found",
                        lesson: null,
                    });
                }

                logSuccess('Get next lesson', req, { lesson_id: lesson.id });

                return res.status(200).json({
                    error: false,
                    message: "Next lesson fetched successfully",
                    lesson,
                });
            } catch (err) {
                logApiError('Get next lesson', err, req);
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch next lesson. Please try again.",
                });
            }
        }
    );

    return [];
};
