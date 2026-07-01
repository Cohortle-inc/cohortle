'use strict';

/**
 * Migration: Add organisation contact, social, and branding fields to users table
 *
 * New fields:
 * - organisation_tagline: short tagline shown in hero section
 * - contact_email: public contact email
 * - contact_phone: public contact phone
 * - website_url: organisation website
 * - linkedin_url: LinkedIn profile/page URL
 * - twitter_url: Twitter/X profile URL
 * - facebook_url: Facebook page URL
 * - instagram_url: Instagram profile URL
 * - organisation_logo_url: logo image URL
 * - hero_image_url: hero/banner image URL
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    const addIfMissing = async (column, definition) => {
      if (!table[column]) {
        await queryInterface.addColumn('users', column, definition);
      }
    };

    await addIfMissing('organisation_tagline', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('contact_email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('contact_phone', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('website_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('linkedin_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('twitter_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('facebook_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('instagram_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('organisation_logo_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('hero_image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');
    const cols = [
      'organisation_tagline', 'contact_email', 'contact_phone',
      'website_url', 'linkedin_url', 'twitter_url', 'facebook_url',
      'instagram_url', 'organisation_logo_url', 'hero_image_url',
    ];
    for (const col of cols) {
      if (table[col]) await queryInterface.removeColumn('users', col);
    }
  },
};
