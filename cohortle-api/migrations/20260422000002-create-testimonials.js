'use strict';

/**
 * Migration: Create testimonials table
 * Stores learner testimonials for organisation page
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('testimonials', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Convener user ID',
      },
      learner_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of learner giving testimonial',
      },
      learner_avatar: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Avatar URL for learner',
      },
      programme_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Programme the learner completed',
      },
      quote: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Testimonial text',
      },
      rating: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        allowNull: false,
        comment: 'Rating out of 5',
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether to feature prominently',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('testimonials', ['user_id']);
    await queryInterface.addIndex('testimonials', ['is_featured']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('testimonials');
  },
};
