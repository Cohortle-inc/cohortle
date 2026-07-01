"use strict";

/**
 * Seeder for default roles and permissions
 * This seeder is idempotent - it can be run multiple times safely
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if roles already exist
    const existingRoles = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM roles`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingRoles[0].count > 0) {
      console.log("Roles already seeded, skipping...");
      return;
    }

    console.log("Seeding roles and permissions...");

    // Insert default roles
    const roleIds = {
      student: Sequelize.literal("UUID()"),
      convener: Sequelize.literal("UUID()"),
      administrator: Sequelize.literal("UUID()"),
    };

    await queryInterface.bulkInsert("roles", [
      {
        role_id: roleIds.student,
        name: "student",
        description:
          "Learner enrolled in programmes. Can enroll in programmes, complete lessons, participate in community discussions, and track personal learning progress.",
        hierarchy_level: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: roleIds.convener,
        name: "convener",
        description:
          "Programme creator and manager. Can create and manage educational programmes, organize content, manage cohorts and enrollments, monitor programme analytics, and facilitate community discussions within their programmes.",
        hierarchy_level: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: roleIds.administrator,
        name: "administrator",
        description:
          "System administrator with full access. Can manage all users and roles, configure system settings and permissions, oversee all programmes and content, and handle platform-wide issues and support.",
        hierarchy_level: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Insert default permissions
    const permissions = [
      // Student permissions
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "view_dashboard",
        description: "View learner dashboard",
        resource_type: "dashboard",
        action: "read",
        scope: "own",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "enroll_programme",
        description: "Enroll in programmes",
        resource_type: "programme",
        action: "create",
        scope: "all",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "view_lessons",
        description: "View lesson content",
        resource_type: "lesson",
        action: "read",
        scope: "enrolled",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "complete_lessons",
        description: "Mark lessons as complete",
        resource_type: "lesson",
        action: "update",
        scope: "own",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "participate_community",
        description: "Participate in community discussions",
        resource_type: "community",
        action: "create",
        scope: "enrolled",
        created_at: new Date(),
      },
      // Convener permissions
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "create_programme",
        description: "Create new programmes",
        resource_type: "programme",
        action: "create",
        scope: "all",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "manage_cohorts",
        description: "Manage programme cohorts",
        resource_type: "cohort",
        action: "manage",
        scope: "own",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "manage_weeks",
        description: "Create and edit weeks",
        resource_type: "week",
        action: "manage",
        scope: "own",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "manage_lessons",
        description: "Create and edit lessons",
        resource_type: "lesson",
        action: "manage",
        scope: "own",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "view_analytics",
        description: "View programme analytics",
        resource_type: "analytics",
        action: "read",
        scope: "own",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "manage_enrollments",
        description: "Manage programme enrollments",
        resource_type: "enrollment",
        action: "manage",
        scope: "own",
        created_at: new Date(),
      },
      // Administrator permissions
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "manage_users",
        description: "Manage all users",
        resource_type: "user",
        action: "manage",
        scope: "all",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "manage_roles",
        description: "Manage roles and permissions",
        resource_type: "role",
        action: "manage",
        scope: "all",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "system_settings",
        description: "Manage system settings",
        resource_type: "system",
        action: "manage",
        scope: "all",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "view_all_analytics",
        description: "View all analytics",
        resource_type: "analytics",
        action: "read",
        scope: "all",
        created_at: new Date(),
      },
      {
        permission_id: Sequelize.literal("UUID()"),
        name: "manage_all_content",
        description: "Manage all content",
        resource_type: "content",
        action: "manage",
        scope: "all",
        created_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("permissions", permissions);

    // Map permissions to roles
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
        (r.name = 'convener' AND p.name IN ('view_dashboard', 'enroll_programme', 'view_lessons', 'complete_lessons', 'participate_community', 'create_programme', 'manage_cohorts', 'manage_weeks', 'manage_lessons', 'view_analytics', 'manage_enrollments'))
        OR
        -- Administrator gets all permissions
        (r.name = 'administrator')
    `);

    console.log("Roles and permissions seeded successfully!");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("role_permissions", null, {});
    await queryInterface.bulkDelete("permissions", null, {});
    await queryInterface.bulkDelete("roles", null, {});
  },
};
