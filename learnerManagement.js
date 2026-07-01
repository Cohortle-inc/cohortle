'use strict';

const express = require('express');
const router = express.Router();
const LearnerManagementController = require('../controllers/LearnerManagementController');
const TokenMiddleware = require('../middleware/TokenMiddleware');

/**
 * Routes for Convener Learner Management (Cohort CRM)
 */

const convenerOrAdmin = TokenMiddleware({ role: 'convener|administrator' });

module.exports = (app) => {
  // Get all learners across convener's programmes
  app.get('/v1/api/convener/learners',
    convenerOrAdmin,
    LearnerManagementController.getLearners
  );

  // Update enrollment status
  app.patch('/v1/api/enrollments/:id/status',
    convenerOrAdmin,
    LearnerManagementController.updateStatus
  );

  // Get learner profile
  app.get('/v1/api/convener/learners/:id/profile',
    convenerOrAdmin,
    LearnerManagementController.getLearnerProfile
  );

  // Get learner activity
  app.get('/v1/api/convener/learners/:id/activity',
    convenerOrAdmin,
    LearnerManagementController.getLearnerActivity
  );

  // Suspend a learner
  app.patch('/v1/api/enrollments/:id/suspend',
    convenerOrAdmin,
    LearnerManagementController.suspendLearner
  );

  // Reactivate a suspended learner
  app.patch('/v1/api/enrollments/:id/reactivate',
    convenerOrAdmin,
    LearnerManagementController.reactivateLearner
  );

  // Remove a learner permanently
  app.patch('/v1/api/enrollments/:id/remove',
    convenerOrAdmin,
    LearnerManagementController.removeLearner
  );

  // Add a note for a learner
  app.post('/v1/api/enrollments/:id/notes',
    convenerOrAdmin,
    LearnerManagementController.addNote
  );

  // Get notes for a learner
  app.get('/v1/api/enrollments/:id/notes',
    convenerOrAdmin,
    LearnerManagementController.getNotes
  );

  // Send communication to a learner
  app.post('/v1/api/enrollments/:id/communicate',
    convenerOrAdmin,
    LearnerManagementController.sendCommunication
  );

  // Record attendance for a learner
  app.post('/v1/api/enrollments/:id/attendance',
    convenerOrAdmin,
    LearnerManagementController.recordAttendance
  );
};
