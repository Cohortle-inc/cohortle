const AccessService = require('../services/AccessService');

/**
 * Middleware to enforce enrollment status-based access control
 */
const checkEnrollmentStatus = async (req, res, next) => {
  try {
    const userId = req.user_id;
    const cohortId = req.body.cohort_id || req.query.cohort_id || req.params.cohort_id;

    if (!cohortId) {
      // If no cohortId is provided, we can't check status here.
      // Usually, routes that need status check will have a cohortId.
      return next();
    }

    const canAccess = await AccessService.canAccessProgramme(userId, cohortId);
    
    if (!canAccess) {
      return res.status(403).json({
        error: true,
        message: 'Your access to this programme has been suspended or removed.',
        code: 'ACCESS_SUSPENDED'
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkEnrollmentStatus middleware:', error);
    next();
  }
};

module.exports = {
  checkEnrollmentStatus
};
