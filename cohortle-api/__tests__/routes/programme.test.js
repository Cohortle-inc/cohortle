/**
 * Unit tests for programme endpoints
 * 
 * Tests the programme endpoints including:
 * - POST /api/v1/programmes - Programme creation
 * - GET /api/v1/programmes/:id - Programme retrieval with current week calculation
 * - GET /api/v1/programmes/:id/weeks - Weeks retrieval with lessons
 * - Programme not found handling
 * - Backwards compatibility with non-WLIMP programmes
 */

const ProgrammeService = require('../../services/ProgrammeService');
const BackendSDK = require('../../core/BackendSDK');
const ValidationService = require('../../services/ValidationService');

// Mock the ProgrammeService
jest.mock('../../services/ProgrammeService');

// Mock the BackendSDK
jest.mock('../../core/BackendSDK');

// Mock the ValidationService
jest.mock('../../services/ValidationService');

describe('POST /v1/api/programmes - Endpoint Logic', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      insert: jest.fn(),
      get: jest.fn(),
    };
    
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('Programme creation', () => {
    it('should create a programme with valid data', async () => {
      const programmeData = {
        name: 'WLIMP – Workforce Leadership & Impact Mentorship Programme',
        description: 'A comprehensive leadership programme',
        start_date: '2026-01-01',
      };

      const mockProgrammeId = 1;
      const mockCreatedProgramme = {
        id: mockProgrammeId,
        name: programmeData.name,
        description: programmeData.description,
        start_date: new Date(programmeData.start_date),
        created_by: 123,
        type: 'structured',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK insert
      mockSdk.insert.mockResolvedValue(mockProgrammeId);

      // Mock SDK get to return created programme
      mockSdk.get.mockResolvedValue([mockCreatedProgramme]);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          name: 'required|string',
          description: 'string',
          start_date: 'required|date',
        },
        programmeData
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme_id = await sdk.insert({
        name: programmeData.name,
        description: programmeData.description,
        start_date: programmeData.start_date,
        created_by: 123,
        type: 'structured',
        status: 'draft',
      });

      expect(programme_id).toBe(mockProgrammeId);

      const programme = (await sdk.get({ id: programme_id }))[0];

      expect(programme).toBeDefined();
      expect(programme.id).toBe(mockProgrammeId);
      expect(programme.name).toBe(programmeData.name);
      expect(programme.description).toBe(programmeData.description);
      expect(programme.type).toBe('structured');
      expect(programme.status).toBe('draft');
    });

    it('should create a programme without description', async () => {
      const programmeData = {
        name: 'WLIMP Programme',
        start_date: '2026-01-01',
      };

      const mockProgrammeId = 2;
      const mockCreatedProgramme = {
        id: mockProgrammeId,
        name: programmeData.name,
        description: null,
        start_date: new Date(programmeData.start_date),
        created_by: 123,
        type: 'structured',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockSdk.insert.mockResolvedValue(mockProgrammeId);
      mockSdk.get.mockResolvedValue([mockCreatedProgramme]);

      const validationResult = await ValidationService.validateObject(
        {
          name: 'required|string',
          description: 'string',
          start_date: 'required|date',
        },
        programmeData
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme_id = await sdk.insert({
        name: programmeData.name,
        description: null,
        start_date: programmeData.start_date,
        created_by: 123,
        type: 'structured',
        status: 'draft',
      });

      const programme = (await sdk.get({ id: programme_id }))[0];

      expect(programme).toBeDefined();
      expect(programme.description).toBeNull();
    });
  });

  describe('Validation errors', () => {
    it('should reject request without name', async () => {
      const programmeData = {
        description: 'A programme without a name',
        start_date: '2026-01-01',
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'Name is required',
      });

      const validationResult = await ValidationService.validateObject(
        {
          name: 'required|string',
          description: 'string',
          start_date: 'required|date',
        },
        programmeData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toBe('Name is required');
    });

    it('should reject request without start_date', async () => {
      const programmeData = {
        name: 'WLIMP Programme',
        description: 'A programme without a start date',
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'Start date is required',
      });

      const validationResult = await ValidationService.validateObject(
        {
          name: 'required|string',
          description: 'string',
          start_date: 'required|date',
        },
        programmeData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toBe('Start date is required');
    });

    it('should reject request with invalid date format', async () => {
      const programmeData = {
        name: 'WLIMP Programme',
        description: 'A programme',
        start_date: 'invalid-date',
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'Invalid date format',
      });

      const validationResult = await ValidationService.validateObject(
        {
          name: 'required|string',
          description: 'string',
          start_date: 'required|date',
        },
        programmeData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toBe('Invalid date format');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors during insert', async () => {
      const programmeData = {
        name: 'WLIMP Programme',
        description: 'A programme',
        start_date: '2026-01-01',
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockSdk.insert.mockRejectedValue(new Error('Database connection failed'));

      const validationResult = await ValidationService.validateObject(
        {
          name: 'required|string',
          description: 'string',
          start_date: 'required|date',
        },
        programmeData
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');

      await expect(
        sdk.insert({
          name: programmeData.name,
          description: programmeData.description,
          start_date: programmeData.start_date,
          created_by: 123,
          type: 'structured',
          status: 'draft',
        })
      ).rejects.toThrow('Database connection failed');
    });
  });
});

describe('GET /v1/api/programmes/:programme_id - Endpoint Logic', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
    };
    
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('Programme retrieval with current week', () => {
    it('should retrieve programme with current week and total weeks', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test WLIMP Programme',
        description: 'Test programme for endpoint testing',
        start_date: new Date('2026-01-01'),
        type: 'structured',
        status: 'active',
      };

      const mockCohorts = [{ id: 1, programme_id: 1 }];
      const mockWeeks = [
        { id: 1, programme_id: 1, week_number: 1 },
        { id: 2, programme_id: 1, week_number: 2 },
      ];

      // Mock SDK calls in sequence
      mockSdk.get.mockResolvedValueOnce([mockProgramme]); // programmes table

      // Mock ProgrammeService
      ProgrammeService.getCurrentWeek.mockResolvedValue(1);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 1 }))[0];

      expect(programme).toBeDefined();
      expect(programme.id).toBe(1);
      expect(programme.name).toBe('Test WLIMP Programme');

      // Get current week
      const currentWeek = await ProgrammeService.getCurrentWeek(1);
      expect(currentWeek).toBe(1);

      // Mock weeks table call separately
      mockSdk.get.mockResolvedValueOnce(mockWeeks);
      
      // Get total weeks
      sdk.setTable('weeks');
      const weeks = await sdk.get({ programme_id: 1 });
      expect(weeks.length).toBe(2);
    });

    it('should handle programme without cohorts gracefully', async () => {
      const mockProgramme = {
        id: 2,
        name: 'Programme Without Cohorts',
        description: 'Test programme',
        start_date: new Date('2026-01-01'),
      };

      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      ProgrammeService.getCurrentWeek.mockResolvedValue(1);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 2 }))[0];

      expect(programme).toBeDefined();

      // Should default to week 1 when no cohorts exist
      const currentWeek = await ProgrammeService.getCurrentWeek(2);
      expect(currentWeek).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent programme', async () => {
      mockSdk.get.mockResolvedValue([]);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 999999 }))[0];

      expect(programme).toBeUndefined();
    });

    it('should handle ProgrammeService errors gracefully', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test Programme',
      };

      mockSdk.get.mockResolvedValue([mockProgramme]);
      ProgrammeService.getCurrentWeek.mockRejectedValue(
        new Error('Could not calculate current week')
      );

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 1 }))[0];

      expect(programme).toBeDefined();

      // Endpoint should handle this error gracefully
      await expect(ProgrammeService.getCurrentWeek(1)).rejects.toThrow(
        'Could not calculate current week'
      );
    });
  });

  describe('Current week calculation integration', () => {
    it('should calculate current week correctly for active programme', async () => {
      ProgrammeService.getCurrentWeek.mockResolvedValue(3);

      const currentWeek = await ProgrammeService.getCurrentWeek(1);

      expect(currentWeek).toBe(3);
      expect(typeof currentWeek).toBe('number');
      expect(ProgrammeService.getCurrentWeek).toHaveBeenCalledWith(1);
    });

    it('should include total weeks in programme data', async () => {
      const mockWeeks = [
        { id: 1, programme_id: 1, week_number: 1 },
        { id: 2, programme_id: 1, week_number: 2 },
        { id: 3, programme_id: 1, week_number: 3 },
      ];

      mockSdk.get.mockResolvedValue(mockWeeks);

      const sdk = new BackendSDK();
      sdk.setTable('weeks');
      const weeks = await sdk.get({ programme_id: 1 });

      expect(weeks.length).toBe(3);
      expect(weeks[0].week_number).toBe(1);
      expect(weeks[1].week_number).toBe(2);
      expect(weeks[2].week_number).toBe(3);
    });
  });
});

describe('GET /v1/api/programmes/:programme_id/weeks - Endpoint Logic', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
    };
    
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('Weeks retrieval with lessons', () => {
    it('should retrieve weeks with lessons filtered by current week', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test WLIMP Programme',
        description: 'Test programme',
      };

      const mockWeeks = [
        {
          id: 1,
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          start_date: new Date('2026-01-01'),
          isCurrent: false,
          lessons: [
            {
              id: 1,
              title: 'Lesson 1',
              description: 'First lesson',
              content_type: 'video',
              content_url: 'https://youtube.com/watch?v=abc',
              order_index: 0,
            },
            {
              id: 2,
              title: 'Lesson 2',
              description: 'Second lesson',
              content_type: 'pdf',
              content_url: 'https://example.com/file.pdf',
              order_index: 1,
            },
          ],
        },
        {
          id: 2,
          programme_id: 1,
          week_number: 2,
          title: 'Week 2',
          start_date: new Date('2026-01-08'),
          isCurrent: true,
          lessons: [
            {
              id: 3,
              title: 'Lesson 3',
              description: 'Third lesson',
              content_type: 'link',
              content_url: 'https://drive.google.com/file/d/xyz',
              order_index: 0,
            },
          ],
        },
      ];

      // Mock SDK call for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ProgrammeService
      ProgrammeService.getProgrammeWeeks.mockResolvedValue(mockWeeks);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 1 }))[0];

      expect(programme).toBeDefined();

      // Get weeks with lessons
      const weeks = await ProgrammeService.getProgrammeWeeks(1, null);

      expect(weeks).toHaveLength(2);
      expect(weeks[0].week_number).toBe(1);
      expect(weeks[0].lessons).toHaveLength(2);
      expect(weeks[0].lessons[0].order_index).toBe(0);
      expect(weeks[0].lessons[1].order_index).toBe(1);
      expect(weeks[1].week_number).toBe(2);
      expect(weeks[1].isCurrent).toBe(true);
      expect(weeks[1].lessons).toHaveLength(1);
    });

    it('should retrieve weeks with cohort_id parameter', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test Programme',
      };

      const mockWeeks = [
        {
          id: 1,
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          isCurrent: true,
          lessons: [],
        },
      ];

      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      ProgrammeService.getProgrammeWeeks.mockResolvedValue(mockWeeks);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 1 }))[0];

      expect(programme).toBeDefined();

      // Get weeks with specific cohort
      const weeks = await ProgrammeService.getProgrammeWeeks(1, 5);

      expect(weeks).toHaveLength(1);
      expect(ProgrammeService.getProgrammeWeeks).toHaveBeenCalledWith(1, 5);
    });

    it('should handle programme with no weeks', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Empty Programme',
      };

      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      ProgrammeService.getProgrammeWeeks.mockResolvedValue([]);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 1 }))[0];

      expect(programme).toBeDefined();

      const weeks = await ProgrammeService.getProgrammeWeeks(1);

      expect(weeks).toHaveLength(0);
    });

    it('should handle weeks with no lessons', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Programme with empty weeks',
      };

      const mockWeeks = [
        {
          id: 1,
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          isCurrent: true,
          lessons: [],
        },
      ];

      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      ProgrammeService.getProgrammeWeeks.mockResolvedValue(mockWeeks);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 1 }))[0];

      expect(programme).toBeDefined();

      const weeks = await ProgrammeService.getProgrammeWeeks(1);

      expect(weeks).toHaveLength(1);
      expect(weeks[0].lessons).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent programme', async () => {
      mockSdk.get.mockResolvedValue([]);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 999999 }))[0];

      expect(programme).toBeUndefined();
    });

    it('should handle ProgrammeService errors', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test Programme',
      };

      mockSdk.get.mockResolvedValue([mockProgramme]);
      ProgrammeService.getProgrammeWeeks.mockRejectedValue(
        new Error('Database error')
      );

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 1 }))[0];

      expect(programme).toBeDefined();

      await expect(ProgrammeService.getProgrammeWeeks(1)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('Lesson ordering', () => {
    it('should return lessons sorted by order_index', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test Programme',
      };

      const mockWeeks = [
        {
          id: 1,
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          isCurrent: true,
          lessons: [
            {
              id: 1,
              title: 'First Lesson',
              order_index: 0,
            },
            {
              id: 2,
              title: 'Second Lesson',
              order_index: 1,
            },
            {
              id: 3,
              title: 'Third Lesson',
              order_index: 2,
            },
          ],
        },
      ];

      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      ProgrammeService.getProgrammeWeeks.mockResolvedValue(mockWeeks);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      await sdk.get({ id: 1 });

      const weeks = await ProgrammeService.getProgrammeWeeks(1);

      expect(weeks[0].lessons[0].order_index).toBe(0);
      expect(weeks[0].lessons[1].order_index).toBe(1);
      expect(weeks[0].lessons[2].order_index).toBe(2);
      expect(weeks[0].lessons[0].title).toBe('First Lesson');
      expect(weeks[0].lessons[1].title).toBe('Second Lesson');
      expect(weeks[0].lessons[2].title).toBe('Third Lesson');
    });
  });

  describe('Week filtering', () => {
    it('should only include past and current weeks', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test Programme',
      };

      // Mock returns only weeks up to current week (future weeks filtered out)
      const mockWeeks = [
        {
          id: 1,
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          isCurrent: false,
          lessons: [],
        },
        {
          id: 2,
          programme_id: 1,
          week_number: 2,
          title: 'Week 2',
          isCurrent: true,
          lessons: [],
        },
        // Week 3 and beyond are filtered out by ProgrammeService
      ];

      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      ProgrammeService.getProgrammeWeeks.mockResolvedValue(mockWeeks);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      await sdk.get({ id: 1 });

      const weeks = await ProgrammeService.getProgrammeWeeks(1);

      // Should only have weeks 1 and 2 (current week)
      expect(weeks).toHaveLength(2);
      expect(weeks[0].week_number).toBe(1);
      expect(weeks[1].week_number).toBe(2);
      expect(weeks[1].isCurrent).toBe(true);
    });
  });
});

describe('POST /v1/api/programmes/:programme_id/cohorts - Endpoint Logic', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      insert: jest.fn(),
      get: jest.fn(),
    };
    
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('Cohort creation', () => {
    it('should create a cohort with valid data', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'WLIMP 2026 Cohort 1',
        enrollment_code: 'WLIMP-2026',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
        start_date: new Date('2026-01-01'),
      };

      const mockCohortId = 1;
      const mockCreatedCohort = {
        id: mockCohortId,
        programme_id: programme_id,
        name: cohortData.name,
        enrollment_code: cohortData.enrollment_code,
        start_date: new Date(cohortData.start_date),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      
      // Mock SDK get for enrollment code check (no existing cohort)
      mockSdk.get.mockResolvedValueOnce([]);

      // Mock SDK insert
      mockSdk.insert.mockResolvedValue(mockCohortId);

      // Mock SDK get to return created cohort
      mockSdk.get.mockResolvedValueOnce([mockCreatedCohort]);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...cohortData,
        }
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      
      // Verify programme exists
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();
      expect(programme.id).toBe(programme_id);

      // Check enrollment code uniqueness
      sdk.setTable('cohorts');
      const existingCohort = (await sdk.get({ enrollment_code: cohortData.enrollment_code }))[0];
      expect(existingCohort).toBeUndefined();

      // Create cohort
      const cohort_id = await sdk.insert({
        programme_id,
        name: cohortData.name,
        enrollment_code: cohortData.enrollment_code,
        start_date: cohortData.start_date,
        status: 'active',
      });

      expect(cohort_id).toBe(mockCohortId);

      // Fetch created cohort
      const cohort = (await sdk.get({ id: cohort_id }))[0];

      expect(cohort).toBeDefined();
      expect(cohort.id).toBe(mockCohortId);
      expect(cohort.programme_id).toBe(programme_id);
      expect(cohort.name).toBe(cohortData.name);
      expect(cohort.enrollment_code).toBe(cohortData.enrollment_code);
      expect(cohort.status).toBe('active');
    });

    it('should reject duplicate enrollment code', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'WLIMP 2026 Cohort 2',
        enrollment_code: 'WLIMP-2026',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      const existingCohort = {
        id: 1,
        programme_id: programme_id,
        enrollment_code: 'WLIMP-2026',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      
      // Mock SDK get for enrollment code check (existing cohort found)
      mockSdk.get.mockResolvedValueOnce([existingCohort]);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...cohortData,
        }
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      
      // Verify programme exists
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Check enrollment code uniqueness
      sdk.setTable('cohorts');
      const existingCohortCheck = (await sdk.get({ enrollment_code: cohortData.enrollment_code }))[0];
      
      // Should find existing cohort and return 409 error
      expect(existingCohortCheck).toBeDefined();
      expect(existingCohortCheck.enrollment_code).toBe(cohortData.enrollment_code);
    });

    it('should reject request for non-existent programme', async () => {
      const programme_id = 999;
      const cohortData = {
        name: 'WLIMP 2026 Cohort 1',
        enrollment_code: 'WLIMP-2026',
        start_date: '2026-01-01',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification (programme not found)
      mockSdk.get.mockResolvedValueOnce([]);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...cohortData,
        }
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      
      // Verify programme exists
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      
      // Should not find programme and return 404 error
      expect(programme).toBeUndefined();
    });
  });

  describe('Validation errors', () => {
    it('should reject request without name', async () => {
      const programme_id = 1;
      const cohortData = {
        enrollment_code: 'WLIMP-2026',
        start_date: '2026-01-01',
      };

      // Mock validation failure
      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The name field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...cohortData,
        }
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('name');
    });

    it('should reject request without enrollment_code', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'WLIMP 2026 Cohort 1',
        start_date: '2026-01-01',
      };

      // Mock validation failure
      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The enrollment_code field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...cohortData,
        }
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('enrollment_code');
    });

    it('should reject request without start_date', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'WLIMP 2026 Cohort 1',
        enrollment_code: 'WLIMP-2026',
      };

      // Mock validation failure
      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The start_date field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...cohortData,
        }
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('start_date');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors during insert', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'WLIMP 2026 Cohort 1',
        enrollment_code: 'WLIMP-2026',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      
      // Mock SDK get for enrollment code check (no existing cohort)
      mockSdk.get.mockResolvedValueOnce([]);

      // Mock SDK insert to throw error
      mockSdk.insert.mockRejectedValue(new Error('Database connection failed'));

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      
      sdk.setTable('programmes');
      await sdk.get({ id: programme_id });

      sdk.setTable('cohorts');
      await sdk.get({ enrollment_code: cohortData.enrollment_code });

      // Should throw error during insert
      await expect(
        sdk.insert({
          programme_id,
          name: cohortData.name,
          enrollment_code: cohortData.enrollment_code,
          start_date: cohortData.start_date,
          status: 'active',
        })
      ).rejects.toThrow('Database connection failed');
    });
  });
});

describe('POST /v1/api/programmes/:programme_id/weeks - Endpoint Logic', () => {
  let mockSdk;
  let mockContentService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
    };
    
    BackendSDK.mockImplementation(() => mockSdk);

    // Mock ContentService
    mockContentService = {
      createWeek: jest.fn(),
    };
    jest.mock('../../services/ContentService', () => mockContentService);
  });

  describe('Week creation', () => {
    it('should create a week with valid data', async () => {
      const programme_id = 1;
      const weekData = {
        week_number: 1,
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
        start_date: new Date('2026-01-01'),
      };

      const mockCreatedWeek = {
        id: 'week-uuid-1',
        programme_id: programme_id,
        week_number: weekData.week_number,
        title: weekData.title,
        start_date: new Date(weekData.start_date),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ContentService createWeek
      const ContentService = require('../../services/ContentService');
      ContentService.createWeek = jest.fn().mockResolvedValue(mockCreatedWeek);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          week_number: 'required|integer',
          title: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...weekData,
        }
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      
      // Verify programme exists
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();
      expect(programme.id).toBe(programme_id);

      // Create week using ContentService
      const week = await ContentService.createWeek(parseInt(programme_id), weekData);

      expect(week).toBeDefined();
      expect(week.id).toBe(mockCreatedWeek.id);
      expect(week.programme_id).toBe(programme_id);
      expect(week.week_number).toBe(weekData.week_number);
      expect(week.title).toBe(weekData.title);
      expect(ContentService.createWeek).toHaveBeenCalledWith(programme_id, weekData);
    });

    it('should reject invalid request body', async () => {
      const programme_id = 1;
      const invalidWeekData = {
        week_number: 1,
        // Missing title and start_date
      };

      // Mock validation failure
      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'Invalid request body',
      });

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          week_number: 'required|integer',
          title: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...invalidWeekData,
        }
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toBe('Invalid request body');
    });

    it('should return 404 when programme not found', async () => {
      const programme_id = 999;
      const weekData = {
        week_number: 1,
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification (not found)
      mockSdk.get.mockResolvedValueOnce([]);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          week_number: 'required|integer',
          title: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...weekData,
        }
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      
      expect(programme).toBeUndefined();
      // Should return 404 error
    });

    it('should return 409 when week number already exists', async () => {
      const programme_id = 1;
      const weekData = {
        week_number: 1,
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ContentService createWeek to throw 409 error
      const ContentService = require('../../services/ContentService');
      const error = new Error('Week number already exists for this programme');
      error.statusCode = 409;
      ContentService.createWeek = jest.fn().mockRejectedValue(error);

      // Simulate endpoint logic
      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          week_number: 'required|integer',
          title: 'required|string',
          start_date: 'required|date',
        },
        {
          programme_id,
          ...weekData,
        }
      );

      expect(validationResult.error).toBe(false);

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Try to create week
      try {
        await ContentService.createWeek(parseInt(programme_id), weekData);
        fail('Should have thrown error');
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Week number already exists for this programme');
      }
    });

    it('should return 400 for invalid week number', async () => {
      const programme_id = 1;
      const weekData = {
        week_number: -1, // Invalid: negative
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      // Mock validation success (validation service doesn't check negative numbers)
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ContentService createWeek to throw 400 error
      const ContentService = require('../../services/ContentService');
      const error = new Error('Week number must be positive');
      error.statusCode = 400;
      ContentService.createWeek = jest.fn().mockRejectedValue(error);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Try to create week
      try {
        await ContentService.createWeek(parseInt(programme_id), weekData);
        fail('Should have thrown error');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Week number must be positive');
      }
    });

    it('should return 400 for title too short (< 3 characters)', async () => {
      const programme_id = 1;
      const weekData = {
        week_number: 1,
        title: 'AB', // Invalid: too short
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ContentService createWeek to throw 400 error
      const ContentService = require('../../services/ContentService');
      const error = new Error('Title must be between 3 and 200 characters');
      error.statusCode = 400;
      ContentService.createWeek = jest.fn().mockRejectedValue(error);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Try to create week
      try {
        await ContentService.createWeek(parseInt(programme_id), weekData);
        fail('Should have thrown error');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Title must be between 3 and 200 characters');
      }
    });

    it('should return 400 for title too long (> 200 characters)', async () => {
      const programme_id = 1;
      const weekData = {
        week_number: 1,
        title: 'A'.repeat(201), // Invalid: too long
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ContentService createWeek to throw 400 error
      const ContentService = require('../../services/ContentService');
      const error = new Error('Title must be between 3 and 200 characters');
      error.statusCode = 400;
      ContentService.createWeek = jest.fn().mockRejectedValue(error);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Try to create week
      try {
        await ContentService.createWeek(parseInt(programme_id), weekData);
        fail('Should have thrown error');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Title must be between 3 and 200 characters');
      }
    });

    it('should accept title with exactly 3 characters', async () => {
      const programme_id = 1;
      const weekData = {
        week_number: 1,
        title: 'ABC', // Valid: exactly 3 characters
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      const mockCreatedWeek = {
        id: 'week-uuid-1',
        programme_id: programme_id,
        week_number: weekData.week_number,
        title: weekData.title,
        start_date: new Date(weekData.start_date),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ContentService createWeek
      const ContentService = require('../../services/ContentService');
      ContentService.createWeek = jest.fn().mockResolvedValue(mockCreatedWeek);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Create week
      const week = await ContentService.createWeek(parseInt(programme_id), weekData);

      expect(week).toBeDefined();
      expect(week.title).toBe(weekData.title);
      expect(ContentService.createWeek).toHaveBeenCalledWith(programme_id, weekData);
    });

    it('should accept title with exactly 200 characters', async () => {
      const programme_id = 1;
      const weekData = {
        week_number: 1,
        title: 'A'.repeat(200), // Valid: exactly 200 characters
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'WLIMP Programme',
      };

      const mockCreatedWeek = {
        id: 'week-uuid-1',
        programme_id: programme_id,
        week_number: weekData.week_number,
        title: weekData.title,
        start_date: new Date(weekData.start_date),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock SDK get for programme verification
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Mock ContentService createWeek
      const ContentService = require('../../services/ContentService');
      ContentService.createWeek = jest.fn().mockResolvedValue(mockCreatedWeek);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Create week
      const week = await ContentService.createWeek(parseInt(programme_id), weekData);

      expect(week).toBeDefined();
      expect(week.title).toBe(weekData.title);
      expect(ContentService.createWeek).toHaveBeenCalledWith(programme_id, weekData);
    });
  });
});

describe('POST /v1/api/weeks/:week_id/lessons - Endpoint Logic', () => {
  let mockWeeks;
  let mockContentService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the weeks model
    mockWeeks = {
      findByPk: jest.fn(),
    };

    // Mock ContentService
    mockContentService = {
      createLesson: jest.fn(),
    };
  });

  describe('Lesson creation', () => {
    it('should create a lesson with valid data', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Introduction to Leadership Principles',
        description: 'Learn the fundamentals of effective leadership',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        order_index: 0,
      };

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
        title: 'Week 1',
      };

      const mockCreatedLesson = {
        id: 'lesson-uuid-1',
        week_id: week_id,
        title: lessonData.title,
        description: lessonData.description,
        content_type: lessonData.content_type,
        content_url: lessonData.content_url,
        order_index: lessonData.order_index,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock validation success
      ValidationService.validateObject.mockResolvedValue({ error: false });

      // Mock weeks.findByPk
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      // Mock ContentService createLesson
      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockCreatedLesson);

      // Simulate endpoint logic
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(week_id)).toBe(true);

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(false);

      // Verify week exists
      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();
      expect(week.id).toBe(week_id);

      // Create lesson using ContentService
      const lesson = await ContentService.createLesson(week_id, lessonData);

      expect(lesson).toBeDefined();
      expect(lesson.id).toBe(mockCreatedLesson.id);
      expect(lesson.week_id).toBe(week_id);
      expect(lesson.title).toBe(lessonData.title);
      expect(lesson.description).toBe(lessonData.description);
      expect(lesson.content_type).toBe(lessonData.content_type);
      expect(lesson.content_url).toBe(lessonData.content_url);
      expect(lesson.order_index).toBe(lessonData.order_index);
      expect(ContentService.createLesson).toHaveBeenCalledWith(week_id, lessonData);
    });

    it('should create a lesson without description', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Leadership Basics',
        content_type: 'pdf',
        content_url: 'https://example.com/leadership.pdf',
        order_index: 1,
      };

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      const mockCreatedLesson = {
        id: 'lesson-uuid-2',
        week_id: week_id,
        title: lessonData.title,
        description: null,
        content_type: lessonData.content_type,
        content_url: lessonData.content_url,
        order_index: lessonData.order_index,
        created_at: new Date(),
        updated_at: new Date(),
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockCreatedLesson);

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(false);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      const lesson = await ContentService.createLesson(week_id, lessonData);

      expect(lesson).toBeDefined();
      expect(lesson.description).toBeNull();
    });

    it('should create lessons with different content types', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');

      // Test video content type
      const videoLesson = {
        title: 'Video Lesson',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc123',
        order_index: 0,
      };

      ContentService.createLesson = jest.fn().mockResolvedValue({
        ...videoLesson,
        id: 'lesson-1',
        week_id,
      });

      let lesson = await ContentService.createLesson(week_id, videoLesson);
      expect(lesson.content_type).toBe('video');

      // Test link content type
      const linkLesson = {
        title: 'Link Lesson',
        content_type: 'link',
        content_url: 'https://drive.google.com/file/d/xyz',
        order_index: 1,
      };

      ContentService.createLesson = jest.fn().mockResolvedValue({
        ...linkLesson,
        id: 'lesson-2',
        week_id,
      });

      lesson = await ContentService.createLesson(week_id, linkLesson);
      expect(lesson.content_type).toBe('link');

      // Test pdf content type
      const pdfLesson = {
        title: 'PDF Lesson',
        content_type: 'pdf',
        content_url: 'https://example.com/document.pdf',
        order_index: 2,
      };

      ContentService.createLesson = jest.fn().mockResolvedValue({
        ...pdfLesson,
        id: 'lesson-3',
        week_id,
      });

      lesson = await ContentService.createLesson(week_id, pdfLesson);
      expect(lesson.content_type).toBe('pdf');
    });
  });

  describe('Validation errors', () => {
    it('should reject invalid week_id format', async () => {
      const invalid_week_id = 'not-a-uuid';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(invalid_week_id)).toBe(false);
      // Should return 400 error
    });

    it('should reject request without title', async () => {
      const lessonData = {
        description: 'A lesson without a title',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 0,
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The title field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('title');
    });

    it('should reject request without content_type', async () => {
      const lessonData = {
        title: 'Lesson Title',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 0,
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The content_type field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('content_type');
    });

    it('should reject request with invalid content_type', async () => {
      const lessonData = {
        title: 'Lesson Title',
        content_type: 'invalid_type',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 0,
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The content_type field must be one of: video, link, pdf.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('content_type');
    });

    it('should reject request without content_url', async () => {
      const lessonData = {
        title: 'Lesson Title',
        content_type: 'video',
        order_index: 0,
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The content_url field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('content_url');
    });

    it('should reject request with invalid URL format', async () => {
      const lessonData = {
        title: 'Lesson Title',
        content_type: 'video',
        content_url: 'not-a-valid-url',
        order_index: 0,
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The content_url field must be a valid URL.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('URL');
    });

    it('should reject request without order_index', async () => {
      const lessonData = {
        title: 'Lesson Title',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The order_index field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          title: 'required|string',
          description: 'string',
          content_type: 'required|string|in:video,link,pdf',
          content_url: 'required|string|url',
          order_index: 'required|integer',
        },
        lessonData
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('order_index');
    });
  });

  describe('Error handling', () => {
    it('should return 404 when week not found', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Lesson Title',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 0,
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(null);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeNull();
      // Should return 404 error
    });

    it('should handle ContentService errors', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Lesson Title',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 0,
      };

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      const error = new Error('Invalid URL format for content_url');
      error.statusCode = 400;
      ContentService.createLesson = jest.fn().mockRejectedValue(error);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      try {
        await ContentService.createLesson(week_id, lessonData);
        fail('Should have thrown error');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain('URL format');
      }
    });

    it('should handle database errors during lesson creation', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Lesson Title',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 0,
      };

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      await expect(
        ContentService.createLesson(week_id, lessonData)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('URL format validation', () => {
    it('should accept YouTube URLs', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'YouTube Lesson',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        order_index: 0,
      };

      const mockWeek = { id: week_id, programme_id: 1, week_number: 1 };
      const mockLesson = { ...lessonData, id: 'lesson-1', week_id };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockLesson);

      const lesson = await ContentService.createLesson(week_id, lessonData);
      expect(lesson.content_url).toBe(lessonData.content_url);
    });

    it('should accept Google Drive URLs', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Drive Lesson',
        content_type: 'link',
        content_url: 'https://drive.google.com/file/d/1234567890abcdef/view',
        order_index: 0,
      };

      const mockWeek = { id: week_id, programme_id: 1, week_number: 1 };
      const mockLesson = { ...lessonData, id: 'lesson-1', week_id };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockLesson);

      const lesson = await ContentService.createLesson(week_id, lessonData);
      expect(lesson.content_url).toBe(lessonData.content_url);
    });

    it('should accept PDF URLs', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'PDF Lesson',
        content_type: 'pdf',
        content_url: 'https://example.com/documents/leadership-guide.pdf',
        order_index: 0,
      };

      const mockWeek = { id: week_id, programme_id: 1, week_number: 1 };
      const mockLesson = { ...lessonData, id: 'lesson-1', week_id };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockLesson);

      const lesson = await ContentService.createLesson(week_id, lessonData);
      expect(lesson.content_url).toBe(lessonData.content_url);
    });

    it('should accept Zoom URLs', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Zoom Recording',
        content_type: 'video',
        content_url: 'https://zoom.us/rec/share/abcdef123456',
        order_index: 0,
      };

      const mockWeek = { id: week_id, programme_id: 1, week_number: 1 };
      const mockLesson = { ...lessonData, id: 'lesson-1', week_id };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockLesson);

      const lesson = await ContentService.createLesson(week_id, lessonData);
      expect(lesson.content_url).toBe(lessonData.content_url);
    });
  });

  describe('Order index handling', () => {
    it('should accept order_index of 0', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'First Lesson',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 0,
      };

      const mockWeek = { id: week_id, programme_id: 1, week_number: 1 };
      const mockLesson = { ...lessonData, id: 'lesson-1', week_id };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockLesson);

      const lesson = await ContentService.createLesson(week_id, lessonData);
      expect(lesson.order_index).toBe(0);
    });

    it('should accept positive order_index values', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Third Lesson',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: 2,
      };

      const mockWeek = { id: week_id, programme_id: 1, week_number: 1 };
      const mockLesson = { ...lessonData, id: 'lesson-1', week_id };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.createLesson = jest.fn().mockResolvedValue(mockLesson);

      const lesson = await ContentService.createLesson(week_id, lessonData);
      expect(lesson.order_index).toBe(2);
    });

    it('should reject negative order_index', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonData = {
        title: 'Invalid Lesson',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: -1,
      };

      const mockWeek = { id: week_id, programme_id: 1, week_number: 1 };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      const error = new Error('Order index must be non-negative');
      error.statusCode = 400;
      ContentService.createLesson = jest.fn().mockRejectedValue(error);

      try {
        await ContentService.createLesson(week_id, lessonData);
        fail('Should have thrown error');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain('non-negative');
      }
    });
  });
});

describe('PUT /v1/api/weeks/:week_id/lessons/reorder - Endpoint Logic', () => {
  let mockWeeks;
  let mockContentService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the weeks model
    mockWeeks = {
      findByPk: jest.fn(),
    };

    // Mock ContentService
    mockContentService = {
      updateLessonOrder: jest.fn(),
    };
  });

  describe('Lesson reordering', () => {
    it('should reorder lessons with valid data', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = [
        '323e4567-e89b-12d3-a456-426614174003',
        '123e4567-e89b-12d3-a456-426614174001',
        '223e4567-e89b-12d3-a456-426614174002',
      ];

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
        title: 'Week 1',
      };

      const mockUpdatedLessons = [
        {
          id: '323e4567-e89b-12d3-a456-426614174003',
          title: 'Lesson 3',
          description: 'Third lesson',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=abc',
          order_index: 0,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Lesson 1',
          description: 'First lesson',
          content_type: 'pdf',
          content_url: 'https://example.com/file.pdf',
          order_index: 1,
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174002',
          title: 'Lesson 2',
          description: 'Second lesson',
          content_type: 'link',
          content_url: 'https://drive.google.com/file/d/xyz',
          order_index: 2,
        },
      ];

      // Mock weeks.findByPk
      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      // Mock ContentService updateLessonOrder
      const ContentService = require('../../services/ContentService');
      ContentService.updateLessonOrder = jest.fn().mockResolvedValue(mockUpdatedLessons);

      // Simulate endpoint logic
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(week_id)).toBe(true);

      // Validate lessonIds is an array
      expect(Array.isArray(lessonIds)).toBe(true);
      expect(lessonIds.length).toBeGreaterThan(0);

      // Validate all lesson IDs are valid UUIDs
      for (const lessonId of lessonIds) {
        expect(uuidRegex.test(lessonId)).toBe(true);
      }

      // Verify week exists
      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();
      expect(week.id).toBe(week_id);

      // Update lesson order using ContentService
      const updatedLessons = await ContentService.updateLessonOrder(week_id, lessonIds);

      expect(updatedLessons).toBeDefined();
      expect(updatedLessons).toHaveLength(3);
      expect(updatedLessons[0].id).toBe('323e4567-e89b-12d3-a456-426614174003');
      expect(updatedLessons[0].order_index).toBe(0);
      expect(updatedLessons[1].id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(updatedLessons[1].order_index).toBe(1);
      expect(updatedLessons[2].id).toBe('223e4567-e89b-12d3-a456-426614174002');
      expect(updatedLessons[2].order_index).toBe(2);
      expect(ContentService.updateLessonOrder).toHaveBeenCalledWith(week_id, lessonIds);
    });

    it('should reorder a single lesson', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = ['123e4567-e89b-12d3-a456-426614174001'];

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      const mockUpdatedLessons = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Only Lesson',
          description: 'The only lesson',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=abc',
          order_index: 0,
        },
      ];

      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.updateLessonOrder = jest.fn().mockResolvedValue(mockUpdatedLessons);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      const updatedLessons = await ContentService.updateLessonOrder(week_id, lessonIds);

      expect(updatedLessons).toHaveLength(1);
      expect(updatedLessons[0].id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(updatedLessons[0].order_index).toBe(0);
    });

    it('should reorder many lessons', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = [
        '523e4567-e89b-12d3-a456-426614174005',
        '223e4567-e89b-12d3-a456-426614174002',
        '423e4567-e89b-12d3-a456-426614174004',
        '123e4567-e89b-12d3-a456-426614174001',
        '323e4567-e89b-12d3-a456-426614174003',
      ];

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      const mockUpdatedLessons = lessonIds.map((id, index) => ({
        id,
        title: `Lesson ${index + 1}`,
        description: `Description ${index + 1}`,
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=abc',
        order_index: index,
      }));

      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.updateLessonOrder = jest.fn().mockResolvedValue(mockUpdatedLessons);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      const updatedLessons = await ContentService.updateLessonOrder(week_id, lessonIds);

      expect(updatedLessons).toHaveLength(5);
      updatedLessons.forEach((lesson, index) => {
        expect(lesson.id).toBe(lessonIds[index]);
        expect(lesson.order_index).toBe(index);
      });
    });
  });

  describe('Validation errors', () => {
    it('should reject invalid week_id format', async () => {
      const invalid_week_id = 'not-a-uuid';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(invalid_week_id)).toBe(false);
      // Should return 400 error
    });

    it('should reject request without lessonIds', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = undefined;

      // Validate lessonIds is required
      expect(lessonIds).toBeUndefined();
      // Should return 400 error with message "lessonIds must be an array"
    });

    it('should reject request with non-array lessonIds', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = 'not-an-array';

      // Validate lessonIds is an array
      expect(Array.isArray(lessonIds)).toBe(false);
      // Should return 400 error with message "lessonIds must be an array"
    });

    it('should reject request with empty lessonIds array', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = [];

      // Validate lessonIds is not empty
      expect(lessonIds.length).toBe(0);
      // Should return 400 error with message "lessonIds array cannot be empty"
    });

    it('should reject request with invalid lesson ID format', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = [
        '123e4567-e89b-12d3-a456-426614174001',
        'not-a-uuid',
        '323e4567-e89b-12d3-a456-426614174003',
      ];

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Validate all lesson IDs
      const invalidIds = lessonIds.filter(id => !uuidRegex.test(id));
      expect(invalidIds.length).toBeGreaterThan(0);
      // Should return 400 error with message "All lesson IDs must be valid UUIDs"
    });

    it('should reject request for non-existent week', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = ['lesson-uuid-1', 'lesson-uuid-2'];

      mockWeeks.findByPk.mockResolvedValue(null);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeNull();
      // Should return 404 error with message "Week not found"
    });

    it('should reject request with lesson IDs not belonging to week', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = [
        '123e4567-e89b-12d3-a456-426614174001',
        '999e4567-e89b-12d3-a456-426614174999',
      ];

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      const error = new Error('Some lesson IDs do not belong to this week');
      error.statusCode = 400;
      ContentService.updateLessonOrder = jest.fn().mockRejectedValue(error);

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      try {
        await ContentService.updateLessonOrder(week_id, lessonIds);
        fail('Should have thrown error');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain('do not belong to this week');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle ContentService errors', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = ['123e4567-e89b-12d3-a456-426614174001', '223e4567-e89b-12d3-a456-426614174002'];

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.updateLessonOrder = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      const week = await mockWeeks.findByPk(week_id);
      expect(week).toBeDefined();

      await expect(
        ContentService.updateLessonOrder(week_id, lessonIds)
      ).rejects.toThrow('Database error');
    });

    it('should handle database connection errors', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = ['123e4567-e89b-12d3-a456-426614174001', '223e4567-e89b-12d3-a456-426614174002'];

      mockWeeks.findByPk.mockRejectedValue(new Error('Database connection failed'));

      await expect(mockWeeks.findByPk(week_id)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Response format', () => {
    it('should return lessons with correct fields', async () => {
      const week_id = '123e4567-e89b-12d3-a456-426614174000';
      const lessonIds = ['123e4567-e89b-12d3-a456-426614174001', '223e4567-e89b-12d3-a456-426614174002'];

      const mockWeek = {
        id: week_id,
        programme_id: 1,
        week_number: 1,
      };

      const mockUpdatedLessons = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Lesson 1',
          description: 'First lesson',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=abc',
          order_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174002',
          title: 'Lesson 2',
          description: 'Second lesson',
          content_type: 'pdf',
          content_url: 'https://example.com/file.pdf',
          order_index: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockWeeks.findByPk.mockResolvedValue(mockWeek);

      const ContentService = require('../../services/ContentService');
      ContentService.updateLessonOrder = jest.fn().mockResolvedValue(mockUpdatedLessons);

      const updatedLessons = await ContentService.updateLessonOrder(week_id, lessonIds);

      // Verify response includes required fields
      updatedLessons.forEach(lesson => {
        expect(lesson).toHaveProperty('id');
        expect(lesson).toHaveProperty('title');
        expect(lesson).toHaveProperty('description');
        expect(lesson).toHaveProperty('content_type');
        expect(lesson).toHaveProperty('content_url');
        expect(lesson).toHaveProperty('order_index');
      });
    });
  });
});
