"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if visibility_scope column already exists
    const [columns] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM posts LIKE 'visibility_scope'`
    );

    if (columns.length === 0) {
      // Add visibility_scope column with ENUM type
      await queryInterface.addColumn("posts", "visibility_scope", {
        type: Sequelize.ENUM("community", "cohort"),
        allowNull: false,
        defaultValue: "community",
        comment: "Determines if post is visible to entire community or specific cohort",
      });
    }

    // Add cohort_id column as nullable foreign key
    const [cohortIdColumns] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM posts LIKE 'cohort_id'`
    );

    if (cohortIdColumns.length === 0) {
      await queryInterface.addColumn("posts", "cohort_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "cohorts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Cohort ID when visibility_scope is 'cohort'",
      });
    }

    // Create indexes for performance (check if they exist first)
    try {
      await queryInterface.addIndex("posts", ["visibility_scope"], {
        name: "idx_posts_visibility_scope",
      });
    } catch (e) {
      // Index already exists, skip
    }

    try {
      await queryInterface.addIndex("posts", ["cohort_id"], {
        name: "idx_posts_cohort_id",
      });
    } catch (e) {
      // Index already exists, skip
    }

    try {
      // Create composite index for efficient filtering
      await queryInterface.addIndex(
        "posts",
        ["visibility_scope", "community_ids", "cohort_id"],
        {
          name: "idx_posts_community_cohort",
        }
      );
    } catch (e) {
      // Index already exists, skip
    }

    // Note: No data migration needed since we set defaultValue='community'
    // All existing rows will automatically get 'community' scope and NULL cohort_id
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex("posts", "idx_posts_community_cohort");
    await queryInterface.removeIndex("posts", "idx_posts_cohort_id");
    await queryInterface.removeIndex("posts", "idx_posts_visibility_scope");

    // Remove columns
    await queryInterface.removeColumn("posts", "cohort_id");
    await queryInterface.removeColumn("posts", "visibility_scope");

    // Drop ENUM type
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_posts_visibility_scope;"
    );
  },
};
