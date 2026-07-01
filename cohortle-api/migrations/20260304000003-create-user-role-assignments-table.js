"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes("user_role_assignments");

    if (!tableExists) {
      // Create user_role_assignments table
      await queryInterface.createTable("user_role_assignments", {
        assignment_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onDelete: "CASCADE",
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
        assigned_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "users",
            key: "id",
          },
        },
        assigned_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        effective_from: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        effective_until: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: "active",
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      });
    }

    // Add indexes for performance (check if they exist first)
    const indexes = await queryInterface.showIndex("user_role_assignments");
    const indexNames = indexes.map(idx => idx.name);

    if (!indexNames.includes("idx_user_role_assignments_user_id")) {
      await queryInterface.addIndex("user_role_assignments", ["user_id"], {
        name: "idx_user_role_assignments_user_id",
      });
    }

    if (!indexNames.includes("idx_user_role_assignments_status")) {
      await queryInterface.addIndex("user_role_assignments", ["status"], {
        name: "idx_user_role_assignments_status",
      });
    }

    // Add composite index for user_id and status
    // Note: MySQL doesn't support partial indexes, so we use a composite index
    if (!indexNames.includes("idx_user_role_assignments_user_status")) {
      await queryInterface.addIndex("user_role_assignments", ["user_id", "status"], {
        name: "idx_user_role_assignments_user_status",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user_role_assignments");
  },
};
