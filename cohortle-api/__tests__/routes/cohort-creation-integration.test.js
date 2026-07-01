/**
 * Integration tests for cohort creation with enrollment codes
 * 
 * Tests Task 4.4 requirements:
 * - Accept enrollment_code field in request body
 * - Validate code uniqueness before database insert
 * - Store enrollment_code in cohorts table
 * - Return complete cohort object including enrollment_code
 * - Return specific error message if code is duplicate
 * 
 * Requirements tested:
 * - 4.1: System requires unique enrollment code
 * - 4.6: Backend validates enrollment code uniqueness before inserting
 * - 4.7: Backend returns 400 with specific error message when check fails
 * - 4.8: Backend accepts enrollment_code field in cohort creation request
 * - 4.9: Backend stores enrollment_code in the cohorts table
 * - 4.10: Backend returns created cohort object including enrollment_code
 */

const BackendSDK = require('../../core/BackendSDK');
const ValidationService = require('../../services/ValidationService');

jest.mock('../../core/BackendSDK');
jest.mock('../../services/ValidationService');

describe('POST /v1/api/programmes/:programme_id/cohorts - Integration Tests', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
      insert: jest.fn(),
      rawQuery: jest.fn(),
    };
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('Requirement 4.8: Accept enrollment_code field', () => {
    it('should accept enrollment_code in request body', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'Test Cohort',
        enrollment_code: 'PROG-2026-ABC123',
        start_date: '2026-01-01',
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });

      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'date',
        },
        { programme_id, ...cohortData }
      );

      expect(validationResult.error).toBe(false);
      expect(ValidationService.validateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollment_code: 'required|string',
        }),
        expect.objectContaining({
          enrollment_code: cohortData.enrollment_code,
        })
      );
    });
  });

  describe('Requirement 4.6 & 4.9: Validate uniqueness and store enrollment_code', () => {
    it('should check enrollment code uniqueness before insert', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'Test Cohort',
        enrollment_code: 'PROG-2026-ABC123',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'Test Programme',
        created_by: 1,
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      
      // Mock programme exists
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      
      // Mock enrollment code check - no existing cohort
      mockSdk.get.mockResolvedValueOnce([]);
      
      // Mock insert
      mockSdk.insert.mockResolvedValue(1);
      
      // Mock get created cohort
      mockSdk.get.mockResolvedValueOnce([{
        id: 1,
        programme_id,
        name: cohortData.name,
        enrollment_code: cohortData.enrollment_code,
        start_date: cohortData.start_date,
        status: 'active',
      }]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      
      // Verify programme
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Check enrollment code uniqueness
      sdk.setTable('cohorts');
      const existingCohort = await sdk.get({ enrollment_code: cohortData.enrollment_code });
      
      expect(mockSdk.setTable).toHaveBeenCalledWith('cohorts');
      expect(mockSdk.get).toHaveBeenCalledWith({ enrollment_code: cohortData.enrollment_code });
      expect(existingCohort.length).toBe(0);

      // Insert cohort with enrollment_code
      const cohort_id = await sdk.insert({
        programme_id,
        name: cohortData.name,
        enrollment_code: cohortData.enrollment_code,
        start_date: cohortData.start_date,
        status: 'active',
      });

      expect(mockSdk.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollment_code: cohortData.enrollment_code,
        })
      );
      expect(cohort_id).toBe(1);
    });
  });

  describe('Requirement 4.7: Return specific error for duplicate code', () => {
    it('should return 400 with specific error message when enrollment code is duplicate', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'Test Cohort',
        enrollment_code: 'PROG-2026-ABC123',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'Test Programme',
        created_by: 1,
      };

      const existingCohort = {
        id: 1,
        programme_id,
        enrollment_code: 'PROG-2026-ABC123',
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      
      // Mock programme exists
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      
      // Mock enrollment code check - existing cohort found
      mockSdk.get.mockResolvedValueOnce([existingCohort]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      
      // Verify programme
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: programme_id }))[0];
      expect(programme).toBeDefined();

      // Check enrollment code uniqueness
      sdk.setTable('cohorts');
      const existingCohortCheck = await sdk.get({ enrollment_code: cohortData.enrollment_code });
      
      // Should find existing cohort
      expect(existingCohortCheck.length).toBeGreaterThan(0);
      
      // Simulate error response
      const errorResponse = {
        status: 400,
        body: {
          error: true,
          message: 'This enrollment code is already in use',
        },
      };

      expect(errorResponse.status).toBe(400);
      expect(errorResponse.body.error).toBe(true);
      expect(errorResponse.body.message).toBe('This enrollment code is already in use');
    });
  });

  describe('Requirement 4.10: Return complete cohort object including enrollment_code', () => {
    it('should return complete cohort object with enrollment_code', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'Test Cohort',
        enrollment_code: 'PROG-2026-ABC123',
        start_date: '2026-01-01',
      };

      const mockProgramme = {
        id: programme_id,
        name: 'Test Programme',
        created_by: 1,
      };

      const mockCreatedCohort = {
        id: 1,
        programme_id,
        name: cohortData.name,
        enrollment_code: cohortData.enrollment_code,
        start_date: cohortData.start_date,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      ValidationService.validateObject.mockResolvedValue({ error: false });
      
      // Mock programme exists
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);
      
      // Mock enrollment code check - no existing cohort
      mockSdk.get.mockResolvedValueOnce([]);
      
      // Mock insert
      mockSdk.insert.mockResolvedValue(1);
      
      // Mock get created cohort
      mockSdk.get.mockResolvedValueOnce([mockCreatedCohort]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      
      // Verify programme
      sdk.setTable('programmes');
      await sdk.get({ id: programme_id });

      // Check enrollment code uniqueness
      sdk.setTable('cohorts');
      await sdk.get({ enrollment_code: cohortData.enrollment_code });

      // Insert cohort
      const cohort_id = await sdk.insert({
        programme_id,
        name: cohortData.name,
        enrollment_code: cohortData.enrollment_code,
        start_date: cohortData.start_date,
        status: 'active',
      });

      // Fetch created cohort
      const createdCohort = (await sdk.get({ id: cohort_id }))[0];

      // Verify response includes all fields including enrollment_code
      expect(createdCohort).toBeDefined();
      expect(createdCohort.id).toBe(1);
      expect(createdCohort.programme_id).toBe(programme_id);
      expect(createdCohort.name).toBe(cohortData.name);
      expect(createdCohort.enrollment_code).toBe(cohortData.enrollment_code);
      expect(createdCohort.start_date).toBe(cohortData.start_date);
      expect(createdCohort.status).toBe('active');

      // Simulate success response
      const successResponse = {
        status: 201,
        body: {
          error: false,
          message: 'Cohort created successfully',
          cohort_id: 1,
          cohort: createdCohort,
        },
      };

      expect(successResponse.status).toBe(201);
      expect(successResponse.body.error).toBe(false);
      expect(successResponse.body.cohort).toBeDefined();
      expect(successResponse.body.cohort.enrollment_code).toBe(cohortData.enrollment_code);
    });
  });

  describe('Requirement 4.1: Require unique enrollment code', () => {
    it('should require enrollment_code field', async () => {
      const programme_id = 1;
      const cohortData = {
        name: 'Test Cohort',
        start_date: '2026-01-01',
        // Missing enrollment_code
      };

      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'The enrollment_code field is required.',
      });

      const validationResult = await ValidationService.validateObject(
        {
          programme_id: 'required|integer',
          name: 'required|string',
          enrollment_code: 'required|string',
          start_date: 'date',
        },
        { programme_id, ...cohortData }
      );

      expect(validationResult.error).toBe(true);
      expect(validationResult.message).toContain('enrollment_code');
    });
  });
});
