const BackendSDK = require("../core/BackendSDK");
const AccessControlLogger = require("./AccessControlLogger");

/**
 * Service for managing post access control based on community and cohort membership
 */
class AccessControlService {
  /**
   * Get user's community memberships
   * @param {number} userId - User ID
   * @returns {Promise<number[]>} Array of community IDs where user is a member
   */
  async getUserCommunities(userId) {
    try {
      const sdk = new BackendSDK();
      const members = await sdk.rawQuery(`
        SELECT DISTINCT community_id 
        FROM community_members 
        WHERE user_id = ${userId}
      `);
      
      return members.map(m => m.community_id);
    } catch (error) {
      AccessControlLogger.logDatabaseError('getUserCommunities', error, { userId });
      return [];
    }
  }

  /**
   * Get user's cohort memberships
   * @param {number} userId - User ID
   * @returns {Promise<number[]>} Array of cohort IDs where user is a member
   */
  async getUserCohorts(userId) {
    try {
      const sdk = new BackendSDK();
      const members = await sdk.rawQuery(`
        SELECT DISTINCT cohort_id 
        FROM cohort_members 
        WHERE user_id = ${userId}
      `);
      
      return members.map(m => m.cohort_id);
    } catch (error) {
      AccessControlLogger.logDatabaseError('getUserCohorts', error, { userId });
      return [];
    }
  }

  /**
   * Check if user can access a specific post
   * @param {number} userId - User ID
   * @param {Object} post - Post object with visibility_scope, community_ids, cohort_id
   * @returns {Promise<boolean>} True if user has access
   */
  async canAccessPost(userId, post) {
    try {
      // If no visibility_scope, default to community-scoped (backward compatibility)
      const visibilityScope = post.visibility_scope || 'community';
      
      if (visibilityScope === 'community') {
        const userCommunities = await this.getUserCommunities(userId);
        
        // Parse community_ids (can be comma-separated string)
        const postCommunityIds = post.community_ids
          ? post.community_ids.toString().split(',').map(id => parseInt(id.trim()))
          : [];
        
        // User has access if they're a member of any of the post's communities
        const hasAccess = postCommunityIds.some(id => userCommunities.includes(id));
        
        if (!hasAccess) {
          AccessControlLogger.logAccessViolation(
            userId, 
            post.id, 
            'User is not a member of the post\'s community',
            { visibilityScope, postCommunityIds, userCommunities }
          );
        }
        
        return hasAccess;
      } else if (visibilityScope === 'cohort') {
        const userCohorts = await this.getUserCohorts(userId);
        
        // User has access if they're a member of the post's cohort
        const hasAccess = post.cohort_id && userCohorts.includes(post.cohort_id);
        
        if (!hasAccess) {
          AccessControlLogger.logAccessViolation(
            userId, 
            post.id, 
            'User is not a member of the post\'s cohort',
            { visibilityScope, cohortId: post.cohort_id, userCohorts }
          );
        }
        
        return hasAccess;
      }
      
      AccessControlLogger.logAccessViolation(
        userId, 
        post.id, 
        'Invalid visibility scope',
        { visibilityScope }
      );
      
      return false;
    } catch (error) {
      AccessControlLogger.logDatabaseError('canAccessPost', error, { userId, postId: post.id });
      return false;
    }
  }

  /**
   * Build SQL WHERE clause for filtering posts by user membership
   * @param {number} userId - User ID
   * @returns {Promise<string>} SQL WHERE clause
   */
  async buildPostFilterClause(userId) {
    try {
      const userCommunities = await this.getUserCommunities(userId);
      const userCohorts = await this.getUserCohorts(userId);
      
      // If user has no memberships, return clause that matches nothing
      if (userCommunities.length === 0 && userCohorts.length === 0) {
        return '1 = 0';
      }
      
      const clauses = [];
      
      // Add community-scoped posts clause
      if (userCommunities.length > 0) {
        const communityIds = userCommunities.join(',');
        // Match posts where visibility_scope is 'community' (or NULL for backward compatibility)
        // and community_ids contains any of the user's communities
        clauses.push(`
          ((visibility_scope = 'community' OR visibility_scope IS NULL) 
           AND (${userCommunities.map(id => `FIND_IN_SET(${id}, community_ids) > 0`).join(' OR ')}))
        `);
      }
      
      // Add cohort-scoped posts clause
      if (userCohorts.length > 0) {
        const cohortIds = userCohorts.join(',');
        clauses.push(`
          (visibility_scope = 'cohort' AND cohort_id IN (${cohortIds}))
        `);
      }
      
      return clauses.join(' OR ');
    } catch (error) {
      AccessControlLogger.logDatabaseError('buildPostFilterClause', error, { userId });
      return '1 = 0'; // Return no results on error
    }
  }
}

module.exports = new AccessControlService();
