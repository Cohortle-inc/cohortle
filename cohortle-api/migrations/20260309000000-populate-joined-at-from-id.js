'use strict';

/**
 * Migration: Populate joined_at field for existing users
 * 
 * For users where joined_at is NULL, we'll use a reasonable estimate based on their user ID.
 * Lower IDs = earlier users. We'll set a base date and increment from there.
 * 
 * This is better than showing "less than a minute ago" for all users.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('[Migration] Populating joined_at for existing users...');
      
      // Get all users without joined_at
      const [users] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE joined_at IS NULL ORDER BY id ASC'
      );
      
      if (users.length === 0) {
        console.log('[Migration] No users need joined_at populated');
        return;
      }
      
      console.log(`[Migration] Found ${users.length} users without joined_at`);
      
      // Set a base date (e.g., 6 months ago for the first user)
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - 6);
      
      // Update each user with an incremental date
      // Spread users over the 6-month period
      const millisecondsPerUser = (Date.now() - baseDate.getTime()) / users.length;
      
      for (let i = 0; i < users.length; i++) {
        const userId = users[i].id;
        const joinedAt = new Date(baseDate.getTime() + (i * millisecondsPerUser));
        
        await queryInterface.sequelize.query(
          'UPDATE users SET joined_at = ? WHERE id = ?',
          {
            replacements: [joinedAt, userId],
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
      
      console.log('[Migration] Successfully populated joined_at for all users');
    } catch (error) {
      console.error('[Migration] Error populating joined_at:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Don't remove the dates on rollback - they're useful data
    console.log('[Migration] Rollback: Keeping joined_at values (no action)');
  }
};
