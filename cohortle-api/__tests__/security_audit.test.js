const LearnerManagementController = require('../controllers/LearnerManagementController');
const db = require('../models');
const ProgressService = require('../services/ProgressService');

// Mock dependencies
jest.mock('../models');
jest.mock('../services/ProgressService');

describe('Security Audit: Convener Learner Intelligence', () => {
  let req, res;
  const CONVENER_A_ID = 1;
  const CONVENER_B_ID = 2;
  const LEARNER_ID = 100;
  const ENROLLMENT_B_ID = 500;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('IDOR / Cross-Convener Access', () => {

    test('Convener A should NOT be able to access profile of a learner only in Convener B programmes', async () => {
      req = {
        user_id: CONVENER_A_ID,
        params: { id: LEARNER_ID }
      };

      // Mock owned programmes for Convener A
      db.programmes.findAll.mockResolvedValue([{ id: 10 }]); // Convener A owns Prog 10

      // Mock learner enrollments - none in Prog 10
      db.enrollments.findAll.mockResolvedValue([]);

      await LearnerManagementController.getLearnerProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: true,
        message: expect.stringContaining('Unauthorized')
      }));
    });

    test('Convener A should NOT see any activity of a learner for programmes they do not own', async () => {
      req = {
        user_id: CONVENER_A_ID,
        params: { id: LEARNER_ID },
        query: {}
      };

      const PROG_A_ID = 1;
      const PROG_B_ID = 20;

      // Mock owned programmes for Convener A
      db.programmes.findAll.mockResolvedValue([{ id: PROG_A_ID }]);

      // Mock activity logs containing both PROG_A and PROG_B activity
      // But the query should filter by ownedProgrammeIds
      db.activity_logs.findAll.mockResolvedValue([
        { id: 1, programme_id: PROG_A_ID, description: 'Test A' }
      ]);

      await LearnerManagementController.getLearnerActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.error).toBe(false);
      // Ensure all returned activities belong to PROG_A_ID
      response.activities.forEach(activity => {
        expect(activity.programme_id).toBe(PROG_A_ID);
      });

      // Verify that the query to database actually used the filter
      expect(db.activity_logs.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          programme_id: expect.objectContaining({
            [db.Sequelize.Op.in]: [PROG_A_ID]
          })
        })
      }));
    });

    test('Convener A should NOT be able to update status of an enrollment belonging to Convener B', async () => {
      req = {
        user_id: CONVENER_A_ID,
        params: { id: ENROLLMENT_B_ID },
        body: { status: 'active' }
      };

      // Mock enrollment belonging to Convener B
      db.enrollments.findOne.mockResolvedValue({
        id: ENROLLMENT_B_ID,
        cohort: {
          programme: {
            created_by: CONVENER_B_ID
          }
        }
      });

      await LearnerManagementController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Unauthorized')
      }));
    });
  });

  describe('Data Isolation', () => {
    test('Convener A should ONLY see aggregate stats for their own programmes when viewing a shared learner', async () => {
      req = {
        user_id: CONVENER_A_ID,
        params: { id: LEARNER_ID }
      };

      const PROG_A_ID = 1;
      const PROG_B_ID = 20;

      db.programmes.findAll.mockResolvedValue([{ id: PROG_A_ID }]);

      db.enrollments.findAll.mockResolvedValue([
        {
          id: 1,
          enrolled_at: new Date(),
          status: 'active',
          cohort: {
            id: 101,
            programme_id: PROG_A_ID,
            programme: { id: PROG_A_ID, name: 'Prog A' }
          }
        }
      ]);

      db.users.findByPk.mockResolvedValue({
        id: LEARNER_ID,
        first_name: 'Shared',
        last_name: 'Learner',
        email: 'shared@example.com'
      });

      ProgressService.calculateProgrammeProgress.mockResolvedValue({ progress: 50, completedLessons: 5, totalLessons: 10 });
      ProgressService.getLearnerAggregateStats.mockResolvedValue({
        totalProgrammes: 1,
        completedProgrammes: 0,
        totalLessons: 10,
        completedLessons: 5,
        overallCompletionRate: 50
      });
      db.activity_logs.findOne.mockResolvedValue({ created_at: new Date() });

      // Ensure ProgressService.getLearnerAggregateStats is called with ONLY PROG_A_ID
      await LearnerManagementController.getLearnerProfile(req, res);

      expect(ProgressService.getLearnerAggregateStats).toHaveBeenCalledWith(
        LEARNER_ID,
        [PROG_A_ID]
      );

      // Check that Prog B was not included (by virtue of ownedProgrammeIds)
    });
  });
});
