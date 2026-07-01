"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create role_permissions mapping table
    await queryInterface.createTable("role_permissions", {
      mapping_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "roles",
          key: "role_id",
        },
        onDelete: "CASCADE",
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "permissions",
          key: "permission_id",
        },
        onDelete: "CASCADE",
      },
      granted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      granted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    });

    // Add unique constraint
    await queryInterface.addConstraint("role_permissions", {
      fields: ["role_id", "permission_id"],
      type: "unique",
      name: "unique_role_permission",
    });

    // Map permissions to roles
    // Note: We'll use raw SQL to get role and permission IDs and create mappings
    await queryInterface.sequelize.query(`
      INSERT INTO role_permissions (mapping_id, role_id, permission_id, granted_at)
      SELECT 
        UUID(),
        r.role_id,
        p.permission_id,
        NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE 
        -- Student gets student permissions
        (r.name = 'student' AND p.name IN ('view_dashboard', 'enroll_programme', 'view_lessons', 'complete_lessons', 'participate_community'))
        OR
        -- Convener gets student + convener permissions
        (r.name = 'convener' AND p.name IN ('view_dashboard', 'enroll_programme', 'view_lessons', 'complete_lessons', 'participate_community', 'create_programme', 'manage_cohorts', 'manage_lessons', 'view_analytics', 'manage_enrollments'))
        OR
        -- Administrator gets all permissions
        (r.name = 'administrator')
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("role_permissions");
  },
};
