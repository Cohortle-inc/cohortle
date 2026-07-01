const BackendSDK = require("../core/BackendSDK");

/**
 * Middleware to validate that lessonId is present and has valid format
 */
const validateLessonIdFormat = (req, res, next) => {
    const { lesson_id } = req.params;

    if (!lesson_id) {
        return res.status(400).json({
            error: true,
            message: "Lesson ID is required",
        });
    }

    // Validate lessonId is a valid integer
    const lessonIdNum = Number(lesson_id);
    if (!Number.isInteger(lessonIdNum) || lessonIdNum <= 0) {
        return res.status(400).json({
            error: true,
            message: "Invalid lesson ID format",
        });
    }

    next();
};

/**
 * Middleware to validate that lessonId exists in database
 */
const validateLessonExists = async (req, res, next) => {
    try {
        const { lesson_id } = req.params;
        
        const sdk = new BackendSDK();
        sdk.setTable("module_lessons");
        const lesson = (await sdk.get({ id: lesson_id }))[0];

        if (!lesson) {
            return res.status(404).json({
                error: true,
                message: "Lesson not found",
            });
        }

        // Store lesson in request for later use
        req.lesson = lesson;
        next();
    } catch (err) {
        console.error("Lesson validation error:", err);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
};

module.exports = {
    validateLessonIdFormat,
    validateLessonExists,
};
