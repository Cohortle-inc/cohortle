'use strict';

/**
 * Migration: Add Phase 2 organisation page fields
 * Adds contact info, social media links, and tagline to users table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'organisation_tagline', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Short tagline for organisation page hero',
    });

    await queryInterface.addColumn('users', 'contact_email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Public contact email for organisation',
    });

    await queryInterface.addColumn('users', 'contact_phone', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Public contact phone for organisation',
    });

    await queryInterface.addColumn('users', 'website_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Organisation website URL',
    });

    await queryInterface.addColumn('users', 'linkedin_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'LinkedIn profile/page URL',
    });

    await queryInterface.addColumn('users', 'twitter_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Twitter/X profile URL',
    });

    await queryInterface.addColumn('users', 'facebook_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Facebook page URL',
    });

    await queryInterface.addColumn('users', 'instagram_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Instagram profile URL',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'organisation_tagline');
    await queryInterface.removeColumn('users', 'contact_email');
    await queryInterface.removeColumn('users', 'contact_phone');
    await queryInterface.removeColumn('users', 'website_url');
    await queryInterface.removeColumn('users', 'linkedin_url');
    await queryInterface.removeColumn('users', 'twitter_url');
    await queryInterface.removeColumn('users', 'facebook_url');
    await queryInterface.removeColumn('users', 'instagram_url');
  },
};
