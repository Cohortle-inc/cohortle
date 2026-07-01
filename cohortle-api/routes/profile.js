const ProfileService = require("../services/ProfileService");
const AvatarService = require("../services/AvatarService");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const rateLimit = require("express-rate-limit");
const { AVATAR_CONFIG } = require("../config/avatar");

// Rate limiting middleware for avatar generation
// Limits to 5 requests per minute per user
const avatarRateLimit = rateLimit({
    windowMs: AVATAR_CONFIG.rateLimit.windowMs,
    max: AVATAR_CONFIG.rateLimit.maxRequests,
    message: {
        error: true,
        message: "Too many avatar generation requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID as key for per-user rate limiting
    keyGenerator: (req, res) => {
        // Use user_id if available (after authentication)
        if (req.user_id) {
            return `user-${req.user_id}`;
        }
        // For unauthenticated requests, skip rate limiting (auth middleware will reject)
        return 'unauthenticated';
    },
    // Skip rate limiting for failed authentication (let auth middleware handle it)
    skip: (req) => !req.user_id,
});

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/profile:
     *   get:
     *     summary: Get user profile with learning statistics
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Profile fetched successfully
     *       '404':
     *         description: User not found
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/profile",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const result = await ProfileService.getUserProfile(req.user_id);

                return res.status(200).json({
                    error: false,
                    message: "Profile fetched successfully",
                    ...result,
                });
            } catch (err) {
                console.error("Error fetching profile:", err);
                
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch profile",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile:
     *   put:
     *     summary: Update user profile
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               profilePicture:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Profile updated successfully
     *       '400':
     *         description: Validation error
     *       '404':
     *         description: User not found
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/profile",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { name, profilePicture, bio, linkedinUsername, organisation_slug, organisation_name, organisation_description } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        name: "string",
                        profilePicture: "string",
                        bio: "string",
                        linkedinUsername: "string",
                        organisation_slug: "string",
                        organisation_name: "string",
                        organisation_description: "string",
                    },
                    { name, profilePicture, bio, linkedinUsername, organisation_slug, organisation_name, organisation_description }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const user = await ProfileService.updateProfile(req.user_id, {
                    name,
                    profilePicture,
                    bio,
                    linkedinUsername,
                    organisation_slug,
                    organisation_name,
                    organisation_description,
                });

                return res.status(200).json({
                    error: false,
                    message: "Profile updated successfully",
                    user,
                });
            } catch (err) {
                console.error("Error updating profile:", err);
                
                if (err.message.includes("empty")) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to update profile",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile/achievements:
     *   get:
     *     summary: Get user achievements
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Achievements fetched successfully
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/profile/achievements",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const achievements = await ProfileService.getUserAchievements(req.user_id);

                return res.status(200).json({
                    error: false,
                    message: "Achievements fetched successfully",
                    achievements,
                });
            } catch (err) {
                console.error("Error fetching achievements:", err);
                
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch achievements",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile/preferences:
     *   get:
     *     summary: Get notification preferences
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Preferences fetched successfully
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/profile/preferences",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const preferences = await ProfileService.getPreferences(req.user_id);

                return res.status(200).json({
                    error: false,
                    message: "Preferences fetched successfully",
                    preferences,
                });
            } catch (err) {
                console.error("Error fetching preferences:", err);
                
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch preferences",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile/preferences:
     *   put:
     *     summary: Update notification preferences
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               emailLessonReminders:
     *                 type: boolean
     *               emailCommunityActivity:
     *                 type: boolean
     *               emailProgrammeUpdates:
     *                 type: boolean
     *               emailWeeklyDigest:
     *                 type: boolean
     *     responses:
     *       '200':
     *         description: Preferences updated successfully
     *       '400':
     *         description: Validation error
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/profile/preferences",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const {
                    emailLessonReminders,
                    emailCommunityActivity,
                    emailProgrammeUpdates,
                    emailWeeklyDigest,
                } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        emailLessonReminders: "boolean",
                        emailCommunityActivity: "boolean",
                        emailProgrammeUpdates: "boolean",
                        emailWeeklyDigest: "boolean",
                    },
                    {
                        emailLessonReminders,
                        emailCommunityActivity,
                        emailProgrammeUpdates,
                        emailWeeklyDigest,
                    }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const preferences = await ProfileService.updatePreferences(req.user_id, {
                    emailLessonReminders,
                    emailCommunityActivity,
                    emailProgrammeUpdates,
                    emailWeeklyDigest,
                });

                return res.status(200).json({
                    error: false,
                    message: "Preferences updated successfully",
                    preferences,
                });
            } catch (err) {
                console.error("Error updating preferences:", err);
                
                res.status(500).json({
                    error: true,
                    message: "Failed to update preferences",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile/goals:
     *   get:
     *     summary: Get current learning goal
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Goal fetched successfully
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/profile/goals",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const goal = await ProfileService.getLearningGoal(req.user_id);

                return res.status(200).json({
                    error: false,
                    message: "Goal fetched successfully",
                    goal,
                });
            } catch (err) {
                console.error("Error fetching goal:", err);
                
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch goal",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile/goals:
     *   put:
     *     summary: Set or update learning goal
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - type
     *               - target
     *             properties:
     *               type:
     *                 type: string
     *                 enum: [lessons_per_week, hours_per_week]
     *               target:
     *                 type: integer
     *                 minimum: 1
     *     responses:
     *       '200':
     *         description: Goal updated successfully
     *       '400':
     *         description: Validation error
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/profile/goals",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { type, target } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        type: "required|string",
                        target: "required|integer",
                    },
                    { type, target }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const goal = await ProfileService.setLearningGoal(req.user_id, {
                    type,
                    target: parseInt(target),
                });

                return res.status(200).json({
                    error: false,
                    message: "Goal updated successfully",
                    goal,
                });
            } catch (err) {
                console.error("Error updating goal:", err);
                
                if (err.message.includes("Invalid") || err.message.includes("greater than")) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to update goal",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile/avatar/generate:
     *   post:
     *     summary: Generate a new profile avatar
     *     description: Generates a culturally appropriate profile avatar using DiceBear API and updates the user's profile image
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '200':
     *         description: Avatar generated successfully
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
     *                   example: Avatar generated successfully
     *                 avatarUrl:
     *                   type: string
     *                   example: https://api.dicebear.com/7.x/big-smile/svg?seed=user-123-1234567890-abc&backgroundColor=b6e3f4&skinColor=ae5d29&size=200
     *       '401':
     *         description: Authentication required
     *       '429':
     *         description: Too many requests - rate limit exceeded
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/profile/avatar/generate",
        [UrlMiddleware, TokenMiddleware(), avatarRateLimit],
        async function (req, res) {
            const startTime = Date.now();
            
            try {
                console.log('[Avatar Route] Avatar generation request:', {
                    userId: req.user_id,
                    timestamp: new Date().toISOString(),
                });
                
                // Generate avatar URL using AvatarService
                const avatarUrl = await AvatarService.generateAvatarUrl({
                    userId: req.user_id,
                });
                
                console.log('[Avatar Route] Avatar URL generated:', {
                    userId: req.user_id,
                    urlLength: avatarUrl.length,
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - startTime,
                });
                
                // Update user's profile image using ProfileService
                await ProfileService.updateProfileImage(req.user_id, avatarUrl);
                
                console.log('[Avatar Route] Profile image updated successfully:', {
                    userId: req.user_id,
                    timestamp: new Date().toISOString(),
                    totalDuration: Date.now() - startTime,
                });
                
                // Set caching headers for avatar URL response
                // Cache for 1 hour since avatars can be regenerated
                res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
                
                return res.status(200).json({
                    error: false,
                    message: "Avatar generated successfully",
                    avatarUrl,
                });
            } catch (err) {
                // Structured error logging with context
                console.error('[Avatar Route] Avatar generation failed:', {
                    error: err.message,
                    userId: req.user_id,
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - startTime,
                    stack: err.stack,
                });
                
                // Handle specific error types
                if (err.message.includes("required")) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("validation failed")) {
                    return res.status(400).json({
                        error: true,
                        message: "Generated avatar URL is invalid",
                    });
                }
                
                if (err.message.includes("exceeds maximum length")) {
                    return res.status(400).json({
                        error: true,
                        message: "Avatar URL is too long to store",
                    });
                }
                
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: "User not found",
                    });
                }
                
                // Generic error response
                res.status(500).json({
                    error: true,
                    message: "Failed to generate avatar. Please try again later.",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/profile/password:
     *   put:
     *     summary: Change user password
     *     tags: [Profile]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - currentPassword
     *               - newPassword
     *             properties:
     *               currentPassword:
     *                 type: string
     *                 example: CurrentPassword123
     *               newPassword:
     *                 type: string
     *                 example: NewStrongPassword123
     *     responses:
     *       '200':
     *         description: Password changed successfully
     *       '400':
     *         description: Validation error or weak password
     *       '401':
     *         description: Current password is incorrect
     *       '404':
     *         description: User not found
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/profile/password",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { currentPassword, newPassword } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        currentPassword: "required|string",
                        newPassword: "required|string",
                    },
                    { currentPassword, newPassword }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                // Validate new password strength
                if (newPassword.length < 8) {
                    return res.status(400).json({
                        error: true,
                        message: "New password must be at least 8 characters long",
                    });
                }

                if (!/[A-Z]/.test(newPassword)) {
                    return res.status(400).json({
                        error: true,
                        message: "New password must contain at least one uppercase letter",
                    });
                }

                if (!/[a-z]/.test(newPassword)) {
                    return res.status(400).json({
                        error: true,
                        message: "New password must contain at least one lowercase letter",
                    });
                }

                if (!/[0-9]/.test(newPassword)) {
                    return res.status(400).json({
                        error: true,
                        message: "New password must contain at least one number",
                    });
                }

                await ProfileService.changePassword(req.user_id, currentPassword, newPassword);

                return res.status(200).json({
                    error: false,
                    message: "Password changed successfully",
                });
            } catch (err) {
                console.error("Error changing password:", err);
                
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("incorrect") || err.message.includes("does not match")) {
                    return res.status(401).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to change password",
                });
            }
        }
    );

    return [];
};
