const request = require('supertest');
const express = require('express');
const LearnerManagementController = require('../../controllers/LearnerManagementController');
const db = require('../../models');

// Mock dependencies
jest.mock('../../models');
jest.mock('../../services/ProgressService');
jest.mock('../../middleware/TokenMiddleware', () => {
  return (options) => (req, res, next) => {
    req.user_id = 1;
    req.role = 'convener';
    next();
  };
});

const app = express();
app.use(express.json());

require('../../routes/learnerManagement')(app);

describe('Learner Management Security Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IDOR / Ownership Validation', () => {
    it('should NOT allow a convener to access a learner they do not own', async () => {
      // Convener 1 owns programme 10
      db.programmes.findAll.mockResolvedValue([{ id: 10 }]);

      // Learner 100 is NOT in programme 10 (empty enrollment result for owned programmes)
      db.enrollments.findAll.mockResolvedValue([]);

      db.users.findByPk.mockResolvedValue({ id: 100, name: 'Victim' });

      const response = await request(app).get('/v1/api/convener/learners/100/profile');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should NOT allow updating enrollment status of a programme they do not own', async () => {
      db.enrollments.findOne.mockResolvedValue({
        id: 50,
        cohort: {
          programme: {
            created_by: 999 // Different convener
          }
        }
      });

      const response = await request(app)
        .patch('/v1/api/enrollments/50/status')
        .send({ status: 'suspended' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should filter getLearners to ONLY show learners in owned programmes', async () => {
      // First call to programmes.findAll (get owned IDs)
      db.programmes.findAll.mockResolvedValueOnce([{ id: 10 }]);

      // Second call to enrollments.findAll
      db.enrollments.findAll.mockResolvedValue([]);

      await request(app).get('/v1/api/convener/learners');

      // Find the enrollment call (skip the initial programmes call)
      const enrollmentCall = db.enrollments.findAll.mock.calls.find(c =>
        c[0] && c[0].include && c[0].include.some(inc => inc.as === 'cohort')
      );

      expect(enrollmentCall).toBeDefined();
      const cohortInclude = enrollmentCall[0].include.find(i => i.as === 'cohort');
      const programmeInclude = cohortInclude.include.find(i => i.as === 'programme');

      expect(programmeInclude.where.id[db.Sequelize.Op.in]).toEqual([10]);
    });
  });
});
