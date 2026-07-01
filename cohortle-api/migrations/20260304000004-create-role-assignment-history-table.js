"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create role_assignment_history table
    await queryInterface.createTable("role_assignment_history", {
      history_id: {
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
      previous_role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "roles",
          key: "role_id",
        },
      },
      new_role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "roles",
          key: "role_id",
        },
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    });

    // Add index for performance
    await queryInterface.addIndex("role_assignment_history", ["user_id"], {
      name: "idx_role_assignment_history_user_id",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("role_assignment_history");
  },
};
