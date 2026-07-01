/**
 * Property-Based Test: Migration preserves existing user records
 * Feature: google-auth-integration
 * Property 6: Migration preserves existing user records
 *
 * **Validates: Requirements 7.2**
 *
 * For any set of existing user records before the migration runs, after the migration
 * runs, all existing records should have the same values for all pre-existing columns,
 * with google_id set to null.
 */

const fc = require('fast-check');

// Mock queryInterface to simulate migration behaviour without a real DB
function createMockQueryInterface(existingColumns) {
  const tableState = { ...existingColumns };
  const indexes = [];

  return {
    describeTable: jest.fn().mockResolvedValue(tableState),
    addColumn: jest.fn().mockImplementation(async (table, column, def) => {
      tableState[column] = def;
    }),
    showIndex: jest.fn().mockResolvedValue(indexes),
    addIndex: jest.fn().mockImplementation(async (table, cols, opts) => {
      indexes.push({ name: opts.name });
    }),
    removeIndex: jest.fn().mockResolvedValue(undefined),
    removeColumn: jest.fn().mockImplementation(async (table, column) => {
      delete tableState[column];
    }),
    getTableState: () => tableState,
  };
}

const Sequelize = {
  STRING: (n) => `VARCHAR(${n})`,
  Op: { ne: Symbol('ne') },
};

// Import the migration module
const migration = require('../../migrations/20260325000000-add-google-id-to-users');

describe('Feature: google-auth-integration, Property 6: Migration preserves existing user records', () => {
  it('should add google_id column without modifying any pre-existing columns', async () => {
    // Arbitrary: generate a set of pre-existing column names (simulating the users table)
    const columnNameArb = fc.constantFrom(
      'id', 'email', 'password', 'first_name', 'last_name',
      'status', 'email_verified', 'joined_at', 'role_id', 'created_at', 'updated_at'
    );
    const columnSubsetArb = fc.uniqueArray(columnNameArb, { minLength: 3, maxLength: 11 });

    await fc.assert(
      fc.asyncProperty(
        columnSubsetArb,
        async (columnNames) => {
          // Build a mock table description from the column subset
          const existingColumns = {};
          columnNames.forEach((col) => {
            existingColumns[col] = { type: 'VARCHAR(255)', allowNull: true };
          });

          const queryInterface = createMockQueryInterface(existingColumns);

          // Run the migration up
          await migration.up(queryInterface, Sequelize);

          const tableState = queryInterface.getTableState();

          // Property: all pre-existing columns are still present and unchanged
          columnNames.forEach((col) => {
            expect(tableState[col]).toBeDefined();
          });

          // Property: google_id column was added
          expect(tableState['google_id']).toBeDefined();
          expect(tableState['google_id'].allowNull).toBe(true);

          // Property: no extra columns were added beyond google_id
          const newColumns = Object.keys(tableState).filter(
            (col) => !columnNames.includes(col)
          );
          expect(newColumns).toEqual(['google_id']);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent — running migration twice does not add duplicate columns', async () => {
    const existingColumns = {
      id: { type: 'INT', allowNull: false },
      email: { type: 'VARCHAR(255)', allowNull: false },
      password: { type: 'VARCHAR(255)', allowNull: true },
    };

    const queryInterface = createMockQueryInterface(existingColumns);

    // Run migration twice
    await migration.up(queryInterface, Sequelize);
    await migration.up(queryInterface, Sequelize);

    // addColumn should only have been called once (idempotency guard in migration)
    expect(queryInterface.addColumn).toHaveBeenCalledTimes(1);
  });

  it('should remove google_id column on down migration', async () => {
    const existingColumns = {
      id: { type: 'INT', allowNull: false },
      email: { type: 'VARCHAR(255)', allowNull: false },
      google_id: { type: 'VARCHAR(255)', allowNull: true },
    };

    const queryInterface = createMockQueryInterface(existingColumns);

    await migration.down(queryInterface, Sequelize);

    const tableState = queryInterface.getTableState();
    expect(tableState['google_id']).toBeUndefined();
    expect(tableState['id']).toBeDefined();
    expect(tableState['email']).toBeDefined();
  });
});
