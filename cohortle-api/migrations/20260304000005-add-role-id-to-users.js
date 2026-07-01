"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add role_id column to users table (denormalized for performance)
    await queryInterface.addColumn("users", "role_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "roles",
        key: "role_id",
      },
    });

    // Add index for performance
    await queryInterface.addIndex("users", ["role_id"], {
      name: "idx_users_role_id",
    });

    // Migrate existing role data from string to UUID
    // First, update users with 'student' role
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET role_id = (SELECT role_id FROM roles WHERE name = 'student')
      WHERE u.role = 'student'
    `);

    // Update users with 'convener' role
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET role_id = (SELECT role_id FROM roles WHERE name = 'convener')
      WHERE u.role = 'convener'
    `);

    // Update users with 'administrator' role
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET role_id = (SELECT role_id FROM roles WHERE name = 'administrator')
      WHERE u.role = 'administrator'
    `);

    // Create user_role_assignments for existing users with roles
    await queryInterface.sequelize.query(`
      INSERT INTO user_role_assignments (assignment_id, user_id, role_id, assigned_at, effective_from, status)
      SELECT 
        UUID(),
        u.id,
        u.role_id,
        NOW(),
        NOW(),
        'active'
      FROM users u
      WHERE u.role_id IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("users", "idx_users_role_id");
    await queryInterface.removeColumn("users", "role_id");
  },
};
