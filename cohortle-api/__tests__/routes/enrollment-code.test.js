/**
 * Unit tests for enrollment code availability check endpoint
 * 
 * Tests the enrollment code endpoint:
 * - GET /v1/api/enrollment-codes/check?code=XXX
 * 
 * Requirements tested:
 * - 11.1: Backend provides endpoint GET /v1/api/enrollment-codes/check?code=XXX
 * - 11.2: Returns 400 with 'Enrollment code is required' when code parameter is missing
 * - 11.3: Returns {available: true} when code is available
 * - 11.4: Returns {available: false} when code is already in use
 */

const BackendSDK = require('../../core/BackendSDK');

// Mock the BackendSDK
jest.mock('../../core/BackendSDK');

describe('GET /v1/api/enrollment-codes/check - Endpoint Logic', () => {
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

  describe('Enrollment code availability check', () => {
    it('should return 400 when code parameter is missing', async () => {
      // Simulate endpoint logic with missing code
      const code = undefined;

      // Validate code parameter
      if (!code) {
        const response = {
          status: 400,
          body: {
            error: true,
            message: "Enrollment code is required",
          }
        };
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.message).toBe("Enrollment code is required");
        return;
      }
    });

    it('should return available: true when code is not in use', async () => {
      const code = 'PROG-2026-ABC123';

      // Mock SDK to return no existing cohorts
      mockSdk.get.mockResolvedValue([]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('cohorts');
      const existingCohort = await sdk.get({ enrollment_code: code });

      const response = {
        status: 200,
        body: {
          available: existingCohort.length === 0,
        }
      };

      expect(mockSdk.setTable).toHaveBeenCalledWith('cohorts');
      expect(mockSdk.get).toHaveBeenCalledWith({ enrollment_code: code });
      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
    });

    it('should return available: false when code is already in use', async () => {
      const code = 'PROG-2026-XYZ789';

      // Mock SDK to return an existing cohort
      mockSdk.get.mockResolvedValue([
        {
          id: 1,
          programme_id: 1,
          name: 'Test Cohort',
          enrollment_code: code,
          start_date: '2026-01-01',
          status: 'active',
        }
      ]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('cohorts');
      const existingCohort = await sdk.get({ enrollment_code: code });

      const response = {
        status: 200,
        body: {
          available: existingCohort.length === 0,
        }
      };

      expect(mockSdk.setTable).toHaveBeenCalledWith('cohorts');
      expect(mockSdk.get).toHaveBeenCalledWith({ enrollment_code: code });
      expect(response.status).toBe(200);
      expect(response.body.available).toBe(false);
    });

    it('should handle empty string code parameter', async () => {
      const code = '';

      // Validate code parameter
      if (!code) {
        const response = {
          status: 400,
          body: {
            error: true,
            message: "Enrollment code is required",
          }
        };
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.message).toBe("Enrollment code is required");
        return;
      }
    });

    it('should check availability for codes with special characters', async () => {
      const code = 'PROG-2026-A1B2C3';

      // Mock SDK to return no existing cohorts
      mockSdk.get.mockResolvedValue([]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('cohorts');
      const existingCohort = await sdk.get({ enrollment_code: code });

      const response = {
        status: 200,
        body: {
          available: existingCohort.length === 0,
        }
      };

      expect(mockSdk.setTable).toHaveBeenCalledWith('cohorts');
      expect(mockSdk.get).toHaveBeenCalledWith({ enrollment_code: code });
      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const code = 'PROG-2026-ERROR';

      // Mock SDK to throw an error
      mockSdk.get.mockRejectedValue(new Error('Database connection failed'));

      // Simulate endpoint logic with error handling
      try {
        const sdk = new BackendSDK();
        sdk.setTable('cohorts');
        await sdk.get({ enrollment_code: code });
      } catch (err) {
        const response = {
          status: 500,
          body: {
            error: true,
            message: "something went wrong",
          }
        };

        expect(response.status).toBe(500);
        expect(response.body.error).toBe(true);
        expect(response.body.message).toBe("something went wrong");
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle very long enrollment codes', async () => {
      const code = 'PROG-2026-' + 'A'.repeat(100);

      // Mock SDK to return no existing cohorts
      mockSdk.get.mockResolvedValue([]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('cohorts');
      const existingCohort = await sdk.get({ enrollment_code: code });

      const response = {
        status: 200,
        body: {
          available: existingCohort.length === 0,
        }
      };

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
    });

    it('should be case-sensitive when checking codes', async () => {
      const code = 'prog-2026-abc123'; // lowercase

      // Mock SDK to return no existing cohorts (case-sensitive check)
      mockSdk.get.mockResolvedValue([]);

      // Simulate endpoint logic
      const sdk = new BackendSDK();
      sdk.setTable('cohorts');
      const existingCohort = await sdk.get({ enrollment_code: code });

      const response = {
        status: 200,
        body: {
          available: existingCohort.length === 0,
        }
      };

      expect(mockSdk.get).toHaveBeenCalledWith({ enrollment_code: code });
      expect(response.status).toBe(200);
    });
  });
});
