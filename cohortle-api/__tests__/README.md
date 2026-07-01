# WLIMP Property-Based Tests

This directory contains property-based tests for the WLIMP Programme Rollout feature using `fast-check`.

## Prerequisites

1. **MySQL Database**: Ensure MySQL is running on your local machine
2. **Environment Variables**: Configure your `.env` file with database credentials

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create and Setup Test Database

Run the setup script to create the test database and apply all migrations:

```bash
npm run test:setup
```

This will:
- Create a test database (default: `cohortle_test`)
- Run all migrations on the test database
- Prepare the database for property-based tests

### 3. Configure Test Database (Optional)

By default, the test database uses these settings:
- **Database**: `cohortle_test`
- **Host**: `127.0.0.1`
- **Port**: `3306`
- **User**: `root`
- **Password**: `root1234`

To customize, set these environment variables in your `.env` file:

```env
DB_TEST_DATABASE=cohortle_test
DB_HOSTNAME=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
```

## Running Tests

### Run All Property-Based Tests

```bash
npm run test:pbt
```

### Run Specific Test File

```bash
npm test -- __tests__/wlimp/programmeCreation.pbt.js
```

### Run All Tests (Unit + Property-Based)

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Structure

### Property-Based Tests

Property-based tests are located in `__tests__/wlimp/` and follow the naming convention `*.pbt.js`.

Each test:
- Runs 100 iterations with randomly generated data
- Tests universal properties that should hold for all valid inputs
- Uses transaction-based isolation for data cleanup
- References specific requirements from the design document

### Test Helpers

The `__tests__/helpers/testSetup.js` file provides:
- Database connection management
- Transaction handling for test isolation
- Test data creation utilities
- Cleanup functions

## Current Tests

### 1. Programme Creation Round Trip (`programmeCreation.pbt.js`)

**Property**: For any valid programme data (name, description, start date), creating a programme and then retrieving it should return an equivalent programme with all fields preserved.

**Validates**: Requirements 1.1

**Runs**: 100 iterations with randomly generated:
- Programme names (1-255 characters)
- Descriptions (0-1000 characters, nullable)
- Start dates (2020-2030, nullable)
- End dates (2020-2030, nullable)
- Programme types (scheduled, structured, self_paced)

## Troubleshooting

### Database Connection Errors

If you see `ECONNREFUSED` errors:
1. Ensure MySQL is running: `mysql -u root -p`
2. Check your database credentials in `.env`
3. Verify the database exists: `SHOW DATABASES;`

### Migration Errors

If migrations fail:
1. Check migration status: `npm run migrate:status`
2. Manually run migrations: `NODE_ENV=test npm run migrate`
3. Reset migrations if needed: `npm run migrate:undo`

### Test Cleanup Issues

If tests leave behind data:
1. The tests use automatic cleanup after each run
2. Manually clean test data: `DROP DATABASE cohortle_test; CREATE DATABASE cohortle_test;`
3. Re-run setup: `npm run test:setup`

## Best Practices

1. **Always run `npm run test:setup` before first test run**
2. **Tests are isolated** - each test cleans up its own data
3. **Tests are deterministic** - same input always produces same result
4. **Tests are safe to run repeatedly** - no side effects on production data
5. **Use the test database** - never run tests against production

## Adding New Property Tests

1. Create a new file in `__tests__/wlimp/` with `.pbt.js` extension
2. Import test helpers from `../helpers/testSetup.js`
3. Use `fc.assert()` with `fc.asyncProperty()` for async tests
4. Set `numRuns: 100` for comprehensive coverage
5. Reference the property and requirements in comments
6. Clean up test data in `afterAll()` or after property runs

Example:

```javascript
const fc = require('fast-check');
const { setupTestDatabase, teardownTestDatabase } = require('../helpers/testSetup');

describe('Feature: wlimp-programme-rollout, Property X: Your Property', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should verify your property', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(), // Your arbitrary
        async (input) => {
          // Your test logic
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/Guides.md)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
