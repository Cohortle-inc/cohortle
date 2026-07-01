"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create roles table
    await queryInterface.createTable("roles", {
      role_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hierarchy_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Insert default roles
    await queryInterface.bulkInsert("roles", [
      {
        role_id: Sequelize.literal("UUID()"),
        name: "student",
        description:
          "Learner enrolled in programmes. Can enroll in programmes, complete lessons, participate in community discussions, and track personal learning progress.",
        hierarchy_level: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: Sequelize.literal("UUID()"),
        name: "convener",
        description:
          "Programme creator and manager. Can create and manage educational programmes, organize content, manage cohorts and enrollments, monitor programme analytics, and facilitate community discussions within their programmes.",
        hierarchy_level: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: Sequelize.literal("UUID()"),
        name: "administrator",
        description:
          "System administrator with full access. Can manage all users and roles, configure system settings and permissions, oversee all programmes and content, and handle platform-wide issues and support.",
        hierarchy_level: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("roles");
  },
};
