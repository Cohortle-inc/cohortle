const db = require('../models');
const roleErrorHandler = require('../utils/roleErrorHandler');

/**
 * ProgrammeLifecycleService
 * 
 * Service for managing programme lifecycle states and transitions.
 * Handles state validation, transition logic, access control, and audit logging.
 * 
 * Lifecycle States:
 * - draft: Programme structure being created, full editing allowed
 * - recruiting: Learners can apply or join cohorts
 * - active: Programme running, structural changes restricted
 * - completed: Programme finished, read-only for learners
 * - archived: Programme retained for history, read-only
 * 
 * Requirements: 10.1-10.7
 */
class ProgrammeLifecycleService {
  /**
   * Valid lifecycle states
   */
  static LIFECYCLE_STATES = {
    DRAFT: 'draft',
    RECRUITING: 'recruiting',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
  };

  /**
   * Valid onboarding modes
   */
  static ONBOARDING_MODES = {
    CODE: 'code',
    APPLICATION: 'application'
  };

  /**
   * Valid state transitions
   * Maps current state to allowed next states
   */
  static VALID_TRANSITIONS = {
    draft: ['recruiting', 'active', 'archived'],
    recruiting: ['active', 'draft', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [] // Terminal state
  };

  /**
   * Transition a programme to a new lifecycle state
   * 
   * Validates the transition, updates the programme, and logs the change.
   * 
   * @param {number} programmeId - Programme ID
   * @param {string} newState - New lifecycle state
   * @param {number} userId - User making the change
   * @param {string} reason - Optional reason for the transition
   * @returns {Promise<object>} - { success: boolean, programme: object, error: object|null }
   * 
   * Requirements: 10.6, 10.7
   */
  async transitionState(programmeId, newState, userId, reason = null) {
    const transaction = await db.sequelize.transaction();

    try {
      // Validate inputs
      if (!programmeId || !newState || !userId) {
        await transaction.rollback();
        return {
          success: false,
          programme: null,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_PARAMETERS',
            'Programme ID, new state, and user ID are required'
          )
        };
      }

      // Validate new state
      if (!Object.values(ProgrammeLifecycleService.LIFECYCLE_STATES).includes(newState)) {
        await transaction.rollback();
        return {
          success: false,
          programme: null,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_STATE',
            `Invalid lifecycle state: ${newState}. Must be one of: ${Object.values(ProgrammeLifecycleService.LIFECYCLE_STATES).join(', ')}`
          )
        };
      }

      // Get programme
      const programme = await db.programmes.findByPk(programmeId, { transaction });
      if (!programme) {
        await transaction.rollback();
        return {
          success: false,
          programme: null,
          error: roleErrorHandler.createErrorResponse(
            'PROGRAMME_NOT_FOUND',
            `Programme with ID ${programmeId} not found`
          )
        };
      }

      const currentState = programme.lifecycle_status || 'draft';

      // Check if transition is valid
      const validTransitions = ProgrammeLifecycleService.VALID_TRANSITIONS[currentState] || [];
      if (!validTransitions.includes(newState)) {
        await transaction.rollback();
        return {
          success: false,
          programme: null,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_TRANSITION',
            `Cannot transition from ${currentState} to ${newState}. Valid transitions: ${validTransitions.join(', ') || 'none (terminal state)'}`
          )
        };
      }

      // Update programme
      await programme.update({
        lifecycle_status: newState,
        status_changed_at: new Date(),
        status_changed_by: userId
      }, { transaction });

      // Log the transition
      await this._logStateTransition(
        programmeId,
        currentState,
        newState,
        userId,
        reason,
        transaction
      );

      await transaction.commit();

      console.log(`Programme ${programmeId} transitioned from ${currentState} to ${newState} by user ${userId}`);

      return {
        success: true,
        programme: {
          id: programme.id,
          name: programme.name,
          lifecycle_status: programme.lifecycle_status,
          status_changed_at: programme.status_changed_at,
          status_changed_by: programme.status_changed_by
        },
        error: null
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error in transitionState:', error);
      return {
        success: false,
        programme: null,
        error: roleErrorHandler.createErrorResponse(
          'TRANSITION_FAILED',
          'Failed to transition programme state',
          { error: error.message }
        )
      };
    }
  }

  /**
   * Check if an operation is allowed based on programme lifecycle state
   * 
   * @param {number} programmeId - Programme ID
   * @param {string} operation - Operation type (e.g., 'edit_structure', 'edit_content', 'enroll', 'view')
   * @returns {Promise<object>} - { allowed: boolean, error: object|null }
   * 
   * Requirements: 10.2, 10.3, 10.4, 10.5
   */
  async canPerformOperation(programmeId, operation) {
    try {
      if (!programmeId || !operation) {
        return {
          allowed: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_PARAMETERS',
            'Programme ID and operation are required'
          )
        };
      }

      // Get programme
      const programme = await db.programmes.findByPk(programmeId, {
        attributes: ['id', 'lifecycle_status', 'name']
      });

      if (!programme) {
        return {
          allowed: false,
          error: roleErrorHandler.createErrorResponse(
            'PROGRAMME_NOT_FOUND',
            `Programme with ID ${programmeId} not found`
          )
        };
      }

      const state = programme.lifecycle_status || 'draft';

      // Define operation permissions by state
      const permissions = {
        draft: {
          edit_structure: true,
          edit_content: true,
          enroll: false,
          view: true,
          delete: true
        },
        recruiting: {
          edit_structure: false,
          edit_content: true,
          enroll: true,
          view: true,
          delete: false
        },
        active: {
          edit_structure: false,
          edit_content: true,
          enroll: false,
          view: true,
          delete: false
        },
        completed: {
          edit_structure: false,
          edit_content: false,
          enroll: false,
          view: true,
          delete: false
        },
        archived: {
          edit_structure: false,
          edit_content: false,
          enroll: false,
          view: true,
          delete: false
        }
      };

      const statePermissions = permissions[state];
      if (!statePermissions) {
        return {
          allowed: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_STATE',
            `Unknown lifecycle state: ${state}`
          )
        };
      }

      const allowed = statePermissions[operation];
      if (allowed === undefined) {
        return {
          allowed: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_OPERATION',
            `Unknown operation: ${operation}`
          )
        };
      }

      if (!allowed) {
        return {
          allowed: false,
          error: roleErrorHandler.createErrorResponse(
            'OPERATION_NOT_ALLOWED',
            `Cannot ${operation} on programme in ${state} state`,
            {
              programme_id: programmeId,
              programme_name: programme.name,
              current_state: state,
              operation: operation
            }
          )
        };
      }

      return { allowed: true, error: null };
    } catch (error) {
      console.error('Error in canPerformOperation:', error);
      return {
        allowed: false,
        error: roleErrorHandler.createErrorResponse(
          'OPERATION_CHECK_FAILED',
          'Failed to check operation permission',
          { error: error.message }
        )
      };
    }
  }

  /**
   * Get programme lifecycle state
   * 
   * @param {number} programmeId - Programme ID
   * @returns {Promise<object>} - { state: string, changed_at: Date, changed_by: number, error: object|null }
   */
  async getLifecycleState(programmeId) {
    try {
      if (!programmeId) {
        return {
          state: null,
          changed_at: null,
          changed_by: null,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_PARAMETERS',
            'Programme ID is required'
          )
        };
      }

      const programme = await db.programmes.findByPk(programmeId, {
        attributes: ['id', 'lifecycle_status', 'status_changed_at', 'status_changed_by']
      });

      if (!programme) {
        return {
          state: null,
          changed_at: null,
          changed_by: null,
          error: roleErrorHandler.createErrorResponse(
            'PROGRAMME_NOT_FOUND',
            `Programme with ID ${programmeId} not found`
          )
        };
      }

      return {
        state: programme.lifecycle_status || 'draft',
        changed_at: programme.status_changed_at,
        changed_by: programme.status_changed_by,
        error: null
      };
    } catch (error) {
      console.error('Error in getLifecycleState:', error);
      return {
        state: null,
        changed_at: null,
        changed_by: null,
        error: roleErrorHandler.createErrorResponse(
          'STATE_FETCH_FAILED',
          'Failed to fetch lifecycle state',
          { error: error.message }
        )
      };
    }
  }

  /**
   * Get lifecycle transition history for a programme
   * 
   * @param {number} programmeId - Programme ID
   * @returns {Promise<Array>} - Array of transition records
   */
  async getTransitionHistory(programmeId) {
    try {
      if (!programmeId) {
        return [];
      }

      // Query the programme_lifecycle_history table
      const history = await db.sequelize.query(
        `SELECT * FROM programme_lifecycle_history 
         WHERE programme_id = :programmeId 
         ORDER BY transitioned_at DESC`,
        {
          replacements: { programmeId },
          type: db.Sequelize.QueryTypes.SELECT
        }
      ).catch(() => {
        // Table might not exist yet, return empty array
        return [];
      });

      return history || [];
    } catch (error) {
      console.error('Error in getTransitionHistory:', error);
      return [];
    }
  }

  /**
   * Log a state transition
   * 
   * @private
   * @param {number} programmeId - Programme ID
   * @param {string} fromState - Previous state
   * @param {string} toState - New state
   * @param {number} userId - User who made the change
   * @param {string} reason - Optional reason
   * @param {object} transaction - Database transaction
   * @returns {Promise<void>}
   * 
   * Requirements: 10.7
   */
  async _logStateTransition(programmeId, fromState, toState, userId, reason, transaction) {
    try {
      // Create history table if it doesn't exist
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS programme_lifecycle_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          programme_id INT NOT NULL,
          from_state VARCHAR(20),
          to_state VARCHAR(20) NOT NULL,
          transitioned_by INT NOT NULL,
          transitioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reason TEXT,
          FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE,
          FOREIGN KEY (transitioned_by) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_programme_lifecycle_history_programme_id (programme_id),
          INDEX idx_programme_lifecycle_history_transitioned_at (transitioned_at)
        )
      `, { transaction });

      // Insert transition record
      await db.sequelize.query(
        `INSERT INTO programme_lifecycle_history 
         (programme_id, from_state, to_state, transitioned_by, reason) 
         VALUES (:programmeId, :fromState, :toState, :userId, :reason)`,
        {
          replacements: {
            programmeId,
            fromState,
            toState,
            userId,
            reason
          },
          transaction
        }
      );

      console.log(`Logged lifecycle transition for programme ${programmeId}: ${fromState} -> ${toState}`);
    } catch (error) {
      console.error('Error logging state transition:', error);
      // Don't throw - logging failure shouldn't prevent the transition
    }
  }

  /**
   * Set programme onboarding mode
   * 
   * @param {number} programmeId - Programme ID
   * @param {string} mode - Onboarding mode ('code' or 'application')
   * @param {number} userId - User making the change
   * @returns {Promise<object>} - { success: boolean, error: object|null }
   * 
   * Requirements: 11.1, 11.2, 11.4
   */
  async setOnboardingMode(programmeId, mode, userId) {
    try {
      // Validate inputs
      if (!programmeId || !mode || !userId) {
        return {
          success: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_PARAMETERS',
            'Programme ID, mode, and user ID are required'
          )
        };
      }

      // Validate mode
      if (!Object.values(ProgrammeLifecycleService.ONBOARDING_MODES).includes(mode)) {
        return {
          success: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_MODE',
            `Invalid onboarding mode: ${mode}. Must be 'code' or 'application'`
          )
        };
      }

      // Get programme
      const programme = await db.programmes.findByPk(programmeId);
      if (!programme) {
        return {
          success: false,
          error: roleErrorHandler.createErrorResponse(
            'PROGRAMME_NOT_FOUND',
            `Programme with ID ${programmeId} not found`
          )
        };
      }

      // Update onboarding mode
      await programme.update({
        onboarding_mode: mode
      });

      console.log(`Programme ${programmeId} onboarding mode set to ${mode} by user ${userId}`);

      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('Error in setOnboardingMode:', error);
      return {
        success: false,
        error: roleErrorHandler.createErrorResponse(
          'MODE_UPDATE_FAILED',
          'Failed to update onboarding mode',
          { error: error.message }
        )
      };
    }
  }
}

module.exports = new ProgrammeLifecycleService();
