'use strict';

/**
 * Migration: Create testimonial_submissions table
 * Deduplication guard — one submission per learner per collection link
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('testimonial_submissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      collection_link_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'testimonial_collection_links',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'The collection link used for this submission',
      },
      learner_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Learner who submitted the testimonial',
      },
      testimonial_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'testimonials',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'The created testimonial record',
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('testimonial_submissions', ['collection_link_id', 'learner_user_id'], {
      unique: true,
      name: 'idx_ts_link_learner',
    });
    await queryInterface.addIndex('testimonial_submissions', ['collection_link_id'], {
      name: 'idx_ts_collection_link_id',
    });
    await queryInterface.addIndex('testimonial_submissions', ['learner_user_id'], {
      name: 'idx_ts_learner_user_id',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('testimonial_submissions');
  },
};
