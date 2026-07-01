'use strict';

const express = require('express');
const router = express.Router();
const LearnerManagementController = require('../controllers/LearnerManagementController');
const authMiddleware = require('../middleware/auth'); // Assuming auth middleware exists
const roleMiddleware = require('../middleware/role'); // Assuming role middleware exists

/**
 * Routes for Convener Learner Management (Cohort CRM)
 */

// Get all learners across convener's programmes
router.get('/convener/learners',
  authMiddleware,
  roleMiddleware(['convener', 'admin']),
  LearnerManagementController.getLearners
);

// Update enrollment status
router.patch('/enrollments/:id/status',
  authMiddleware,
  roleMiddleware(['convener', 'admin']),
  LearnerManagementController.updateStatus
);

module.exports = router;
