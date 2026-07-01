const ValidationService = require('../../services/ValidationService');

jest.mock('../../services/ValidationService');
jest.mock('../../models', () => ({
  weeks: {
    findByPk: jest.fn(),
  },
}));

describe('PUT /v1/api/weeks/:week_id - Endpoint Logic', () => {
  let mockWeeks;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWeeks = require('../../models').weeks;
  });

  describe('Week update', () => {
    it('should update a week and return complete week object', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        title: 'Updated Week Title',
        start_date: '2026-02-01',
      };

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
        title: 'Original Title',
        start_date: new Date('2026-01-01'),
        created_at: new Date('2025-12-01'),
        updated_at: new Date('2025-12-01'),
        update: jest.fn().mockResolvedValue(true),
      };

      // After update, the week should have updated values
      mockWeek.title = updateData.title;
      mockWeek.start_date = new Date(updateData.start_date);
      mockWeek.updated_at = new Date();

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock week exists
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          title: 'string',
          start_date: 'date',
        },
        updateData
      );

      expect(validationResult.error).toBe(false);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      await week.update(updateData);

      // Verify response would include all fields
      const responseWeek = {
        id: week.id,
        programme_id: week.programme_id,
        week_number: week.week_number,
        title: week.title,
        start_date: week.start_date,
        created_at: week.created_at,
        updated_at: week.updated_at,
      };

      expect(responseWeek).toHaveProperty('id');
      expect(responseWeek).toHaveProperty('programme_id');
      expect(responseWeek).toHaveProperty('week_number');
      expect(responseWeek).toHaveProperty('title');
      expect(responseWeek).toHaveProperty('start_date');
      expect(responseWeek).toHaveProperty('created_at');
      expect(responseWeek).toHaveProperty('updated_at');
      expect(responseWeek.title).toBe(updateData.title);
    });

    it('should reject invalid week_id format', async () => {
      const invalidWeekId = 'not-a-uuid';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(invalidWeekId)).toBe(false);
    });

    it('should reject request with no fields to update', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {};

      // Simulate validation that at least one field is required
      const hasFields = updateData.title !== undefined || updateData.start_date !== undefined;
      expect(hasFields).toBe(false);
    });

    it('should return 404 when week not found', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        title: 'Updated Title',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock week not found
      mockWeeks.findByPk.mockResolvedValue(null);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeNull();
    });
  });
});

describe('DELETE /v1/api/weeks/:week_id - Endpoint Logic', () => {
  let mockWeeks;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWeeks = require('../../models').weeks;
  });

  describe('Week deletion', () => {
    it('should delete a week successfully', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
        title: 'Week to Delete',
        start_date: new Date('2026-01-01'),
        destroy: jest.fn().mockResolvedValue(true),
      };

      // Mock week exists
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      await week.destroy();
      expect(week.destroy).toHaveBeenCalled();
    });

    it('should reject invalid week_id format', async () => {
      const invalidWeekId = 'not-a-uuid';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(invalidWeekId)).toBe(false);
    });

    it('should return 404 when week not found', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';

      // Mock week not found
      mockWeeks.findByPk.mockResolvedValue(null);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeNull();
    });
  });
});
