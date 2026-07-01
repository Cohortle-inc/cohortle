"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create permissions table
    await queryInterface.createTable("permissions", {
      permission_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      scope: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "own",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("permissions");
  },
};
