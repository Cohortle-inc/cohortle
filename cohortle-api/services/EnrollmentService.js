/**
 * EnrollmentService
 * 
 * Handles learner enrollment in programme cohorts using enrollment codes.
 * Provides validation, duplicate checking, and enrollment creation.
 * 
 * Requirements: 2.1, 2.4, 2.6, 2.7
 */

const db = require('../models');
const { cohorts, enrollments, programmes } = db;

class EnrollmentService {
  /**
   * Validate enrollment code format and check if it exists
   * 
   * @param {string} code - Enrollment code in format WORD-YEAR or WORD-YEAR-SUFFIX (e.g., WLIMP-2026 or PROG-2026-ABC123)
   * @returns {Promise<Object>} - Cohort object if valid
   * @throws {Error} - If code format is invalid or code doesn't exist
   * 
   * Requirements: 2.4, 2.6
   */
  async validateCode(code) {
    // Validate code format: WORD-YEAR or WORD-YEAR-SUFFIX
    const codePattern = /^[A-Z0-9]+-\d{4}(-[A-Z0-9]+)?$/i;
    
    if (!code || typeof code !== 'string') {
      const error = new Error('Invalid code format. Use format: PROGRAMME-YEAR or PROGRAMME-YEAR-SUFFIX');
      error.statusCode = 400;
      throw error;
    }

    const trimmedCode = code.trim();
    
    if (!codePattern.test(trimmedCode)) {
      const error = new Error('Invalid code format. Use format: PROGRAMME-YEAR or PROGRAMME-YEAR-SUFFIX');
      error.statusCode = 400;
      throw error;
    }

    // Check if code exists in database
    const cohort = await cohorts.findOne({
      where: { enrollment_code: trimmedCode },
      include: [
        {
          model: programmes,
          as: 'programme',
          attributes: ['id', 'name', 'description', 'onboarding_mode', 'lifecycle_status'],
        },
      ],
    });

    if (!cohort) {
      const error = new Error('Enrollment code not found. Please check the code and try again.');
      error.statusCode = 404;
      throw error;
    }

    return cohort;
  }

  /**
   * Check if a learner is already enrolled in a cohort
   * 
   * @param {number} userId - User ID of the learner
   * @param {number} cohortId - Cohort ID to check enrollment for
   * @returns {Promise<boolean>} - True if already enrolled, false otherwise
   * 
   * Requirements: 2.7
   */
  async checkExistingEnrollment(userId, cohortId) {
    const existingEnrollment = await enrollments.findOne({
      where: {
        user_id: userId,
        cohort_id: cohortId,
      },
    });

    return existingEnrollment !== null;
  }

  /**
   * Enroll a learner in a cohort
   * 
   * @param {number} userId - User ID of the learner
   * @param {number} cohortId - Cohort ID to enroll in
   * @param {Object} [options] - Optional enrollment options
   * @param {string} [options.enrollmentSource='code'] - Source of enrollment ('code' or 'application')
   * @param {string} [options.applicationId=null] - Application ID if enrollment_source is 'application'
   * @returns {Promise<Object>} - Created enrollment record
   * @throws {Error} - If enrollment creation fails
   * 
   * Requirements: 2.1, 5.6, 11.4
   */
  async enrollLearner(userId, cohortId, { enrollmentSource = 'code', applicationId = null } = {}) {
    try {
      // Check if already enrolled (idempotent behavior)
      const isAlreadyEnrolled = await this.checkExistingEnrollment(userId, cohortId);
      
      if (isAlreadyEnrolled) {
        // Return existing enrollment
        const existingEnrollment = await enrollments.findOne({
          where: {
            user_id: userId,
            cohort_id: cohortId,
          },
        });
        return existingEnrollment;
      }

      // Create new enrollment
      const enrollment = await enrollments.create({
        user_id: userId,
        cohort_id: cohortId,
        enrolled_at: new Date(),
        enrollment_source: enrollmentSource,
        application_id: applicationId || null,
      });

      return enrollment;
    } catch (error) {
      // Handle unique constraint violation (race condition)
      if (error.name === 'SequelizeUniqueConstraintError') {
        // Return existing enrollment
        const existingEnrollment = await enrollments.findOne({
          where: {
            user_id: userId,
            cohort_id: cohortId,
          },
        });
        return existingEnrollment;
      }
      
      throw error;
    }
  }

  /**
   * Complete enrollment flow: validate code and enroll learner
   * 
   * @param {number} userId - User ID of the learner
   * @param {string} code - Enrollment code
   * @returns {Promise<Object>} - Enrollment response with programme and cohort info
   * 
   * Requirements: 2.1, 2.4, 2.6, 2.7
   */
  async enrollWithCode(userId, code) {
    // Validate code and get cohort
    const cohort = await this.validateCode(code);

    // Block enrollment-code join if programme is application-only (Requirement 7.3, 11.1)
    if (cohort.programme && cohort.programme.onboarding_mode === 'application') {
      const error = new Error('This programme requires an application. Enrollment codes are not accepted.');
      error.statusCode = 422;
      error.code = 'APPLICATIONS_ONLY';
      throw error;
    }

    // Block enrollment if programme is not open for enrollment
    const lifecycleStatus = cohort.programme ? cohort.programme.lifecycle_status : null;
    const enrollableStatuses = ['recruiting', 'active'];
    if (lifecycleStatus && !enrollableStatuses.includes(lifecycleStatus)) {
      const error = new Error('This programme is not currently open for enrollment.');
      error.statusCode = 422;
      error.code = 'PROGRAMME_NOT_ENROLLABLE';
      throw error;
    }

    // Enroll learner
    const enrollment = await this.enrollLearner(userId, cohort.id);

    // Return enrollment response
    return {
      success: true,
      programme_id: cohort.programme_id,
      programme_name: cohort.programme ? cohort.programme.name : null,
      cohort_id: cohort.id,
      enrollment_id: enrollment.id,
      is_new_enrollment: enrollment.enrolled_at.getTime() === new Date().getTime(),
    };
  }

  /**
   * Get all programmes a user is enrolled in with current week information
   * 
   * @param {number} userId - User ID of the learner
   * @returns {Promise<Array>} - Array of enrolled programmes with current week data
   * 
   * Requirements: 5.1, 5.2
   */
  async getUserEnrolledProgrammes(userId) {
    try {
      // Get all enrollments for the user
      const userEnrollments = await enrollments.findAll({
        where: { 
          user_id: userId,
          status: { [db.Sequelize.Op.in]: ['active', 'completed'] }
        },
        include: [
          {
            model: cohorts,
            as: 'cohort',
            attributes: ['id', 'programme_id', 'start_date', 'name'],
            include: [
              {
                model: programmes,
                as: 'programme',
                attributes: ['id', 'name', 'description'],
              },
            ],
          },
        ],
      });

      // Get unique programmes with current week calculation
      const ProgrammeService = require('./ProgrammeService');
      const programmeMap = new Map();

      for (const enrollment of userEnrollments) {
        const cohort = enrollment.cohort;
        const programme = cohort.programme;
        
        if (!programme) continue;

        // Skip if we already processed this programme
        if (programmeMap.has(programme.id)) continue;

        // Calculate current week for this cohort
        let currentWeek = 1;
        let totalWeeks = 0;
        
        try {
          currentWeek = await ProgrammeService.getCurrentWeek(programme.id, cohort.id);
          
          // Get total weeks count
          const { weeks } = db;
          const weekRecords = await weeks.findAll({
            where: { programme_id: programme.id },
            attributes: ['week_number'],
          });
          totalWeeks = weekRecords.length;
        } catch (err) {
          console.warn(`Could not calculate week info for programme ${programme.id}:`, err.message);
        }

        programmeMap.set(programme.id, {
          id: programme.id,
          name: programme.name,
          description: programme.description,
          currentWeek,
          totalWeeks,
          cohortId: cohort.id,
          cohortName: cohort.name,
          enrolledAt: enrollment.enrolled_at,
        });
      }

      return Array.from(programmeMap.values());
    } catch (error) {
      console.error('Error fetching user enrolled programmes:', error);
      throw error;
    }
  }
}

module.exports = new EnrollmentService();
