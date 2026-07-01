const ProgressService = require('../../services/ProgressService');
const LearnerManagementController = require('../../controllers/LearnerManagementController');
const db = require('../../models');

// Mock dependencies
jest.mock('../../models');
jest.mock('../../services/ProgressService');

describe('Phase 2 Backend Verification', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user_id: 1, // convener
      params: { id: 100 }, // learner
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('LearnerManagementController.getLearnerProfile', () => {
    it('should return learner profile if authorized', async () => {
      db.programmes.findAll.mockResolvedValue([{ id: 10 }, { id: 11 }]);
      db.enrollments.findAll.mockResolvedValue([
        {
          enrolled_at: new Date(),
          status: 'active',
          cohort: {
            id: 1,
            programme_id: 10,
            programme: { id: 10, name: 'Prog 1' }
          }
        }
      ]);
      db.users.findByPk.mockResolvedValue({
        id: 100,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      });
      ProgressService.calculateProgrammeProgress.mockResolvedValue({ progress: 80, completedLessons: 8, totalLessons: 10 });
      ProgressService.getLearnerAggregateStats.mockResolvedValue({
        totalProgrammes: 1,
        completedProgrammes: 0,
        totalLessons: 10,
        completedLessons: 8,
        overallCompletionRate: 80
      });
      db.activity_logs.findOne.mockResolvedValue({ created_at: new Date() });

      await LearnerManagementController.getLearnerProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.error).toBe(false);
      expect(response.profile.name).toBe('John Doe');
      expect(response.profile.stats.overall_completion_rate).toBe(80);
      expect(response.profile.profilePicture).toBeDefined();
    });

    it('should return 403 if learner not in convener programmes', async () => {
      db.programmes.findAll.mockResolvedValue([{ id: 10 }]);
      db.users.findByPk.mockResolvedValue({ id: 100 });
      db.enrollments.findAll.mockResolvedValue([]); // No enrollments in owned programmes

      await LearnerManagementController.getLearnerProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 if learner does not exist', async () => {
      db.programmes.findAll.mockResolvedValue([{ id: 10 }]);
      db.users.findByPk.mockResolvedValue(null);

      await LearnerManagementController.getLearnerProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle zero activity gracefully', async () => {
      db.programmes.findAll.mockResolvedValue([{ id: 10 }]);
      db.users.findByPk.mockResolvedValue({ id: 100 });
      db.enrollments.findAll.mockResolvedValue([{
        cohort: { id: 1, programme_id: 10, programme: { id: 10, name: 'P1' } }
      }]);
      ProgressService.calculateProgrammeProgress.mockResolvedValue({ progress: 0, completedLessons: 0, totalLessons: 10 });
      ProgressService.getLearnerAggregateStats.mockResolvedValue({ totalProgrammes: 1, completedProgrammes: 0, totalLessons: 10, completedLessons: 0, overallCompletionRate: 0 });
      db.activity_logs.findOne.mockResolvedValue(null);

      await LearnerManagementController.getLearnerProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.profile.stats.last_activity_at).toBeNull();
    });
  });
});
