const BackendSDK = require("../core/BackendSDK");

/**
 * Get complete membership and community data for a user
 * @param {number} community_id - Community ID
 * @param {number} user_id - User ID
 * @returns {Promise<Object>} Complete membership and community data
 */
async function getMembershipData(community_id, user_id) {
  try {
    const sdk = new BackendSDK();
    
    // Fetch membership record
    sdk.setTable("community_members");
    const memberships = await sdk.get({ community_id, user_id });
    
    if (memberships.length === 0) {
      return null;
    }
    
    const membership = Array.isArray(memberships) ? memberships[0] : memberships;
    
    // Fetch community details
    const communityData = await sdk.rawQuery(`
      SELECT 
        c.id,
        c.name,
        c.description,
        COUNT(DISTINCT p.id) as programme_count
      FROM communities c
      LEFT JOIN programmes p ON p.community_id = c.id
      WHERE c.id = ${community_id}
      GROUP BY c.id, c.name, c.description
    `);
    
    if (communityData.length === 0) {
      return null;
    }
    
    const community = communityData[0];
    
    return {
      membership: {
        id: membership.id,
        user_id: membership.user_id,
        community_id: membership.community_id,
        status: membership.status,
        role: membership.role || 'learner',
        created_at: membership.created_at
      },
      community: {
        id: community.id,
        name: community.name,
        description: community.description || '',
        programme_count: parseInt(community.programme_count) || 0
      }
    };
  } catch (error) {
    console.error("Error fetching membership data:", error);
    throw error;
  }
}

module.exports = {
  getMembershipData
};
