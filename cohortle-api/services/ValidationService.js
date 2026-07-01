const {
  Validator,
  addCustomMessages,
  extend,
} = require("node-input-validator");
const BackendSDK = require("../core/BackendSDK");

// Custom rule to validate comma-separated integers
extend("commaInt", async ({ value }) => {
  if (typeof value !== "string") return false;

  const parts = value.split(",").map((s) => s.trim());

  return parts.every((part) => /^\d+$/.test(part));
});
addCustomMessages({
  "*.commaInt": "The field must be a comma-separated list of integers.",
});

// Custom rule to validate programme exists
// Note: Ownership validation should be done at the route level after this check passes
extend("programmeId", async ({ value }) => {
  // Validate value is a positive integer
  if (!value || isNaN(value) || parseInt(value) <= 0) {
    return false;
  }

  try {
    const sdk = new BackendSDK();
    sdk.setTable("programmes");
    const programme = await sdk.get({ id: parseInt(value) });
    
    // Check if programme exists
    return programme && programme.length > 0;
  } catch (error) {
    console.error("Error validating programmeId:", error);
    return false;
  }
});
addCustomMessages({
  "*.programmeId": "The programme does not exist.",
});

// Custom rule to validate week exists (UUID format)
extend("weekId", async ({ value }) => {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!value || !uuidRegex.test(value)) {
    return false;
  }

  try {
    const db = require('../models');
    const week = await db.weeks.findByPk(value);
    return week !== null;
  } catch (error) {
    console.error("Error validating weekId:", error);
    return false;
  }
});
addCustomMessages({
  "*.weekId": "The week does not exist or has an invalid format.",
});

// Custom rule to validate enrollment code format (WORD-YEAR-SUFFIX pattern)
extend("enrollmentCodeFormat", ({ value }) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  // Pattern: One or more word characters/numbers, hyphen, exactly 4 digits, optional hyphen and suffix
  const pattern = /^[A-Z0-9]+-\d{4}(-[A-Z0-9]+)?$/i;
  return pattern.test(value);
});
addCustomMessages({
  "*.enrollmentCodeFormat": "Enrollment code must follow the format: WORD-YEAR or WORD-YEAR-SUFFIX (e.g., WLIMP-2026 or PROG-2026-ABC123).",
});

// Custom rule to validate date is not in the past
extend("dateNotPast", ({ value }) => {
  if (!value) {
    return false;
  }
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
});
addCustomMessages({
  "*.dateNotPast": "The date cannot be in the past.",
});

// Custom rule to validate date is after another date
// Usage: dateAfter:start_date (where start_date is another field in the object)
extend("dateAfter", ({ value, args, validator }) => {
  if (!value || !args || args.length === 0) {
    return false;
  }
  
  const inputDate = new Date(value);
  // args[0] contains the field name to compare against
  const compareFieldName = args[0];
  
  // Access validator.inputs safely
  const compareValue = validator && validator.inputs ? validator.inputs[compareFieldName] : null;
  
  if (!compareValue) {
    return false;
  }
  
  const compareDate = new Date(compareValue);
  return inputDate > compareDate;
});
addCustomMessages({
  "*.dateAfter": "The date must be after :args[0].",
});

// Custom rule to validate enrollment code uniqueness
extend("uniqueEnrollmentCode", async ({ value, validator }) => {
  if (!value) {
    return false;
  }

  try {
    const sdk = new BackendSDK();
    sdk.setTable("cohorts");
    
    // Check if we're updating an existing cohort (has an id)
    // Access validator.inputs safely
    const cohortId = validator && validator.inputs ? validator.inputs.id : null;
    
    if (cohortId) {
      // For updates, check if code exists for a different cohort
      const existing = await sdk.get({ enrollment_code: value });
      return existing.length === 0 || (existing.length === 1 && existing[0].id === cohortId);
    } else {
      // For new cohorts, code must not exist at all
      const existing = await sdk.get({ enrollment_code: value });
      return existing.length === 0;
    }
  } catch (error) {
    console.error("Error validating uniqueEnrollmentCode:", error);
    return false;
  }
});
addCustomMessages({
  "*.uniqueEnrollmentCode": "This enrollment code is already in use.",
});

// Custom rule to validate URL scheme (only http/https)
extend("urlScheme", ({ value }) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    // Invalid URL format
    return false;
  }
});
addCustomMessages({
  "*.urlScheme": "URL must use http or https protocol.",
});

// Custom rule to validate content based on content_type
// For video/link/pdf: content_url is required
// For text: content_text is required
extend("contentTypeConditional", ({ value, validator }) => {
  // Access validator.inputs safely
  if (!validator || !validator.inputs) {
    return false;
  }
  
  const contentType = validator.inputs.content_type;
  const contentUrl = validator.inputs.content_url;
  const contentText = validator.inputs.content_text;
  
  if (!contentType) {
    return false;
  }
  
  // For video, link, pdf types: content_url must be present
  if (['video', 'link', 'pdf'].includes(contentType)) {
    return !!contentUrl && contentUrl.trim().length > 0;
  }
  
  // For text type: content_text must be present
  if (contentType === 'text') {
    return !!contentText && contentText.trim().length > 0;
  }
  
  return false;
});
addCustomMessages({
  "*.contentTypeConditional": "Content URL is required for video/link/pdf types, and content text is required for text type.",
});

const formatValidationError = (error) => {
  const formatted = Object.entries(error).map(([key, value]) => ({
    field: key,
    message: value.message,
    rule: value.rule || 'unknown'
  }));
  return formatted;
};

// Helper function to create consistent validation error responses
const createValidationErrorResponse = (validationErrors) => {
  return {
    error: true,
    message: "Validation failed",
    validation_errors: validationErrors
  };
};

// Validation Schemas for all entities
const PROGRAMME_VALIDATION = {
  name: "required|string|minLength:3|maxLength:255",
  description: "string|maxLength:1000",
  start_date: "required|date|dateNotPast"
};

const COHORT_VALIDATION = {
  programme_id: "required|integer|programmeId",
  name: "required|string|minLength:3|maxLength:200",
  enrollment_code: "required|string|enrollmentCodeFormat|uniqueEnrollmentCode",
  start_date: "required|date|dateNotPast",
  end_date: "date|dateAfter:start_date"
};

const WEEK_VALIDATION = {
  programme_id: "required|integer|programmeId",
  week_number: "required|integer|min:1",
  title: "required|string|minLength:3|maxLength:200",
  start_date: "required|date"
};

const LESSON_VALIDATION = {
  week_id: "required|string|weekId",
  title: "required|string|minLength:3|maxLength:255",
  description: "string|maxLength:1000",
  content_type: "required|in:video,link,pdf,text,quiz,live_session,assignment",
  content_url: "string",
  content_text: "string",
  order_index: "required|integer|min:0"
};

const ENROLLMENT_VALIDATION = {
  enrollment_code: "required|string|enrollmentCodeFormat"
};

module.exports = {
  /**
   * Input Validator middleware for controller
   * @param {object} validationObject object defining body fields and its validation types eg:{email:required|email}
   * @param {object} _extendMessages object defining message to throw on validation error eg: {"email.required":"Email is required","email.email":"Invalid email"}
   *
   */
  validateInput:
    (validationObject = {}, _extendMessages = {}) =>
    async (req, res, next) => {
      const validation = new Validator(req.body, validationObject);
      addCustomMessages(_extendMessages);

      try {
        const isValid = await validation.check();
        if (!isValid) {
          req.validationError = formatValidationError(validation.errors);
        }
        return next();
      } catch (error) {
        req.validationError = error.message;
        return next();
      }
    },

  handleValidationErrorForViews: (
    req,
    res,
    viewModel,
    viewPath = "/",
    fieldsStoreKey,
    defaultValue = {},
  ) => {
    const validationError = req.validationError;

    if (validationError) {
      // Remembers fields if validation error occurs
      Object.entries(defaultValue).forEach(([key, value]) => {
        viewModel[fieldsStoreKey][key] = value;
      });

      if (typeof validationError === "string") {
        viewModel.error = validationError;
      } else {
        viewModel.validationError = req.validationError;
      }
      return res.render(viewPath, viewModel);
    }
  },

  handleValidationErrorForAPI: (req, res, next) => {
    const validationError = req.validationError;

    if (validationError) {
      let error;
      if (typeof validationError === "string") {
        error = validationError;
      } else {
        error = req.validationError;
      }
      return res.status(400).json({ success: false, error });
    }
    next();
  },

  validateInputMethod: async (
    validationObject = {},
    _extendMessages = {},
    req,
  ) => {
    const validation = new Validator(req.body, validationObject);
    addCustomMessages(_extendMessages);

    try {
      const isValid = await validation.check();
      let error;

      if (!isValid) {
        console.error(
          new Error(
            `Invalid request body: ${JSON.stringify(req.body, null, 5)}`,
          ),
        );
        error = formatValidationError(validation.errors);
        return { error: true, message: "Validation Error", validation: error };
      }
      return { error: false };
    } catch (error) {
      return { error: true, message: "Validation Error", validation: error };
    }
  },
  validateObject: async (validationObject = {}, body) => {
    const validation = new Validator(body, validationObject);
    // addCustomMessages(_extendMessages);

    try {
      const isValid = await validation.check();
      let error;

      if (!isValid) {
        error = formatValidationError(validation.errors);
        return { error: true, message: "Validation Error", validation: error };
      }
      return { error: false };
    } catch (error) {
      return { error: true, message: "Validation Error", validation: error };
    }
  },
  
  // Export validation schemas for reuse
  PROGRAMME_VALIDATION,
  COHORT_VALIDATION,
  WEEK_VALIDATION,
  LESSON_VALIDATION,
  ENROLLMENT_VALIDATION,
  
  // Export helper functions
  createValidationErrorResponse,
};
