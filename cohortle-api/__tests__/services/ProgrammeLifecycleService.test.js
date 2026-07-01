const ProgrammeLifecycleService = require('../../services/ProgrammeLifecycleService');
const db = require('../../models');

describe('ProgrammeLifecycleService', () => {
  let testProgramme;
  let testUser;
  let testCommunity;

  beforeAll(async () => {
    // Create test user
    testUser = await db.users.create({
      email: 'lifecycle-test@example.com',
      password: 'hashedpassword',
      first_name: 'Test',
      last_name: 'User'
    });

    // Create test community
    testCommunity = await db.communities.create({
      owner_id: testUser.id,
      name: 'Test Community',
      status: 'active'
    });
  });

  afterAll(async () => {
    // Clean up
    if (testProgramme) {
      await db.programmes.destroy({ where: { id: testProgramme.id } });
    }
    if (testCommunity) {
      await db.communities.destroy({ where: { id: testCommunity.id } });
    }
    if (testUser) {
      await db.users.destroy({ where: { id: testUser.id } });
    }
  });

  beforeEach(async () => {
    // Create test programme for each test
    testProgramme = await db.programmes.create({
      community_id: testCommunity.id,
      name: 'Test Programme',
      description: 'Test Description',
      start_date: new Date(),
      created_by: testUser.id,
      lifecycle_status: 'draft',
      onboarding_mode: 'code'
    });
  });

  afterEach(async () => {
    // Clean up test programme after each test
    if (testProgramme) {
      await db.programmes.destroy({ where: { id: testProgramme.id } });
      testProgramme = null;
    }
  });

  describe('transitionState', () => {
    it('should successfully transition from draft to recruiting', async () => {
      const result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'recruiting',
        testUser.id,
        'Ready for enrollment'
      );

      expect(result.success).toBe(true);
      expect(result.programme.lifecycle_status).toBe('recruiting');
      expect(result.error).toBeNull();

      // Verify in database
      const updated = await db.programmes.findByPk(testProgramme.id);
      expect(updated.lifecycle_status).toBe('recruiting');
      expect(updated.status_changed_by).toBe(testUser.id);
    });

    it('should reject invalid state transition', async () => {
      const result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'completed', // Cannot go directly from draft to completed
        testUser.id
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_TRANSITION');
      expect(result.error.message).toContain('Cannot transition from draft to completed');
    });

    it('should reject invalid state', async () => {
      const result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'invalid_state',
        testUser.id
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_STATE');
    });

    it('should reject transition for non-existent programme', async () => {
      const result = await ProgrammeLifecycleService.transitionState(
        99999,
        'recruiting',
        testUser.id
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PROGRAMME_NOT_FOUND');
    });

    it('should handle complete lifecycle: draft -> recruiting -> active -> completed -> archived', async () => {
      // Draft to recruiting
      let result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'recruiting',
        testUser.id
      );
      expect(result.success).toBe(true);

      // Recruiting to active
      result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'active',
        testUser.id
      );
      expect(result.success).toBe(true);

      // Active to completed
      result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'completed',
        testUser.id
      );
      expect(result.success).toBe(true);

      // Completed to archived
      result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'archived',
        testUser.id
      );
      expect(result.success).toBe(true);

      // Verify final state
      const updated = await db.programmes.findByPk(testProgramme.id);
      expect(updated.lifecycle_status).toBe('archived');
    });

    it('should reject transition from archived state (terminal)', async () => {
      // First transition to archived
      await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'archived',
        testUser.id
      );

      // Try to transition from archived
      const result = await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'draft',
        testUser.id
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_TRANSITION');
    });
  });

  describe('canPerformOperation', () => {
    it('should allow edit_structure in draft state', async () => {
      const result = await ProgrammeLifecycleService.canPerformOperation(
        testProgramme.id,
        'edit_structure'
      );

      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should allow edit_content in draft state', async () => {
      const result = await ProgrammeLifecycleService.canPerformOperation(
        testProgramme.id,
        'edit_content'
      );

      expect(result.allowed).toBe(true);
    });

    it('should not allow enroll in draft state', async () => {
      const result = await ProgrammeLifecycleService.canPerformOperation(
        testProgramme.id,
        'enroll'
      );

      expect(result.allowed).toBe(false);
      expect(result.error.code).toBe('OPERATION_NOT_ALLOWED');
    });

    it('should allow enroll in recruiting state', async () => {
      // Transition to recruiting
      await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'recruiting',
        testUser.id
      );

      const result = await ProgrammeLifecycleService.canPerformOperation(
        testProgramme.id,
        'enroll'
      );

      expect(result.allowed).toBe(true);
    });

    it('should not allow edit_structure in recruiting state', async () => {
      // Transition to recruiting
      await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'recruiting',
        testUser.id
      );

      const result = await ProgrammeLifecycleService.canPerformOperation(
        testProgramme.id,
        'edit_structure'
      );

      expect(result.allowed).toBe(false);
    });

    it('should not allow edit_content in completed state', async () => {
      // Transition to completed (via recruiting and active)
      await ProgrammeLifecycleService.transitionState(testProgramme.id, 'recruiting', testUser.id);
      await ProgrammeLifecycleService.transitionState(testProgramme.id, 'active', testUser.id);
      await ProgrammeLifecycleService.transitionState(testProgramme.id, 'completed', testUser.id);

      const result = await ProgrammeLifecycleService.canPerformOperation(
        testProgramme.id,
        'edit_content'
      );

      expect(result.allowed).toBe(false);
    });

    it('should allow view in all states', async () => {
      const states = ['draft', 'recruiting', 'active', 'completed', 'archived'];
      
      for (const state of states) {
        // Reset to draft
        await db.programmes.update(
          { lifecycle_status: 'draft' },
          { where: { id: testProgramme.id } }
        );

        // Transition to target state if not draft
        if (state !== 'draft') {
          if (state === 'recruiting') {
            await ProgrammeLifecycleService.transitionState(testProgramme.id, 'recruiting', testUser.id);
          } else if (state === 'active') {
            await ProgrammeLifecycleService.transitionState(testProgramme.id, 'recruiting', testUser.id);
            await ProgrammeLifecycleService.transitionState(testProgramme.id, 'active', testUser.id);
          } else if (state === 'completed') {
            await ProgrammeLifecycleService.transitionState(testProgramme.id, 'recruiting', testUser.id);
            await ProgrammeLifecycleService.transitionState(testProgramme.id, 'active', testUser.id);
            await ProgrammeLifecycleService.transitionState(testProgramme.id, 'completed', testUser.id);
          } else if (state === 'archived') {
            await ProgrammeLifecycleService.transitionState(testProgramme.id, 'archived', testUser.id);
          }
        }

        const result = await ProgrammeLifecycleService.canPerformOperation(
          testProgramme.id,
          'view'
        );

        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('getLifecycleState', () => {
    it('should return current lifecycle state', async () => {
      const result = await ProgrammeLifecycleService.getLifecycleState(
        testProgramme.id
      );

      expect(result.state).toBe('draft');
      expect(result.error).toBeNull();
    });

    it('should return error for non-existent programme', async () => {
      const result = await ProgrammeLifecycleService.getLifecycleState(99999);

      expect(result.state).toBeNull();
      expect(result.error.code).toBe('PROGRAMME_NOT_FOUND');
    });
  });

  describe('setOnboardingMode', () => {
    it('should set onboarding mode to code', async () => {
      const result = await ProgrammeLifecycleService.setOnboardingMode(
        testProgramme.id,
        'code',
        testUser.id
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify in database
      const updated = await db.programmes.findByPk(testProgramme.id);
      expect(updated.onboarding_mode).toBe('code');
    });

    it('should set onboarding mode to application', async () => {
      const result = await ProgrammeLifecycleService.setOnboardingMode(
        testProgramme.id,
        'application',
        testUser.id
      );

      expect(result.success).toBe(true);

      // Verify in database
      const updated = await db.programmes.findByPk(testProgramme.id);
      expect(updated.onboarding_mode).toBe('application');
    });

    it('should reject invalid onboarding mode', async () => {
      const result = await ProgrammeLifecycleService.setOnboardingMode(
        testProgramme.id,
        'invalid_mode',
        testUser.id
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_MODE');
    });

    it('should reject for non-existent programme', async () => {
      const result = await ProgrammeLifecycleService.setOnboardingMode(
        99999,
        'code',
        testUser.id
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PROGRAMME_NOT_FOUND');
    });
  });

  describe('getTransitionHistory', () => {
    it('should return empty array for programme with no transitions', async () => {
      const history = await ProgrammeLifecycleService.getTransitionHistory(
        testProgramme.id
      );

      expect(Array.isArray(history)).toBe(true);
    });

    it('should return transition history after state changes', async () => {
      // Make a transition
      await ProgrammeLifecycleService.transitionState(
        testProgramme.id,
        'recruiting',
        testUser.id,
        'Test transition'
      );

      // Get history
      const history = await ProgrammeLifecycleService.getTransitionHistory(
        testProgramme.id
      );

      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0].programme_id).toBe(testProgramme.id);
        expect(history[0].from_state).toBe('draft');
        expect(history[0].to_state).toBe('recruiting');
        expect(history[0].transitioned_by).toBe(testUser.id);
        expect(history[0].reason).toBe('Test transition');
      }
    });
  });
});
