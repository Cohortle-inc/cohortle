const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const { validateLessonIdFormat, validateLessonExists } = require("../middleware/LessonValidationMiddleware");
const ValidationService = require("../services/ValidationService");
const { LESSON_STATUSES } = require("../utils/mappings");
const path = require("path");
const { upload, uploadToBunny } = require("../config/bunnyStream");
const { multiLevelAccessControl } = require("../middleware/multiLevelAccessControl");
const { checkEnrollmentStatus } = require("../middleware/AccessControlMiddleware");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/modules/{module_id}/lessons:
     *   post:
     *     summary: Create a lesson in a module
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: module_id
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
     *               - order_number
     *             properties:
     *               name:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [draft, published]
     *               description:
     *                 type: string
     *               order_number:
     *                 type: integer
     *               estimated_duration:
     *                 type: integer
     *               is_required:
     *                 type: boolean
     *               text:
     *                 type: string
     *               video_guid:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [text, video, pdf, live_session, link, assignment, quiz, form, reflection, practical_task]
     *                 default: video
     *     responses:
     *       '201':
     *         description: Lesson created successfully
     */
    app.post(
        "/v1/api/modules/:module_id/lessons",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { module_id } = req.params;
                const {
                    name,
                    status,
                    description,
                    order_number,
                    estimated_duration,
                    is_required = true,
                    text,
                    video_guid,
                    type = "video",
                } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        module_id: "required|integer",
                        name: "required|string",
                        order_number: "required|integer",
                        status: "string",
                        description: "string",
                        estimated_duration: "integer",
                    },
                    { module_id, name, status, description, order_number, estimated_duration }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("programme_modules");
                const module = (await sdk.get({ id: module_id }))[0];

                if (!module) {
                    return res.status(404).json({
                        error: true,
                        message: "Module not found",
                    });
                }

                // Validate quiz_data if provided
                const { quiz_data } = req.body;
                if (type === 'quiz' && quiz_data) {
                    const QuizService = require('../services/QuizService');
                    try {
                        const parsed = typeof quiz_data === 'string' ? JSON.parse(quiz_data) : quiz_data;
                        QuizService.validateQuizData(parsed);
                    } catch (err) {
                        if (err.name === 'ValidationError') {
                            return res.status(400).json({ error: true, message: err.message });
                        }
                        return res.status(400).json({ error: true, message: 'quiz_data must be valid JSON' });
                    }
                }

                // Validate assignment_data if provided
                const { assignment_data } = req.body;
                if (type === 'assignment' && assignment_data) {
                    const AssignmentService = require('../services/AssignmentService');
                    try {
                        const parsed = typeof assignment_data === 'string' ? JSON.parse(assignment_data) : assignment_data;
                        AssignmentService.validateAssignmentData(parsed);
                    } catch (err) {
                        if (err.name === 'ValidationError') {
                            return res.status(400).json({ error: true, message: err.message });
                        }
                        return res.status(400).json({ error: true, message: 'assignment_data must be valid JSON' });
                    }
                }

                // Create lesson
                sdk.setTable("module_lessons");
                const lesson_id = await sdk.insert({
                    module_id,
                    name,
                    // Use provided status or default to 'draft' to satisfy DB constraint
                    status: 'draft',
                    description,
                    order_number,
                    estimated_duration,
                    is_required,
                    text,
                    video_guid,
                    type,
                    ...(quiz_data !== undefined ? { quiz_data: typeof quiz_data === 'string' ? quiz_data : JSON.stringify(quiz_data) } : {}),
                    ...(assignment_data !== undefined ? { assignment_data: typeof assignment_data === 'string' ? assignment_data : JSON.stringify(assignment_data) } : {}),
                });

                // Fetch the complete lesson object
                const lesson = (await sdk.get({ id: lesson_id }))[0];

                return res.status(201).json({
                    error: false,
                    message: "Lesson created successfully",
                    lesson: {
                        id: lesson.id,
                        module_id: lesson.module_id,
                        name: lesson.name,
                        status: lesson.status,
                        description: lesson.description,
                        order_number: lesson.order_number,
                        estimated_duration: lesson.estimated_duration,
                        is_required: lesson.is_required,
                        text: lesson.text,
                        video_guid: lesson.video_guid,
                        type: lesson.type,
                        media: lesson.media,
                        quiz_data: lesson.quiz_data ? (typeof lesson.quiz_data === 'string' ? JSON.parse(lesson.quiz_data) : lesson.quiz_data) : null,
                        assignment_data: lesson.assignment_data ? (typeof lesson.assignment_data === 'string' ? JSON.parse(lesson.assignment_data) : lesson.assignment_data) : null,
                        created_at: lesson.created_at,
                        updated_at: lesson.updated_at,
                    },
                });
            } catch (err) {
                console.error("Lesson update error:", err.response?.data || err.message || err);
                if (err.response) {
                    // Axios error from Bunny or other HTTP call
                    return res.status(err.response.status || 500).json({
                        error: true,
                        message: err.response.data || err.message,
                    });
                }

                return res.status(500).json({
                    error: true,
                    message: err.message || "something went wrong",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/modules/{module_id}/lessons:
     *   get:
     *     summary: Get all lessons in a module
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: module_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lessons fetched successfully
     */
    app.get(
        "/v1/api/modules/:module_id/lessons",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { module_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { module_id: "required|integer" },
                    { module_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                const user_id = Number(req.user_id);
                const cohort_id = req.query.cohort_id ? Number(req.query.cohort_id) : null;

                let lessons;
                if (cohort_id) {
                    // Fetch lessons with completion status for a specific cohort/user
                    const query = `
                        SELECT ml.*, 
                        CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END as completed
                        FROM module_lessons ml
                        LEFT JOIN lesson_progress lp ON ml.id = lp.lesson_id 
                            AND lp.user_id = ${user_id} 
                            AND lp.cohort_id = ${cohort_id}
                        WHERE ml.module_id = ${module_id}
                        ORDER BY ml.order_number ASC
                    `;
                    lessons = await sdk.rawQuery(query);
                    // Convert completed to boolean for JS consistency
                    lessons = (lessons || []).map(l => ({ ...l, completed: !!l.completed }));

                } else {
                    sdk.setTable("module_lessons");
                    lessons = await sdk.get({ module_id }, "*", "order_number", "ASC");
                }

                return res.status(200).json({
                    error: false,
                    message: "Lessons fetched successfully",
                    lessons,
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
     * /v1/api/lessons/{lesson_id}:
     *   get:
     *     summary: Get a single lesson
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lesson fetched successfully
     */
    app.get(
        "/v1/api/lessons/:lesson_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" }), checkEnrollmentStatus, validateLessonIdFormat, validateLessonExists],
        async function (req, res) {
            try {
                // Lesson is already validated and stored in req.lesson by middleware
                const lesson = req.lesson;

                return res.status(200).json({
                    error: false,
                    message: "Lesson fetched successfully",
                    lesson,
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
     * /v1/api/lessons/{lesson_id}:
     *   put:
     *     summary: Update a lesson
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [draft, published]
     *               description:
     *                 type: string
     *               order_number:
     *                 type: integer
     *               estimated_duration:
     *                 type: integer
     *               is_required:
     *                 type: boolean
     *               text:
     *                 type: string
     *               video_guid:
     *                 type: string
     *               media:
     *                 type: string
     *                 format: binary
     *               type:
     *                 type: string
     *                 enum: [text, video, pdf, live_session, link, assignment, quiz, form, reflection, practical_task]
     *     responses:
     *       '200':
     *         description: Lesson updated successfully
     */
    app.put(
        "/v1/api/lessons/:lesson_id",
        [
            UrlMiddleware,
            ...multiLevelAccessControl({
                requiredRoles: ['convener', 'administrator'],
                resourceType: 'lesson',
                resourceIdParam: 'lesson_id',
                action: 'update'
            }),
            validateLessonIdFormat,
            validateLessonExists,
            upload.single("media")
        ],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { name, status, description, order_number, estimated_duration, is_required, text, video_guid, type, quiz_data } = req.body;

                // Validate quiz_data if provided
                if ((type === 'quiz' || lesson.type === 'quiz') && quiz_data) {
                    const QuizService = require('../services/QuizService');
                    try {
                        const parsed = typeof quiz_data === 'string' ? JSON.parse(quiz_data) : quiz_data;
                        QuizService.validateQuizData(parsed);
                    } catch (err) {
                        if (err.name === 'ValidationError') {
                            return res.status(400).json({ error: true, message: err.message });
                        }
                        return res.status(400).json({ error: true, message: 'quiz_data must be valid JSON' });
                    }
                }

                // Validate request body fields
                const validationResult = await ValidationService.validateObject(
                    {
                        name: "string",
                        status: "string",
                        description: "string",
                        order_number: "integer",
                        estimated_duration: "integer",
                    },
                    { name, status, description, order_number, estimated_duration }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                // Lesson is already validated and stored in req.lesson by middleware
                const lesson = req.lesson;
                const sdk = new BackendSDK();
                sdk.setTable("module_lessons");

                let media = lesson.media;
                let current_video_guid = video_guid || lesson.video_guid;
                let final_duration = estimated_duration || lesson.estimated_duration;

                if (req.file) {
                    // If multer.diskStorage was used, the uploaded file is saved to disk.
                    // Prefer a file path to stream large files instead of buffering in memory.
                    const filePath = req.file.path || (req.file.destination && req.file.filename ? path.join(req.file.destination, req.file.filename) : null);
                    if (!filePath) {
                        return res.status(500).json({ error: true, message: "Uploaded file path not found" });
                    }

                    const uploadResult = await uploadToBunny(filePath, {
                        title: name || lesson.name,
                    });

                    media = uploadResult.playbackUrl;
                    current_video_guid = uploadResult.videoId;

                    // Extract duration if available (Bunny returns it in bunnyVideoObject.length or similar)
                    if (uploadResult.bunnyVideoObject && uploadResult.bunnyVideoObject.length) {
                        final_duration = Math.ceil(uploadResult.bunnyVideoObject.length / 60); // Convert seconds to minutes
                    }
                }

                await sdk.update(
                    {
                        ...(name !== undefined ? { name } : {}),
                        ...(status !== undefined ? { status } : {}),
                        ...(description !== undefined ? { description } : {}),
                        ...(order_number !== undefined ? { order_number } : {}),
                        ...(final_duration !== undefined ? { estimated_duration: final_duration } : {}),
                        ...(is_required !== undefined ? { is_required } : {}),
                        ...(text !== undefined ? { text } : {}),
                        ...(current_video_guid !== undefined ? { video_guid: current_video_guid } : {}),
                        ...(type !== undefined ? { type } : {}),
                        ...(quiz_data !== undefined ? { quiz_data: typeof quiz_data === 'string' ? quiz_data : JSON.stringify(quiz_data) } : {}),
                        media,
                    },
                    lesson_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Lesson updated successfully",
                    lesson: {
                        id: lesson_id,
                        media,
                        video_guid: current_video_guid,
                        estimated_duration: final_duration
                    }
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
     * /v1/api/lessons/{lesson_id}/complete:
     *   post:
     *     summary: Mark a lesson as completed
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
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
     *               - cohort_id
     *             properties:
     *               cohort_id:
     *                 type: integer
     *     responses:
     *       '200':
     *         description: Lesson marked as completed
     */
    app.post(
        "/v1/api/lessons/:lesson_id/complete",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.body;
                const ProgressService = require("../services/ProgressService");

                console.log(`[DEBUG] Marking lesson complete - lesson_id: ${lesson_id}, cohort_id: ${cohort_id}, user_id: ${req.user_id}`);

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|string", // UUID for WLIMP lessons
                        cohort_id: "required|integer",
                    },
                    { lesson_id, cohort_id }
                );

                if (validationResult.error) {
                    console.log(`[DEBUG] Validation error:`, validationResult);
                    return res.status(400).json(validationResult);
                }

                // Check if lesson exists in the lessons table
                const BackendSDK = require("../core/BackendSDK");
                const sdk = new BackendSDK();
                sdk.setTable("lessons");
                const lesson = (await sdk.get({ id: lesson_id }))[0];
                
                if (!lesson) {
                    console.log(`[DEBUG] Lesson not found in database: ${lesson_id}`);
                    return res.status(404).json({
                        error: true,
                        message: "Lesson not found",
                    });
                }

                console.log(`[DEBUG] Lesson found:`, lesson);

                // Use ProgressService for WLIMP lessons
                await ProgressService.markLessonComplete(
                    req.user_id,
                    lesson_id,
                    parseInt(cohort_id)
                );

                console.log(`[DEBUG] Lesson marked complete successfully`);

                // Recalculate streak and evaluate achievements after successful lesson completion
                try {
                  const StreakService = require("../services/StreakService");
                  await StreakService.recalculateStreak(req.user_id);
                  const AchievementService = require("../services/AchievementService");
                  await AchievementService.evaluateAchievements(req.user_id);
                } catch (err) {
                  console.error('[LessonComplete] Post-completion side effects failed:', err);
                }

                return res.status(200).json({
                    error: false,
                    message: "Lesson marked as completed",
                    success: true,
                });
            } catch (err) {
                console.error("Error marking lesson complete:", err);
                res.status(500).json({
                    error: true,
                    message: "Failed to mark lesson as complete",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}/completion:
     *   get:
     *     summary: Get lesson completion status
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: cohort_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lesson completion status fetched successfully
     */
    app.get(
        "/v1/api/lessons/:lesson_id/completion",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.query;
                const ProgressService = require("../services/ProgressService");

                console.log(`[DEBUG] Fetching lesson completion - lesson_id: ${lesson_id}, cohort_id: ${cohort_id}, user_id: ${req.user_id}`);

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|string", // UUID for WLIMP lessons
                        cohort_id: "required|integer"
                    },
                    { lesson_id, cohort_id }
                );

                if (validationResult.error) {
                    console.log(`[DEBUG] Validation error:`, validationResult);
                    return res.status(400).json(validationResult);
                }

                // Check if lesson exists in the lessons table
                const BackendSDK = require("../core/BackendSDK");
                const sdk = new BackendSDK();
                sdk.setTable("lessons");
                const lesson = (await sdk.get({ id: lesson_id }))[0];
                
                if (!lesson) {
                    console.log(`[DEBUG] Lesson not found in database: ${lesson_id}`);
                    return res.status(404).json({
                        error: true,
                        message: "Lesson not found",
                    });
                }

                console.log(`[DEBUG] Lesson found:`, lesson);

                // Get completion status using ProgressService
                const isCompleted = await ProgressService.isLessonComplete(
                    req.user_id,
                    lesson_id,
                    parseInt(cohort_id)
                );

                console.log(`[DEBUG] Lesson completion status: ${isCompleted}`);

                return res.status(200).json({
                    error: false,
                    message: "Lesson completion status fetched successfully",
                    completed: isCompleted,
                    lesson_id,
                    cohort_id: parseInt(cohort_id)
                });
            } catch (err) {
                console.error("Error fetching lesson completion status:", err);
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch lesson completion status",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}/complete:
     *   get:
     *     summary: Mark a lesson as completed
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: query
     *         name: cohort_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lesson marked as completed
     */
    app.get(
        "/v1/api/lessons/:lesson_id/complete",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.query;
                const ProgressService = require("../services/ProgressService");

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|string", // UUID for WLIMP lessons
                        cohort_id: "required|integer"
                    },
                    { lesson_id, cohort_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                // Use ProgressService for WLIMP lessons
                await ProgressService.markLessonComplete(
                    req.user_id,
                    lesson_id,
                    parseInt(cohort_id)
                );

                return res.status(200).json({
                    error: false,
                    message: "Lesson marked as completed",
                    success: true,
                });
            } catch (err) {
                console.error("Error marking lesson complete:", err);
                res.status(500).json({
                    error: true,
                    message: "Failed to mark lesson as complete",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}:
     *   delete:
     *     summary: Delete a lesson
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lesson deleted successfully
     */
    app.delete(
        "/v1/api/lessons/:lesson_id",
        [
            UrlMiddleware,
            ...multiLevelAccessControl({
                requiredRoles: ['convener', 'administrator'],
                resourceType: 'lesson',
                resourceIdParam: 'lesson_id',
                action: 'delete'
            }),
            validateLessonIdFormat,
            validateLessonExists
        ],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;

                const sdk = new BackendSDK();
                sdk.setTable("module_lessons");

                // Delete lesson (cascade will handle content and progress)
                await sdk.deleteWhere({ id: lesson_id });

                return res.status(200).json({
                    error: false,
                    message: "Lesson deleted successfully",
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
     * /v1/api/lessons/{lesson_id}/complete:
     *   delete:
     *     summary: Mark a lesson as incomplete (remove completion)
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - cohort_id
     *             properties:
     *               cohort_id:
     *                 type: integer
     *     responses:
     *       '200':
     *         description: Lesson marked as incomplete
     */
    app.delete(
        "/v1/api/lessons/:lesson_id/complete",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.body;
                const ProgressService = require("../services/ProgressService");

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|string",
                        cohort_id: "required|integer",
                    },
                    { lesson_id, cohort_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                // Mark lesson as incomplete using ProgressService
                await ProgressService.markLessonIncomplete(
                    req.user_id,
                    lesson_id,
                    parseInt(cohort_id)
                );

                return res.status(200).json({
                    error: false,
                    message: "Lesson marked as incomplete",
                    success: true,
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
     * /v1/api/lessons/{lesson_id}/navigation:
     *   get:
     *     summary: Get navigation information for a lesson (previous/next lessons)
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: cohort_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Navigation information fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 navigation:
     *                   type: object
     *                   properties:
     *                     hasPrevious:
     *                       type: boolean
     *                     hasNext:
     *                       type: boolean
     *                     previousLessonId:
     *                       type: string
     *                     nextLessonId:
     *                       type: string
     */
    app.get(
        "/v1/api/lessons/:lesson_id/navigation",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.query;

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|string",
                        cohort_id: "required|integer",
                    },
                    { lesson_id, cohort_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();

                // Get the current lesson
                sdk.setTable("lessons");
                const currentLesson = (await sdk.get({ id: lesson_id }))[0];

                if (!currentLesson) {
                    return res.status(404).json({
                        error: true,
                        message: "Lesson not found",
                    });
                }

                // Get the week this lesson belongs to
                sdk.setTable("weeks");
                const week = (await sdk.get({ id: currentLesson.week_id }))[0];

                if (!week) {
                    return res.status(404).json({
                        error: true,
                        message: "Week not found",
                    });
                }

                // Get all weeks in the programme
                const allWeeks = await sdk.get(
                    { programme_id: week.programme_id },
                    "*",
                    "week_number",
                    "ASC"
                );

                // Get all lessons in the programme ordered by week and order_index
                const allLessons = [];
                for (const w of allWeeks) {
                    sdk.setTable("lessons");
                    const weekLessons = await sdk.get(
                        { week_id: w.id },
                        "*",
                        "order_index",
                        "ASC"
                    );
                    allLessons.push(...weekLessons);
                }

                // Find current lesson index
                const currentIndex = allLessons.findIndex((l) => l.id === lesson_id);

                if (currentIndex === -1) {
                    return res.status(404).json({
                        error: true,
                        message: "Lesson not found in programme sequence",
                    });
                }

                // Determine previous and next lessons
                const hasPrevious = currentIndex > 0;
                const hasNext = currentIndex < allLessons.length - 1;

                const navigation = {
                    hasPrevious,
                    hasNext,
                    previousLessonId: hasPrevious ? allLessons[currentIndex - 1].id : null,
                    nextLessonId: hasNext ? allLessons[currentIndex + 1].id : null,
                };

                return res.status(200).json({
                    error: false,
                    message: "Navigation information fetched successfully",
                    navigation,
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

    // ─── Native Quiz System Endpoints ────────────────────────────────────────────

    /**
     * POST /v1/api/lessons/:lesson_id/quiz-attempt
     * Submit a quiz attempt (learner only)
     * Requirements: 4.7, 5.1–5.5, 7.1, 9.2, 9.4
     */
    app.post(
        "/v1/api/lessons/:lesson_id/quiz-attempt",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id, answers } = req.body;

                if (!cohort_id || !answers || typeof answers !== 'object') {
                    return res.status(400).json({ error: true, message: 'cohort_id and answers are required' });
                }

                const QuizService = require('../services/QuizService');
                const { ValidationError } = require('../services/QuizService');

                const result = await QuizService.submitAttempt(
                    req.user_id,
                    parseInt(lesson_id),
                    parseInt(cohort_id),
                    answers
                );

                return res.status(201).json({
                    error: false,
                    message: 'Quiz attempt submitted',
                    attempt: result.attempt,
                    lesson_marked_complete: result.lessonMarkedComplete,
                });
            } catch (err) {
                if (err.name === 'ValidationError' || err.statusCode === 400) {
                    return res.status(400).json({ error: true, message: err.message });
                }
                if (err.statusCode === 404) {
                    return res.status(404).json({ error: true, message: err.message });
                }
                console.error('[quiz-attempt POST]', err);
                res.status(500).json({ error: true, message: 'something went wrong' });
            }
        }
    );

    /**
     * GET /v1/api/lessons/:lesson_id/quiz-attempt/latest
     * Get the learner's most recent attempt (learner only)
     * Requirements: 7.4, 9.4
     */
    app.get(
        "/v1/api/lessons/:lesson_id/quiz-attempt/latest",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.query;

                if (!cohort_id) {
                    return res.status(400).json({ error: true, message: 'cohort_id query param is required' });
                }

                const QuizService = require('../services/QuizService');
                const attempt = await QuizService.getLatestAttempt(
                    req.user_id,
                    parseInt(lesson_id),
                    parseInt(cohort_id)
                );

                return res.status(200).json({
                    error: false,
                    message: 'Latest quiz attempt fetched',
                    attempt,
                });
            } catch (err) {
                console.error('[quiz-attempt/latest GET]', err);
                res.status(500).json({ error: true, message: 'something went wrong' });
            }
        }
    );

    /**
     * GET /v1/api/lessons/:lesson_id/quiz-results
     * Get all learner attempts for a lesson (convener only)
     * Requirements: 8.1–8.5, 9.1, 9.3
     */
    app.get(
        "/v1/api/lessons/:lesson_id/quiz-results",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;

                const QuizService = require('../services/QuizService');
                const results = await QuizService.getResultsForLesson(
                    parseInt(lesson_id),
                    req.user_id
                );

                return res.status(200).json({
                    error: false,
                    message: 'Quiz results fetched',
                    results,
                });
            } catch (err) {
                if (err.statusCode === 403) {
                    return res.status(403).json({ error: true, message: err.message });
                }
                console.error('[quiz-results GET]', err);
                res.status(500).json({ error: true, message: 'something went wrong' });
            }
        }
    );

    return [];
};
