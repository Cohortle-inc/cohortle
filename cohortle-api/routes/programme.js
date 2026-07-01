const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const requireEmailVerification = require("../middleware/requireEmailVerification");
const ValidationService = require("../services/ValidationService");
const { PROGRAMME_TYPES, PROGRAMME_STATUSES } = require("../utils/mappings");
const EnrollmentService = require("../services/EnrollmentService");
const ProgrammeService = require("../services/ProgrammeService");
const { checkEnrollmentStatus } = require("../middleware/AccessControlMiddleware");

// DEPLOYMENT_MARKER: 2025-01-BUILD

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/programmes/enrolled:
     *   get:
     *     summary: Get all programmes the current user is enrolled in
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Enrolled programmes fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 programmes:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       name:
     *                         type: string
     *                       description:
     *                         type: string
     *                       currentWeek:
     *                         type: integer
     *                       totalWeeks:
     *                         type: integer
     *                       cohortId:
     *                         type: integer
     *                       enrolledAt:
     *                         type: string
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/programmes/enrolled",
        [UrlMiddleware, TokenMiddleware({ role: "student" })],
        async function (req, res) {
            try {
                // Get enrolled programmes using EnrollmentService
                const programmes = await EnrollmentService.getUserEnrolledProgrammes(
                    req.user_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Enrolled programmes fetched successfully",
                    programmes,
                });
            } catch (err) {
                console.error("Error fetching enrolled programmes:", err);

                // Generic server error
                return res.status(500).json({
                    error: true,
                    message: "Failed to fetch enrolled programmes. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/programmes/enroll:
     *   post:
     *     summary: Enroll a learner in a programme using an enrollment code
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - code
     *             properties:
     *               code:
     *                 type: string
     *                 description: Enrollment code in format PROGRAMME-YEAR (e.g., WLIMP-2026)
     *                 example: WLIMP-2026
     *     responses:
     *       '200':
     *         description: Enrollment successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 programme_id:
     *                   type: string
     *                 programme_name:
     *                   type: string
     *                 cohort_id:
     *                   type: string
     *       '400':
     *         description: Invalid code format
     *       '404':
     *         description: Code not found
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/programmes/enroll",
        [UrlMiddleware, TokenMiddleware({ role: "student" }), requireEmailVerification],
        async function (req, res) {
            try {
                const { code } = req.body;

                // Validate request body using ENROLLMENT_VALIDATION schema
                const validationResult = await ValidationService.validateObject(
                    ValidationService.ENROLLMENT_VALIDATION,
                    { enrollment_code: code }
                );

                if (validationResult.error) {
                    return res.status(400).json(
                        ValidationService.createValidationErrorResponse(validationResult.validation)
                    );
                }

                // Process enrollment using EnrollmentService
                const enrollmentResult = await EnrollmentService.enrollWithCode(
                    req.user_id,
                    code
                );

                return res.status(200).json({
                    error: false,
                    success: enrollmentResult.success,
                    programme_id: enrollmentResult.programme_id,
                    programme_name: enrollmentResult.programme_name,
                    cohort_id: enrollmentResult.cohort_id,
                });
            } catch (err) {
                console.error("Enrollment error:", err);

                // Handle specific error types
                if (err.statusCode === 400) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }

                if (err.statusCode === 404) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }

                if (err.statusCode === 422) {
                    return res.status(422).json({
                        error: true,
                        message: err.message,
                        code: err.code,
                    });
                }

                // Generic server error
                return res.status(500).json({
                    error: true,
                    message: "Enrollment failed. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/programmes:
     *   post:
     *     summary: Create a programme
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - start_date
     *             properties:
     *               name:
     *                 type: string
     *                 description: Programme name
     *                 example: WLIMP – Workforce Leadership & Impact Mentorship Programme
     *               description:
     *                 type: string
     *                 description: Programme description
     *               start_date:
     *                 type: string
     *                 format: date
     *                 description: Programme start date
     *                 example: 2026-01-01
     *     responses:
     *       '201':
     *         description: Programme created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 programme:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     name:
     *                       type: string
     *                     description:
     *                       type: string
     *                     start_date:
     *                       type: string
     *       '400':
     *         description: Invalid request body
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/programmes",
        [UrlMiddleware, TokenMiddleware({ role: "convener" }), requireEmailVerification],
        async function (req, res) {
            try {
                const { name, description, start_date, onboarding_mode, application_deadline, max_capacity,
                    format, duration, highlights, learning_outcomes, prerequisites, price_info, intro_video_url, thumbnail_url } = req.body;

                // Validate request body using PROGRAMME_VALIDATION schema
                const validationResult = await ValidationService.validateObject(
                    ValidationService.PROGRAMME_VALIDATION,
                    {
                        name,
                        description,
                        start_date,
                    }
                );

                if (validationResult.error) {
                    console.error("Programme creation validation failed:", validationResult);
                    return res.status(400).json(
                        ValidationService.createValidationErrorResponse(validationResult.validation)
                    );
                }

                const sdk = new BackendSDK();

                // Check if convener has a community, if not create one
                sdk.setTable("communities");
                let communities = await sdk.get({ owner_id: req.user_id });
                let community_id;

                if (!communities || communities.length === 0) {
                    // Auto-create a default community for the convener
                    community_id = await sdk.insert({
                        owner_id: req.user_id,
                        name: "My Organisation",
                        description: "Default organisation for managing programmes",
                        status: "active",
                    });
                } else {
                    // Use the first community
                    community_id = communities[0].id;
                }

                // Create programme using BackendSDK
                sdk.setTable("programmes");
                const needsSlug = onboarding_mode === 'application' || onboarding_mode === 'hybrid';
                const programme_id = await sdk.insert({
                    community_id,
                    name,
                    description: description || null,
                    start_date,
                    created_by: req.user_id,
                    type: PROGRAMME_TYPES.STRUCTURED,
                    status: PROGRAMME_STATUSES.DRAFT,
                    ...(onboarding_mode ? { onboarding_mode } : {}),
                    ...(application_deadline ? { application_deadline } : {}),
                    ...(max_capacity ? { max_capacity: parseInt(max_capacity, 10) } : {}),
                    ...(needsSlug ? { application_form_slug: require('crypto').randomUUID() } : {}),
                    ...(format ? { format } : {}),
                    ...(duration ? { duration } : {}),
                    ...(highlights ? { highlights } : {}),
                    ...(learning_outcomes ? { learning_outcomes } : {}),
                    ...(prerequisites ? { prerequisites } : {}),
                    ...(price_info ? { price_info } : {}),
                    ...(intro_video_url ? { intro_video_url } : {}),
                    ...(thumbnail_url ? { thumbnail_url } : {}),
                });

                // Fetch the created programme
                const programme = (await sdk.get({ id: programme_id }))[0];

                return res.status(201).json({
                    error: false,
                    message: "Programme created successfully",
                    programme: {
                        id: programme.id,
                        name: programme.name,
                        description: programme.description,
                        start_date: programme.start_date,
                        onboarding_mode: programme.onboarding_mode,
                        application_deadline: programme.application_deadline,
                        max_capacity: programme.max_capacity,
                        application_form_slug: programme.application_form_slug,
                        created_at: programme.created_at,
                        updated_at: programme.updated_at,
                    },
                });
            } catch (err) {
                console.error("Error creating programme:", err);
                console.error("Error details:", {
                    message: err.message,
                    stack: err.stack,
                    code: err.code,
                    sqlMessage: err.sqlMessage,
                });
                return res.status(500).json({
                    error: true,
                    message: "Failed to create programme. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/programmes/{programme_id}/cohorts:
     *   post:
     *     summary: Create a cohort for a programme
     *     tags: [Programmes]
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
     *               - enrollment_code
     *               - start_date
     *             properties:
     *               name:
     *                 type: string
     *                 description: Cohort name
     *                 example: WLIMP 2026 Cohort 1
     *               enrollment_code:
     *                 type: string
     *                 description: Unique enrollment code
     *                 example: WLIMP-2026
     *               start_date:
     *                 type: string
     *                 format: date
     *                 description: Cohort start date
     *                 example: 2026-01-01
     *     responses:
     *       '201':
     *         description: Cohort created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 cohort:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     programme_id:
     *                       type: integer
     *                     name:
     *                       type: string
     *                     enrollment_code:
     *                       type: string
     *                     start_date:
     *                       type: string
     *       '400':
     *         description: Invalid request body
     *       '404':
     *         description: Programme not found
     *       '409':
     *         description: Enrollment code already exists
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/programmes/:programme_id/cohorts",
        [UrlMiddleware, TokenMiddleware({ role: "convener" }), requireEmailVerification],
        async function (req, res) {
            try {
                const { programme_id } = req.params;
                const { name, enrollment_code, start_date, end_date } = req.body;

                console.log("Cohort creation request:", {
                    programme_id,
                    body: req.body,
                    user_id: req.user_id
                });

                // Validate request body using COHORT_VALIDATION schema
                const validationResult = await ValidationService.validateObject(
                    ValidationService.COHORT_VALIDATION,
                    {
                        programme_id: parseInt(programme_id),
                        name,
                        enrollment_code,
                        start_date,
                        end_date,
                    }
                );

                if (validationResult.error) {
                    console.error("Cohort creation validation failed:", validationResult);
                    return res.status(400).json(
                        ValidationService.createValidationErrorResponse(validationResult.validation)
                    );
                }

                const sdk = new BackendSDK();

                // Verify programme exists (already validated by programmeId rule)
                sdk.setTable("programmes");
                const programme = (await sdk.get({ id: programme_id }))[0];

                console.log("Programme found:", programme.id, programme.name);

                // Create cohort
                sdk.setTable("cohorts");
                console.log("Creating cohort with data:", {
                    programme_id,
                    name,
                    enrollment_code,
                    start_date,
                    end_date
                });

                const cohort_id = await sdk.insert({
                    programme_id,
                    name,
                    enrollment_code,
                    start_date,
                    end_date: end_date || null,
                    status: "active",
                });

                console.log("Cohort created with ID:", cohort_id);

                // Fetch the created cohort
                const cohort = (await sdk.get({ id: cohort_id }))[0];

                console.log("Cohort fetched:", cohort);

                return res.status(201).json({
                    error: false,
                    message: "Cohort created successfully",
                    cohort: {
                        id: cohort.id,
                        programme_id: cohort.programme_id,
                        name: cohort.name,
                        enrollment_code: cohort.enrollment_code,
                        start_date: cohort.start_date,
                        end_date: cohort.end_date,
                        created_at: cohort.createdAt,
                        updated_at: cohort.updatedAt,
                    },
                });
            } catch (err) {
                console.error("Error creating cohort:", err);
                console.error("Error details:", {
                    message: err.message,
                    stack: err.stack,
                    code: err.code,
                    sqlMessage: err.sqlMessage,
                });
                return res.status(500).json({
                    error: true,
                    message: "Failed to create cohort. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/programmes/{programme_id}/weeks:
     *   post:
     *     summary: Create a week for a programme
     *     tags: [Programmes]
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
     *               - week_number
     *               - title
     *               - start_date
     *             properties:
     *               week_number:
     *                 type: integer
     *                 description: Week number (must be unique within programme)
     *                 example: 1
     *               title:
     *                 type: string
     *                 description: Week title
     *                 example: Introduction to Leadership
     *               start_date:
     *                 type: string
     *                 format: date
     *                 description: Week start date
     *                 example: 2026-01-01
     *     responses:
     *       '201':
     *         description: Week created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 week:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     programme_id:
     *                       type: integer
     *                     week_number:
     *                       type: integer
     *                     title:
     *                       type: string
     *                     start_date:
     *                       type: string
     *       '400':
     *         description: Invalid request body
     *       '404':
     *         description: Programme not found
     *       '409':
     *         description: Week number already exists
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/programmes/:programme_id/weeks",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { programme_id } = req.params;
                const { week_number, title, start_date } = req.body;

                console.log("Week creation request:", {
                    programme_id,
                    body: req.body,
                    user_id: req.user_id
                });

                // Validate request body using WEEK_VALIDATION schema
                const validationResult = await ValidationService.validateObject(
                    ValidationService.WEEK_VALIDATION,
                    {
                        programme_id: parseInt(programme_id),
                        week_number,
                        title,
                        start_date,
                    }
                );

                if (validationResult.error) {
                    console.error("Week creation validation failed:", validationResult);
                    return res.status(400).json(
                        ValidationService.createValidationErrorResponse(validationResult.validation)
                    );
                }

                const sdk = new BackendSDK();

                // Verify programme exists (already validated by programmeId rule)
                sdk.setTable("programmes");
                const programme = (await sdk.get({ id: programme_id }))[0];

                console.log("Programme found:", programme.id, programme.name);

                // Create week using ContentService
                const ContentService = require("../services/ContentService");
                const week = await ContentService.createWeek(parseInt(programme_id), {
                    week_number,
                    title,
                    start_date,
                });

                console.log("Week created successfully:", week.id);

                return res.status(201).json({
                    error: false,
                    message: "Week created successfully",
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
                console.error("Error creating week:", err);
                console.error("Error details:", {
                    message: err.message,
                    stack: err.stack,
                    statusCode: err.statusCode,
                });

                // Handle specific error types
                if (err.statusCode === 400) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }

                if (err.statusCode === 409) {
                    return res.status(409).json({
                        error: true,
                        message: err.message,
                    });
                }

                // Generic server error
                return res.status(500).json({
                    error: true,
                    message: "Failed to create week. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/weeks/{week_id}/lessons:
     *   post:
     *     summary: Create a lesson for a week
     *     tags: [Lessons]
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
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - title
     *               - content_type
     *               - content_url
     *               - order_index
     *             properties:
     *               title:
     *                 type: string
     *                 description: Lesson title
     *                 example: Introduction to Leadership Principles
     *               description:
     *                 type: string
     *                 description: Lesson description
     *               content_type:
     *                 type: string
     *                 enum: [video, link, pdf]
     *                 description: Type of content
     *                 example: video
     *               content_url:
     *                 type: string
     *                 format: uri
     *                 description: URL to external content
     *                 example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
     *               order_index:
     *                 type: integer
     *                 description: Order of lesson within the week (0-indexed)
     *                 example: 0
     *     responses:
     *       '201':
     *         description: Lesson created successfully
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
     *                     week_id:
     *                       type: string
     *                     title:
     *                       type: string
     *                     description:
     *                       type: string
     *                     content_type:
     *                       type: string
     *                     content_url:
     *                       type: string
     *                     order_index:
     *                       type: integer
     *       '400':
     *         description: Invalid request body or URL format
     *       '404':
     *         description: Week not found
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/weeks/:week_id/lessons",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { week_id } = req.params;
                const { title, description, content_type, content_url, content_text, order_index, quiz_data, assignment_data } = req.body;

                console.log("Lesson creation request:", {
                    week_id,
                    body: req.body,
                    user_id: req.user_id
                });

                // Validate request body using LESSON_VALIDATION schema
                const validationResult = await ValidationService.validateObject(
                    ValidationService.LESSON_VALIDATION,
                    {
                        week_id,
                        title,
                        description,
                        content_type,
                        content_url,
                        content_text,
                        order_index,
                    }
                );

                if (validationResult.error) {
                    console.error("Lesson creation validation failed:", validationResult);
                    return res.status(400).json(
                        ValidationService.createValidationErrorResponse(validationResult.validation)
                    );
                }

                // Additional validation: content_url must be a valid URL for video/link/pdf types
                if (['video', 'link', 'pdf'].includes(content_type)) {
                    if (!content_url || typeof content_url !== 'string' || content_url.trim().length === 0) {
                        return res.status(400).json({
                            error: true,
                            message: "Validation failed",
                            validation_errors: [{
                                field: 'content_url',
                                message: 'Content URL is required for video, link, and pdf content types.',
                                rule: 'required'
                            }]
                        });
                    }

                    // Validate URL scheme (http/https only)
                    try {
                        const url = new URL(content_url);
                        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                            return res.status(400).json({
                                error: true,
                                message: "Validation failed",
                                validation_errors: [{
                                    field: 'content_url',
                                    message: 'URL must use http or https protocol.',
                                    rule: 'urlScheme'
                                }]
                            });
                        }
                    } catch (e) {
                        return res.status(400).json({
                            error: true,
                            message: "Validation failed",
                            validation_errors: [{
                                field: 'content_url',
                                message: 'The content url value is malformed.',
                                rule: 'urlScheme'
                            }]
                        });
                    }
                }

                // Additional validation: content_text is required for text type
                if (content_type === 'text') {
                    if (!content_text || typeof content_text !== 'string' || content_text.trim().length === 0) {
                        return res.status(400).json({
                            error: true,
                            message: "Validation failed",
                            validation_errors: [{
                                field: 'content_text',
                                message: 'Content text is required for text content type.',
                                rule: 'required'
                            }]
                        });
                    }
                }

                // Additional validation: content_text (JSON) is required for live_session type
                if (content_type === 'live_session') {
                    if (!content_text || typeof content_text !== 'string' || content_text.trim().length === 0) {
                        return res.status(400).json({
                            error: true,
                            message: "Validation failed",
                            validation_errors: [{
                                field: 'content_text',
                                message: 'Session data (content_text) is required for live_session content type.',
                                rule: 'required'
                            }]
                        });
                    }
                    try {
                        JSON.parse(content_text);
                    } catch (e) {
                        return res.status(400).json({
                            error: true,
                            message: "Validation failed",
                            validation_errors: [{
                                field: 'content_text',
                                message: 'Session data must be valid JSON.',
                                rule: 'json'
                            }]
                        });
                    }
                }

                // Verify week exists (already validated by weekId rule)
                const db = require("../models");
                const { weeks } = db;
                const week = await weeks.findByPk(week_id);

                console.log("Week found:", week.id, week.title);

                // Create lesson using ContentService
                const ContentService = require("../services/ContentService");
                const lesson = await ContentService.createLesson(week_id, {
                    title,
                    description,
                    content_type,
                    content_url,
                    content_text,
                    order_index,
                    quiz_data,
                    assignment_data,
                });

                console.log("Lesson created successfully:", lesson.id);

                return res.status(201).json({
                    error: false,
                    message: "Lesson created successfully",
                    lesson: {
                        id: lesson.id,
                        week_id: lesson.week_id,
                        title: lesson.title,
                        description: lesson.description,
                        content_type: lesson.content_type,
                        content_url: lesson.content_url,
                        content_text: lesson.content_text,
                        order_index: lesson.order_index,
                        created_at: lesson.created_at,
                        updated_at: lesson.updated_at,
                    },
                });
            } catch (err) {
                console.error("Error creating lesson:", err);
                console.error("Error details:", {
                    message: err.message,
                    stack: err.stack,
                    statusCode: err.statusCode,
                });

                // Handle specific error types
                if (err.statusCode === 400) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }

                // Generic server error
                return res.status(500).json({
                    error: true,
                    message: "Failed to create lesson. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/weeks/{week_id}/lessons/reorder:
     *   put:
     *     summary: Reorder lessons within a week
     *     tags: [Lessons]
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
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - lessonIds
     *             properties:
     *               lessonIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: uuid
     *                 description: Array of lesson IDs in the desired order
     *                 example: ["uuid1", "uuid2", "uuid3"]
     *     responses:
     *       '200':
     *         description: Lessons reordered successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 lessons:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       title:
     *                         type: string
     *                       description:
     *                         type: string
     *                       content_type:
     *                         type: string
     *                       content_url:
     *                         type: string
     *                       order_index:
     *                         type: integer
     *       '400':
     *         description: Invalid request body or lesson IDs
     *       '404':
     *         description: Week not found
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/weeks/:week_id/lessons/reorder",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { week_id } = req.params;
                const { lessonIds } = req.body;

                // Validate week_id is a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(week_id)) {
                    return res.status(400).json({
                        error: true,
                        message: "Invalid week ID format",
                    });
                }

                // Validate request body
                if (!lessonIds || !Array.isArray(lessonIds)) {
                    return res.status(400).json({
                        error: true,
                        message: "lessonIds must be an array",
                    });
                }

                if (lessonIds.length === 0) {
                    return res.status(400).json({
                        error: true,
                        message: "lessonIds array cannot be empty",
                    });
                }

                // Validate all lesson IDs are valid UUIDs
                for (const lessonId of lessonIds) {
                    if (!uuidRegex.test(lessonId)) {
                        return res.status(400).json({
                            error: true,
                            message: "All lesson IDs must be valid UUIDs",
                        });
                    }
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

                // Update lesson order using ContentService
                const ContentService = require("../services/ContentService");
                const updatedLessons = await ContentService.updateLessonOrder(week_id, lessonIds);

                return res.status(200).json({
                    error: false,
                    message: "Lessons reordered successfully",
                    lessons: updatedLessons.map(lesson => ({
                        id: lesson.id,
                        title: lesson.title,
                        description: lesson.description,
                        content_type: lesson.content_type,
                        content_url: lesson.content_url,
                        order_index: lesson.order_index,
                    })),
                });
            } catch (err) {
                console.error("Error reordering lessons:", err);

                // Handle specific error types
                if (err.statusCode === 400) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }

                if (err.statusCode === 404) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }

                // Generic server error
                return res.status(500).json({
                    error: true,
                    message: "Failed to reorder lessons. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/communities/{community_id}/programmes:
     *   post:
     *     summary: Create a programme in a community
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: community_id
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
     *               - type
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [scheduled, structured, self_paced]
     *               start_date:
     *                 type: string
     *                 format: date
     *               end_date:
     *                 type: string
     *                 format: date
     *               thumbnail:
     *                 type: string
     *     responses:
     *       '201':
     *         description: Programme created successfully
     */
    app.post(
        "/v1/api/communities/:community_id/programmes",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { community_id } = req.params;
                const { name, description, type, start_date, end_date, thumbnail } =
                    req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        community_id: "required|integer",
                        name: "required|string",
                        description: "string",
                        type: `required|in:${Object.values(PROGRAMME_TYPES).join(",")}`,
                        start_date: "date",
                        end_date: "date",
                    },
                    {
                        community_id,
                        name,
                        description,
                        type,
                        start_date,
                        end_date,
                    }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("communities");
                const community = (await sdk.get({ id: community_id }))[0];

                if (!community) {
                    return res.status(404).json({
                        error: true,
                        message: "Community not found",
                    });
                }

                // Verify ownership
                if (community.owner_id !== req.user_id) {
                    return res.status(403).json({
                        error: true,
                        message: "You do not have permission to create programmes in this community",
                    });
                }

                sdk.setTable("programmes");
                const programme_id = await sdk.insert({
                    community_id,
                    name,
                    description,
                    type,
                    start_date,
                    end_date,
                    thumbnail,
                    created_by: req.user_id,
                    status: PROGRAMME_STATUSES.DRAFT,
                });

                return res.status(201).json({
                    error: false,
                    message: "Programme created successfully",
                    programme_id,
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
     * /v1/api/communities/{community_id}/programmes:
     *   get:
     *     summary: Get all programmes for a community
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: community_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: List of programmes
     */
    app.get(
        "/v1/api/communities/:community_id/programmes",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { community_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { community_id: "required|integer" },
                    { community_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("communities");
                const community = (await sdk.get({ id: community_id }))[0];

                if (!community) {
                    return res.status(404).json({
                        error: true,
                        message: "Community not found",
                    });
                }

                sdk.setTable("programmes");
                const programmes = await sdk.get({ community_id });

                return res.status(200).json({
                    error: false,
                    message: "Programmes fetched successfully",
                    programmes,
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
     * /v1/api/programmes/my:
     *   get:
     *     summary: Get all programmes created by the current convener
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Programmes fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 programmes:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       name:
     *                         type: string
     *                       description:
     *                         type: string
     *                       start_date:
     *                         type: string
     *                       status:
     *                         type: string
     *                       created_at:
     *                         type: string
     *                       updated_at:
     *                         type: string
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/programmes/my",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const sdk = new BackendSDK();
                sdk.setTable("programmes");
                
                // Get all programmes created by the current user
                const programmes = await sdk.get({ created_by: req.user_id });

                // Fetch enrolled learner counts and cohort counts for all programmes
                const programmeIds = programmes.map(p => p.id);
                let enrolledCounts = {};
                let cohortCounts = {};
                if (programmeIds.length > 0) {
                    try {
                        // Use sdk.rawQuery so the correct database is selected automatically
                        const idList = programmeIds.map(id => parseInt(id, 10)).join(',');
                        const rows = await sdk.rawQuery(
                            `SELECT c.programme_id,
                                    COUNT(DISTINCT c.id) AS cohort_cnt,
                                    COUNT(DISTINCT e.id) AS enrolled_cnt
                             FROM cohorts c
                             LEFT JOIN enrollments e ON e.cohort_id = c.id
                             WHERE c.programme_id IN (${idList})
                             GROUP BY c.programme_id`
                        );
                        rows.forEach(r => {
                            enrolledCounts[r.programme_id] = Number(r.enrolled_cnt);
                            cohortCounts[r.programme_id] = Number(r.cohort_cnt);
                        });
                    } catch (countErr) {
                        console.error('Error fetching enrolled/cohort counts:', countErr);
                        // Non-critical — fall back to 0
                    }
                }

                return res.status(200).json({
                    error: false,
                    message: "Programmes fetched successfully",
                    programmes: programmes.map(p => ({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        start_date: p.start_date,
                        startDate: p.start_date,
                        status: p.status,
                        lifecycle_status: p.lifecycle_status,
                        onboarding_mode: p.onboarding_mode,
                        createdBy: p.created_by,
                        created_at: p.created_at,
                        createdAt: p.created_at,
                        updated_at: p.updated_at,
                        updatedAt: p.updated_at,
                        enrolled_count: enrolledCounts[p.id] || 0,
                        enrolledCount: enrolledCounts[p.id] || 0,
                        cohort_count: cohortCounts[p.id] || 0,
                        cohortCount: cohortCounts[p.id] || 0,
                    })),
                });
            } catch (err) {
                console.error("Error fetching programmes:", err);
                return res.status(500).json({
                    error: true,
                    message: "Failed to fetch programmes. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/programmes/{programme_id}:
     *   get:
     *     summary: Get a single programme
     *     tags: [Programmes]
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
     *         description: Programme fetched successfully
     */
    app.get(
        "/v1/api/programmes/discover",
        [UrlMiddleware],
        async function (req, res) {
            try {
                const db = require("../models");
                const { q, format, free, closingSoon, sort = "closing", limit = 50 } = req.query;

                const where = [
                    "p.lifecycle_status = 'recruiting'",
                    "p.onboarding_mode IN ('application', 'hybrid')",
                    "(p.application_deadline IS NULL OR p.application_deadline >= NOW())",
                ];
                const replacements = {
                    limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
                };

                if (q && String(q).trim()) {
                    replacements.query = `%${String(q).trim()}%`;
                    where.push(`(
                        p.name LIKE :query
                        OR p.description LIKE :query
                        OR CAST(p.highlights AS CHAR) LIKE :query
                        OR CAST(p.learning_outcomes AS CHAR) LIKE :query
                        OR u.organisation_name LIKE :query
                    )`);
                }

                if (format && ["online", "in-person", "hybrid"].includes(String(format))) {
                    replacements.format = String(format);
                    where.push("p.format = :format");
                }

                if (free === "true") {
                    where.push("(p.price_info IS NULL OR LOWER(p.price_info) LIKE '%free%' OR LOWER(p.price_info) LIKE '%funded%')");
                }

                if (closingSoon === "true") {
                    where.push("p.application_deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)");
                }

                const orderBy = {
                    newest: "p.created_at DESC",
                    name: "p.name ASC",
                    closing: "CASE WHEN p.application_deadline IS NULL THEN 1 ELSE 0 END ASC, p.application_deadline ASC, p.created_at DESC",
                }[sort] || "CASE WHEN p.application_deadline IS NULL THEN 1 ELSE 0 END ASC, p.application_deadline ASC, p.created_at DESC";

                const programmes = await db.sequelize.query(
                    `
                    SELECT
                        p.id,
                        p.name,
                        p.description,
                        p.application_deadline,
                        p.application_form_slug,
                        p.onboarding_mode,
                        p.lifecycle_status,
                        p.format,
                        p.duration,
                        p.highlights,
                        p.learning_outcomes,
                        p.prerequisites,
                        p.price_info,
                        p.thumbnail_url,
                        p.created_at,
                        u.organisation_slug,
                        u.organisation_name,
                        CONCAT_WS(' ', u.first_name, u.last_name) AS convener_name
                    FROM programmes p
                    INNER JOIN users u ON u.id = p.created_by
                    WHERE ${where.join(" AND ")}
                    ORDER BY ${orderBy}
                    LIMIT :limit
                    `,
                    {
                        replacements,
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                );

                const normaliseJsonArray = (value) => {
                    if (!value) return null;
                    if (Array.isArray(value)) return value;
                    try {
                        const parsed = JSON.parse(value);
                        return Array.isArray(parsed) ? parsed : null;
                    } catch {
                        return null;
                    }
                };

                return res.status(200).json({
                    error: false,
                    message: "Discoverable programmes fetched successfully",
                    programmes: programmes.map((programme) => ({
                        ...programme,
                        highlights: normaliseJsonArray(programme.highlights),
                        learning_outcomes: normaliseJsonArray(programme.learning_outcomes),
                        organisation_name: programme.organisation_name || programme.convener_name || "Organisation",
                        organisation_url: programme.organisation_slug ? `/org/${programme.organisation_slug}` : null,
                        apply_url: programme.application_form_slug ? `/apply/${programme.application_form_slug}` : null,
                    })),
                });
            } catch (err) {
                console.error("Error fetching discoverable programmes:", err);
                return res.status(500).json({
                    error: true,
                    message: "Failed to fetch discoverable programmes. Please try again.",
                });
            }
        }
    );

    app.get(
        "/v1/api/programmes/:programme_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" }), checkEnrollmentStatus],
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
                sdk.setTable("programmes");
                const programme = (await sdk.get({ id: programme_id }))[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                // Get cohorts with full data (not just count)
                sdk.setTable("cohorts");
                const cohorts = await sdk.get({ programme_id });
                programme.cohorts = cohorts;
                programme.cohort_count = cohorts.length;

                // Get modules
                sdk.setTable("programme_modules");
                const modules = await sdk.get({ programme_id });
                programme.module_count = modules.length;

                // Get weeks with lessons using ProgrammeService
                // Conveners see all weeks; students only see up to current week
                try {
                    let weeks;
                    if (req.role === 'convener' || req.role === 'administrator') {
                        weeks = await ProgrammeService.getAllProgrammeWeeks(parseInt(programme_id));
                    } else {
                        weeks = await ProgrammeService.getProgrammeWeeks(
                            parseInt(programme_id),
                            null // No specific cohort filter
                        );
                    }
                    programme.weeks = weeks;
                } catch (weekErr) {
                    console.warn("Could not fetch weeks:", weekErr.message);
                    programme.weeks = [];
                }

                // Calculate current week for WLIMP programmes
                try {
                    const currentWeek = await ProgrammeService.getCurrentWeek(programme_id);
                    programme.current_week = currentWeek;

                    // Get total weeks count
                    sdk.setTable("weeks");
                    const weeks = await sdk.get({ programme_id });
                    programme.total_weeks = weeks.length;
                } catch (weekErr) {
                    // If week calculation fails, don't fail the entire request
                    // This allows backwards compatibility with non-WLIMP programmes
                    console.warn("Could not calculate current week:", weekErr.message);
                }

                return res.status(200).json({
                    error: false,
                    message: "Programme fetched successfully",
                    data: programme,
                    programme, // Keep for backwards compatibility
                });
            } catch (err) {
                console.error("Error fetching programme:", err);
                console.error("Error details:", {
                    message: err.message,
                    stack: err.stack,
                });
                return res.status(500).json({
                    error: true,
                    message: "Failed to fetch programme. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/programmes/{programme_id}/weeks:
     *   get:
     *     summary: Get weeks for a programme with lessons
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: programme_id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: query
     *         name: cohort_id
     *         schema:
     *           type: integer
     *         description: Optional cohort ID for current week calculation
     *     responses:
     *       '200':
     *         description: Weeks fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 weeks:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       programme_id:
     *                         type: string
     *                       week_number:
     *                         type: integer
     *                       title:
     *                         type: string
     *                       start_date:
     *                         type: string
     *                       isCurrent:
     *                         type: boolean
     *                       lessons:
     *                         type: array
     *                         items:
     *                           type: object
     *                           properties:
     *                             id:
     *                               type: string
     *                             title:
     *                               type: string
     *                             description:
     *                               type: string
     *                             content_type:
     *                               type: string
     *                             content_url:
     *                               type: string
     *                             order_index:
     *                               type: integer
     *       '404':
     *         description: Programme not found
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/programmes/:programme_id/weeks",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" }), checkEnrollmentStatus],
        async function (req, res) {
            try {
                const { programme_id } = req.params;
                const { cohort_id } = req.query;

                const validationResult = await ValidationService.validateObject(
                    {
                        programme_id: "required|integer",
                        cohort_id: "integer",
                    },
                    { programme_id, cohort_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                // Verify programme exists
                const sdk = new BackendSDK();
                sdk.setTable("programmes");
                const programme = (await sdk.get({ id: programme_id }))[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                // Get weeks with lessons using ProgrammeService
                // Conveners see all weeks; students only see up to current week
                let weeks;
                if (req.role === 'convener' || req.role === 'administrator') {
                    weeks = await ProgrammeService.getAllProgrammeWeeks(parseInt(programme_id));
                } else {
                    weeks = await ProgrammeService.getProgrammeWeeks(
                        parseInt(programme_id),
                        cohort_id ? parseInt(cohort_id) : null,
                        req.user_id // Pass user_id for completion status
                    );
                }

                return res.status(200).json({
                    error: false,
                    message: "Weeks fetched successfully",
                    weeks,
                });
            } catch (err) {
                console.error("Error fetching programme weeks:", err);
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
     *     summary: Get a lesson by ID with week and programme metadata
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       '200':
     *         description: Lesson fetched successfully
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
     *                     description:
     *                       type: string
     *                     content_type:
     *                       type: string
     *                     content_url:
     *                       type: string
     *                     week_number:
     *                       type: integer
     *                     programme_id:
     *                       type: integer
     *                     programme_name:
     *                       type: string
     *       '404':
     *         description: Lesson not found
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/lessons/:lesson_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;

                // Validate lesson_id is a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(lesson_id)) {
                    return res.status(400).json({
                        error: true,
                        message: "Invalid lesson ID format",
                    });
                }

                // Get lesson with week and programme metadata using ContentService
                const ContentService = require("../services/ContentService");
                const lesson = await ContentService.getLessonById(lesson_id);

                // Get programme details
                const sdk = new BackendSDK();
                sdk.setTable("programmes");
                const programme = (await sdk.get({ id: lesson.week.programme_id }))[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                if (req.role === 'student' && lesson.week.start_date) {
                    const weekStartDate = new Date(lesson.week.start_date);
                    weekStartDate.setHours(0, 0, 0, 0);

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (weekStartDate > today) {
                        return res.status(403).json({
                            error: true,
                            message: "This lesson is locked until the week starts.",
                            week_start_date: lesson.week.start_date,
                        });
                    }
                }

                // Parse live_session_data from content_text for live_session lessons
                let live_session_data = null;
                if (lesson.content_type === 'live_session' && lesson.content_text) {
                    try {
                        live_session_data = JSON.parse(lesson.content_text);
                    } catch (e) {
                        // If not valid JSON, leave as null
                    }
                }

                // Parse assignment_data from content_text for assignment lessons
                let assignment_data = null;
                if (lesson.content_type === 'assignment' && lesson.content_text) {
                    try {
                        assignment_data = JSON.parse(lesson.content_text);
                    } catch (e) {
                        // If not valid JSON, leave as null
                    }
                }

                // Format response
                const response = {
                    id: lesson.id,
                    title: lesson.title,
                    description: lesson.description,
                    content_type: lesson.content_type,
                    content_url: lesson.content_url,
                    content_text: lesson.content_text,
                    live_session_data,
                    assignment_data,
                    week_number: lesson.week.week_number,
                    week_title: lesson.week.title,
                    week_start_date: lesson.week.start_date,
                    programme_id: lesson.week.programme_id,
                    programme_name: programme.name,
                };

                return res.status(200).json({
                    error: false,
                    message: "Lesson fetched successfully",
                    lesson: response,
                });
            } catch (err) {
                console.error("Error fetching lesson:", err);

                // Handle specific error types
                if (err.statusCode === 404) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }

                if (err.statusCode === 403) {
                    return res.status(403).json({
                        error: true,
                        message: err.message,
                    });
                }

                // Generic server error
                return res.status(500).json({
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
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *                 description: Lesson title
     *                 example: Updated Leadership Principles
     *               description:
     *                 type: string
     *                 description: Lesson description
     *               content_url:
     *                 type: string
     *                 format: uri
     *                 description: URL to external content
     *                 example: https://www.youtube.com/watch?v=newvideo
     *     responses:
     *       '200':
     *         description: Lesson updated successfully
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
     *                     description:
     *                       type: string
     *                     content_type:
     *                       type: string
     *                     content_url:
     *                       type: string
     *                     order_index:
     *                       type: integer
     *       '400':
     *         description: Invalid request body or no fields to update
     *       '404':
     *         description: Lesson not found
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/lessons/:lesson_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { title, description, content_url, content_type, content_text, assignment_data } = req.body;

                // Validate lesson_id is a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(lesson_id)) {
                    return res.status(400).json({
                        error: true,
                        message: "Invalid lesson ID format",
                    });
                }

                // Validate at least one field is provided
                if (title === undefined && description === undefined && content_url === undefined && content_type === undefined && content_text === undefined && assignment_data === undefined) {
                    return res.status(400).json({
                        error: true,
                        message: "At least one field must be provided: title, description, content_url, content_type, content_text, or assignment_data",
                    });
                }

                // Validate assignment_data if provided
                if (assignment_data !== undefined) {
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

                // Validate request body fields if provided
                const validationRules = {};
                const validationData = {};

                if (title !== undefined) {
                    validationRules.title = "string";
                    validationData.title = title;
                }
                if (description !== undefined) {
                    validationRules.description = "string";
                    validationData.description = description;
                }
                if (content_url !== undefined) {
                    validationRules.content_url = "string|url";
                    validationData.content_url = content_url;
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

                // Update lesson using ContentService
                const ContentService = require("../services/ContentService");
                const updatedLesson = await ContentService.updateLesson(lesson_id, {
                    title,
                    description,
                    content_url,
                    content_type,
                    content_text,
                    assignment_data,
                });

                return res.status(200).json({
                    error: false,
                    message: "Lesson updated successfully",
                    lesson: {
                        id: updatedLesson.id,
                        title: updatedLesson.title,
                        description: updatedLesson.description,
                        content_type: updatedLesson.content_type,
                        content_url: updatedLesson.content_url,
                        content_text: updatedLesson.content_text,
                        order_index: updatedLesson.order_index,
                        updated_at: updatedLesson.updated_at,
                    },
                });
            } catch (err) {
                console.error("Error updating lesson:", err);

                // Handle specific error types
                if (err.statusCode === 400) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }

                if (err.statusCode === 404) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }

                // Generic server error
                return res.status(500).json({
                    error: true,
                    message: "Failed to update lesson. Please try again.",
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
     *           type: string
     *           format: uuid
     *     responses:
     *       '200':
     *         description: Lesson deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                 message:
     *                   type: string
     *       '400':
     *         description: Invalid lesson ID format
     *       '404':
     *         description: Lesson not found
     *       '500':
     *         description: Server error
     */
    app.delete(
        "/v1/api/lessons/:lesson_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;

                // Validate lesson_id is a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(lesson_id)) {
                    return res.status(400).json({
                        error: true,
                        message: "Invalid lesson ID format",
                    });
                }

                // Delete lesson using ContentService
                const ContentService = require("../services/ContentService");
                const lesson = await ContentService.getLessonById(lesson_id);
                const sdk = new BackendSDK();
                sdk.setTable("programmes");
                const programme = (await sdk.get({
                    id: lesson.week.programme_id,
                    created_by: req.user_id,
                }))[0];

                if (!programme) {
                    return res.status(403).json({
                        error: true,
                        message: "You do not have permission to delete this lesson",
                    });
                }

                await ContentService.deleteLesson(lesson_id);

                return res.status(200).json({
                    error: false,
                    message: "Lesson deleted successfully",
                });
            } catch (err) {
                console.error("Error deleting lesson:", err);

                // Handle specific error types
                if (err.statusCode === 404) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }

                if (err.statusCode === 403) {
                    return res.status(403).json({
                        error: true,
                        message: err.message,
                    });
                }

                // Generic server error
                return res.status(500).json({
                    error: true,
                    message: "Failed to delete lesson. Please try again.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/programmes/{programme_id}:
     *   put:
     *     summary: Update a programme
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: programme_id
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
     *               description:
     *                 type: string
     *               type:
     *                 type: string
     *               start_date:
     *                 type: string
     *               end_date:
     *                 type: string
     *               status:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Programme updated successfully
     */
    app.put(
        "/v1/api/programmes/:programme_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { programme_id } = req.params;
                const { name, description, type, start_date, end_date, status, thumbnail, onboarding_mode, application_deadline, max_capacity,
                    format, duration, highlights, learning_outcomes, prerequisites, price_info, intro_video_url, thumbnail_url } =
                    req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        programme_id: "required|integer",
                        name: "string",
                        description: "string",
                        type: `in:${Object.values(PROGRAMME_TYPES).join(",")}`,
                        status: `in:${Object.values(PROGRAMME_STATUSES).join(",")}`,
                        start_date: "date",
                        end_date: "date",
                    },
                    { programme_id, name, description, type, start_date, end_date, status }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("programmes");
                const programme = (
                    await sdk.get({ id: programme_id, created_by: req.user_id })
                )[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                await sdk.update(
                    {
                        ...(name !== undefined ? { name } : {}),
                        ...(description !== undefined ? { description } : {}),
                        ...(type !== undefined ? { type } : {}),
                        ...(start_date !== undefined ? { start_date } : {}),
                        ...(end_date !== undefined ? { end_date } : {}),
                        ...(status !== undefined ? { status } : {}),
                        ...(thumbnail !== undefined ? { thumbnail } : {}),
                        ...(onboarding_mode !== undefined ? { onboarding_mode } : {}),
                        ...(application_deadline !== undefined ? { application_deadline: application_deadline || null } : {}),
                        ...(max_capacity !== undefined ? { max_capacity: max_capacity ? parseInt(max_capacity, 10) : null } : {}),
                        ...(format !== undefined ? { format: format || null } : {}),
                        ...(duration !== undefined ? { duration: duration || null } : {}),
                        ...(highlights !== undefined ? { highlights: highlights || null } : {}),
                        ...(learning_outcomes !== undefined ? { learning_outcomes: learning_outcomes || null } : {}),
                        ...(prerequisites !== undefined ? { prerequisites: prerequisites || null } : {}),
                        ...(price_info !== undefined ? { price_info: price_info || null } : {}),
                        ...(intro_video_url !== undefined ? { intro_video_url: intro_video_url || null } : {}),
                        ...(thumbnail_url !== undefined ? { thumbnail_url: thumbnail_url || null } : {}),
                    },
                    programme_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Programme updated successfully",
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
     * /v1/api/programmes/{programme_id}:
     *   delete:
     *     summary: Delete a programme
     *     tags: [Programmes]
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
     *         description: Programme deleted successfully
     */
    app.delete(
        "/v1/api/programmes/:programme_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
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
                sdk.setTable("programmes");
                const programme = (
                    await sdk.get({ id: programme_id, created_by: req.user_id })
                )[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                // Delete programme (cascade will handle cohorts, modules, etc.)
                await sdk.deleteWhere({ id: programme_id, created_by: req.user_id });

                return res.status(200).json({
                    error: false,
                    message: "Programme deleted successfully",
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
     * /v1/api/programmes/{programme_id}/publish:
     *   post:
     *     summary: Publish a programme (make it available to learners)
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: programme_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Programme ID
     *     responses:
     *       '200':
     *         description: Programme published successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: "Programme published successfully"
     *       '400':
     *         description: Validation error
     *       '403':
     *         description: Forbidden - not the programme creator
     *       '404':
     *         description: Programme not found
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/programmes/:programme_id/publish",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
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
                sdk.setTable("programmes");
                
                // Check if programme exists and user owns it
                const programme = (await sdk.get({ 
                    id: programme_id, 
                    created_by: req.user_id 
                }))[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found or you don't have permission to publish it",
                    });
                }

                // Update programme status to published
                await sdk.update(
                    { status: "published" },
                    programme_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Programme published successfully",
                });
            } catch (err) {
                console.error("Error publishing programme:", err);
                return res.status(500).json({
                    error: true,
                    message: "Failed to publish programme. Please try again.",
                });
            }
        }
    );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/publish:
   *   post:
   *     summary: Publish a programme (change status from draft to published)
   *     tags: [Programmes]
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
   *         description: Programme published successfully
   *       '403':
   *         description: Not authorized to publish this programme
   *       '404':
   *         description: Programme not found
   */
  app.post(
    "/v1/api/programmes/:programme_id/publish",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      const { logApiError, logSuccess } = require("../utils/errorLogger");
      
      try {
        const { programme_id } = req.params;

        const sdk = new BackendSDK();
        sdk.setTable("programmes");
        
        // Get the programme
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
            message: "You do not have permission to publish this programme",
          });
        }

        // Update status to published
        await sdk.update(
          { status: PROGRAMME_STATUSES.PUBLISHED },
          programme_id
        );

        // Fetch updated programme
        const updatedProgramme = (await sdk.get({ id: programme_id }))[0];

        logSuccess('Publish programme', req, { programme_id, name: programme.name });

        return res.status(200).json({
          error: false,
          message: "Programme published successfully",
          programme: updatedProgramme,
        });
      } catch (err) {
        logApiError('Publish programme', err, req, { programme_id: req.params.programme_id });
        res.status(500).json({
          error: true,
          message: "Failed to publish programme. Please try again.",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/public:
   *   get:
   *     summary: Get all public programmes (no authentication required)
   *     tags: [Programmes]
   *     responses:
   *       '200':
   *         description: Public programmes fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 programmes:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       thumbnail:
   *                         type: string
   *                       weekCount:
   *                         type: integer
   *                       lessonCount:
   *                         type: integer
   *                       duration:
   *                         type: string
   *       '500':
   *         description: Server error
   */
  app.get(
    "/v1/api/programmes/public",
    [UrlMiddleware],
    async function (req, res) {
      const { logApiError, logSuccess } = require("../utils/errorLogger");
      
      try {
        const sdk = new BackendSDK();
        sdk.setTable("programmes");
        
        // Get all published programmes
        const programmes = await sdk.get({ status: PROGRAMME_STATUSES.PUBLISHED });

        // For each programme, get week and lesson counts
        const programmesWithDetails = await Promise.all(
          programmes.map(async (programme) => {
            // Get weeks for this programme
            sdk.setTable("weeks");
            const weeks = await sdk.get({ programme_id: programme.id });
            const weekCount = weeks.length;

            // Get lessons for all weeks
            let lessonCount = 0;
            if (weeks.length > 0) {
              sdk.setTable("lessons");
              for (const week of weeks) {
                const lessons = await sdk.get({ week_id: week.id });
                lessonCount += lessons.length;
              }
            }

            // Calculate duration (e.g., "8 weeks")
            const duration = weekCount > 0 ? `${weekCount} week${weekCount !== 1 ? 's' : ''}` : 'TBD';

            return {
              id: programme.id,
              name: programme.name,
              description: programme.description || '',
              thumbnail: null, // Not implemented yet
              weekCount,
              lessonCount,
              duration,
            };
          })
        );

        logSuccess('Get public programmes', req, { count: programmesWithDetails.length });

        return res.status(200).json({
          error: false,
          message: "Public programmes fetched successfully",
          programmes: programmesWithDetails,
        });
      } catch (err) {
        logApiError('Get public programmes', err, req);
        res.status(500).json({
          error: true,
          message: "Failed to fetch programmes. Please try again.",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/public:
   *   get:
   *     summary: Get detailed public programme information (no authentication required)
   *     tags: [Programmes]
   *     parameters:
   *       - in: path
   *         name: programme_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Programme details fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 programme:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     thumbnail:
   *                       type: string
   *                     weeks:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           weekNumber:
   *                             type: integer
   *                           title:
   *                             type: string
   *                           lessonCount:
   *                             type: integer
   *                     prerequisites:
   *                       type: string
   *                     totalLessons:
   *                       type: integer
   *                     estimatedDuration:
   *                       type: string
   *       '404':
   *         description: Programme not found or not published
   *       '500':
   *         description: Server error
   */
  app.get(
    "/v1/api/programmes/:programme_id/public",
    [UrlMiddleware],
    async function (req, res) {
      const { logApiError, logSuccess } = require("../utils/errorLogger");
      
      try {
        const { programme_id } = req.params;

        const sdk = new BackendSDK();
        sdk.setTable("programmes");
        
        // Get the programme (must be published)
        const programme = (await sdk.get({ 
          id: programme_id,
          status: PROGRAMME_STATUSES.PUBLISHED 
        }))[0];

        if (!programme) {
          return res.status(404).json({
            error: true,
            message: "Programme not found or not available",
          });
        }

        // Get weeks for this programme
        sdk.setTable("weeks");
        const weeks = await sdk.get({ programme_id: programme.id });

        // Sort weeks by week_number
        weeks.sort((a, b) => a.week_number - b.week_number);

        // Get lesson counts for each week
        const weekSummaries = await Promise.all(
          weeks.map(async (week) => {
            sdk.setTable("lessons");
            const lessons = await sdk.get({ week_id: week.id });

            return {
              weekNumber: week.week_number,
              title: week.title,
              lessonCount: lessons.length,
            };
          })
        );

        // Calculate total lessons
        const totalLessons = weekSummaries.reduce((sum, week) => sum + week.lessonCount, 0);

        // Calculate estimated duration
        const weekCount = weeks.length;
        const estimatedDuration = weekCount > 0 ? `${weekCount} week${weekCount !== 1 ? 's' : ''}` : 'TBD';

        logSuccess('Get public programme details', req, { programme_id, name: programme.name });

        return res.status(200).json({
          error: false,
          message: "Programme details fetched successfully",
          programme: {
            id: programme.id,
            name: programme.name,
            description: programme.description || '',
            thumbnail: null, // Not implemented yet
            weeks: weekSummaries,
            prerequisites: null, // Not implemented yet
            totalLessons,
            estimatedDuration,
          },
        });
      } catch (err) {
        logApiError('Get public programme details', err, req, { programme_id: req.params.programme_id });
        res.status(500).json({
          error: true,
          message: "Failed to fetch programme details. Please try again.",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/progress:
   *   get:
   *     summary: Get programme progress for the current user
   *     tags: [Programmes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: programme_id
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
   *         description: Programme progress fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 progress:
   *                   type: number
   *                 completedLessons:
   *                   type: number
   *                 totalLessons:
   *                   type: number
   *       '400':
   *         description: Validation error
   *       '500':
   *         description: Server error
   */
  app.get(
    "/v1/api/programmes/:programme_id/progress",
    [UrlMiddleware, TokenMiddleware({ role: "student" })],
    async function (req, res) {
      const { logApiError, logSuccess } = require("../utils/errorLogger");
      const ProgressService = require("../services/ProgressService");
      
      try {
        const { programme_id } = req.params;
        const { cohort_id } = req.query;

        // Validate inputs
        const validationResult = await ValidationService.validateObject(
          {
            programme_id: "required|integer",
            cohort_id: "required|integer",
          },
          { programme_id, cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        // Calculate progress using ProgressService
        const progressData = await ProgressService.calculateProgrammeProgress(
          req.user_id,
          parseInt(programme_id),
          parseInt(cohort_id)
        );

        logSuccess('Get programme progress', req, { 
          programme_id, 
          cohort_id,
          progress: progressData.progress 
        });

        return res.status(200).json({
          error: false,
          message: "Programme progress fetched successfully",
          progress: progressData.progress,
          completedLessons: progressData.completedLessons,
          totalLessons: progressData.totalLessons,
        });
      } catch (err) {
        logApiError('Get programme progress', err, req, { 
          programme_id: req.params.programme_id,
          cohort_id: req.query.cohort_id 
        });
        res.status(500).json({
          error: true,
          message: "Failed to fetch programme progress. Please try again.",
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/lifecycle/transition:
   *   post:
   *     summary: Transition programme to a new lifecycle state
   *     tags: [Programmes]
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
   *               - new_state
   *             properties:
   *               new_state:
   *                 type: string
   *                 enum: [draft, recruiting, active, completed, archived]
   *                 description: New lifecycle state
   *                 example: recruiting
   *               reason:
   *                 type: string
   *                 description: Optional reason for the transition
   *                 example: Programme ready for learner enrollment
   *     responses:
   *       '200':
   *         description: State transition successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 programme:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     name:
   *                       type: string
   *                     lifecycle_status:
   *                       type: string
   *                     status_changed_at:
   *                       type: string
   *                     status_changed_by:
   *                       type: integer
   *       '400':
   *         description: Invalid state or transition
   *       '403':
   *         description: Insufficient permissions
   *       '404':
   *         description: Programme not found
   *       '500':
   *         description: Server error
   */
  app.post(
    "/v1/api/programmes/:programme_id/lifecycle/transition",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      const ProgrammeLifecycleService = require("../services/ProgrammeLifecycleService");
      const RoleBasedAccessControlService = require("../services/RoleBasedAccessControlService");

      try {
        const { programme_id } = req.params;
        const { new_state, reason } = req.body;

        // Validate inputs
        if (!new_state) {
          return res.status(400).json({
            error: true,
            message: "new_state is required"
          });
        }

        // Check if user owns this programme (conveners can manage their own programmes)
        const sdk = new (require("../core/BackendSDK"))();
        sdk.setTable("programmes");
        const programmes = await sdk.get({ id: programme_id });
        if (!programmes || programmes.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Programme not found"
          });
        }
        if (programmes[0].created_by !== req.user_id) {
          return res.status(403).json({
            error: true,
            message: "You do not have permission to manage this programme"
          });
        }

        // Transition the state
        const result = await ProgrammeLifecycleService.transitionState(
          parseInt(programme_id),
          new_state,
          req.user_id,
          reason
        );

        if (!result.success) {
          const statusCode = result.error.code === 'PROGRAMME_NOT_FOUND' ? 404 : 400;
          return res.status(statusCode).json({
            error: true,
            message: result.error.message,
            code: result.error.code,
            details: result.error.details
          });
        }

        return res.status(200).json({
          error: false,
          message: `Programme transitioned to ${new_state} successfully`,
          programme: result.programme
        });
      } catch (err) {
        console.error("Error transitioning programme state:", err);
        return res.status(500).json({
          error: true,
          message: "Failed to transition programme state. Please try again."
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/lifecycle/state:
   *   get:
   *     summary: Get programme lifecycle state
   *     tags: [Programmes]
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
   *         description: Lifecycle state fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 state:
   *                   type: string
   *                 changed_at:
   *                   type: string
   *                 changed_by:
   *                   type: integer
   *       '404':
   *         description: Programme not found
   *       '500':
   *         description: Server error
   */
  app.get(
    "/v1/api/programmes/:programme_id/lifecycle/state",
    [UrlMiddleware, TokenMiddleware({ role: "student" })],
    async function (req, res) {
      const ProgrammeLifecycleService = require("../services/ProgrammeLifecycleService");

      try {
        const { programme_id } = req.params;

        const result = await ProgrammeLifecycleService.getLifecycleState(
          parseInt(programme_id)
        );

        if (result.error) {
          const statusCode = result.error.code === 'PROGRAMME_NOT_FOUND' ? 404 : 500;
          return res.status(statusCode).json({
            error: true,
            message: result.error.message
          });
        }

        return res.status(200).json({
          error: false,
          state: result.state,
          changed_at: result.changed_at,
          changed_by: result.changed_by
        });
      } catch (err) {
        console.error("Error fetching lifecycle state:", err);
        return res.status(500).json({
          error: true,
          message: "Failed to fetch lifecycle state. Please try again."
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/lifecycle/history:
   *   get:
   *     summary: Get programme lifecycle transition history
   *     tags: [Programmes]
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
   *         description: Transition history fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 history:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       programme_id:
   *                         type: integer
   *                       from_state:
   *                         type: string
   *                       to_state:
   *                         type: string
   *                       transitioned_by:
   *                         type: integer
   *                       transitioned_at:
   *                         type: string
   *                       reason:
   *                         type: string
   *       '403':
   *         description: Insufficient permissions
   *       '500':
   *         description: Server error
   */
  app.get(
    "/v1/api/programmes/:programme_id/lifecycle/history",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      const ProgrammeLifecycleService = require("../services/ProgrammeLifecycleService");
      const RoleBasedAccessControlService = require("../services/RoleBasedAccessControlService");

      try {
        const { programme_id } = req.params;

        // Check if user owns this programme
        const sdk2 = new (require("../core/BackendSDK"))();
        sdk2.setTable("programmes");
        const programmes2 = await sdk2.get({ id: programme_id });
        if (!programmes2 || programmes2.length === 0) {
          return res.status(404).json({ error: true, message: "Programme not found" });
        }
        if (programmes2[0].created_by !== req.user_id) {
          return res.status(403).json({
            error: true,
            message: "You do not have permission to view this programme's history"
          });
        }

        const history = await ProgrammeLifecycleService.getTransitionHistory(
          parseInt(programme_id)
        );

        return res.status(200).json({
          error: false,
          history
        });
      } catch (err) {
        console.error("Error fetching transition history:", err);
        return res.status(500).json({
          error: true,
          message: "Failed to fetch transition history. Please try again."
        });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/onboarding-mode:
   *   put:
   *     summary: Set programme onboarding mode
   *     tags: [Programmes]
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
   *               - mode
   *             properties:
   *               mode:
   *                 type: string
   *                 enum: [code, application]
   *                 description: Onboarding mode (code = join with code, application = apply to join)
   *                 example: code
   *     responses:
   *       '200':
   *         description: Onboarding mode updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       '400':
   *         description: Invalid mode
   *       '403':
   *         description: Insufficient permissions
   *       '404':
   *         description: Programme not found
   *       '500':
   *         description: Server error
   */
  app.put(
    "/v1/api/programmes/:programme_id/onboarding-mode",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      const ProgrammeLifecycleService = require("../services/ProgrammeLifecycleService");
      const RoleBasedAccessControlService = require("../services/RoleBasedAccessControlService");

      try {
        const { programme_id } = req.params;
        const { mode } = req.body;

        // Validate input
        if (!mode) {
          return res.status(400).json({
            error: true,
            message: "mode is required"
          });
        }

        // Check if user owns this programme
        const sdk3 = new (require("../core/BackendSDK"))();
        sdk3.setTable("programmes");
        const programmes3 = await sdk3.get({ id: programme_id });
        if (!programmes3 || programmes3.length === 0) {
          return res.status(404).json({ error: true, message: "Programme not found" });
        }
        if (programmes3[0].created_by !== req.user_id) {
          return res.status(403).json({
            error: true,
            message: "You do not have permission to manage this programme"
          });
        }

        // Set onboarding mode
        const result = await ProgrammeLifecycleService.setOnboardingMode(
          parseInt(programme_id),
          mode,
          req.user_id
        );

        if (!result.success) {
          const statusCode = result.error.code === 'PROGRAMME_NOT_FOUND' ? 404 : 400;
          return res.status(statusCode).json({
            error: true,
            message: result.error.message,
            code: result.error.code
          });
        }

        return res.status(200).json({
          error: false,
          message: `Onboarding mode set to ${mode} successfully`
        });
      } catch (err) {
        console.error("Error setting onboarding mode:", err);
        return res.status(500).json({
          error: true,
          message: "Failed to set onboarding mode. Please try again."
        });
      }
    }
  );

  // ── Convener: get application template questions ──
  // Requirements: 3.1, 3.2
  app.get('/v1/api/programmes/:id/application-template', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const ApplicationTemplateService = require('../services/ApplicationTemplateService');
      const questions = await ApplicationTemplateService.getTemplate(req.params.id);
      return res.json({ error: false, questions });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });

  // ── Convener: save application template questions ──
  // Requirements: 3.1, 3.2, 3.3
  app.put('/v1/api/programmes/:id/application-template', [UrlMiddleware, TokenMiddleware({ role: 'convener' })], async (req, res) => {
    try {
      const ApplicationTemplateService = require('../services/ApplicationTemplateService');
      const { questions } = req.body;
      if (!Array.isArray(questions)) {
        return res.status(400).json({ error: true, message: 'questions must be an array' });
      }
      const saved = await ApplicationTemplateService.saveTemplate(req.params.id, questions);
      return res.json({ error: false, questions: saved });
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  });
};
