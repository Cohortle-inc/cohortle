const BackendSDK = require("../core/BackendSDK");

/**
 * Middleware to check if the user is authorized to modify the community (Owner or Collaborator)
 * @param {string} requiredRole - Minimum role required (optional, defaults to checking any privileged role)
 *                                If 'owner' is passed, strictly enforces owner access.
 */
module.exports = function (requiredRole = null) {
    return async function (req, res, next) {
        try {
            const { community_id } = req.params;
            const { user_id } = req;

            if (!community_id) return next();

            const sdk = new BackendSDK();

            // 1. Check Community Ownership
            sdk.setTable("communities");
            const community = (await sdk.get({ id: community_id }))[0];

            if (!community) {
                return res.status(404).json({ error: true, message: "Community not found" });
            }

            // If user is owner, they have full access
            if (community.owner_id === user_id) {
                req.isOwner = true;
                req.communityRole = 'owner';
                return next();
            }

            // If strictly requiring owner access, fail here
            if (requiredRole === 'owner') {
                return res.status(403).json({ error: true, message: "Unauthorized: Owner access required" });
            }

            // 2. Check Membership (Collaborator)
            sdk.setTable("community_members");
            const member = (await sdk.get({ community_id, user_id }))[0];

            if (!member) {
                return res.status(403).json({ error: true, message: "Unauthorized: Not a member" });
            }

            if (member.status !== 'active') {
                return res.status(403).json({ error: true, message: "Unauthorized: Membership not active" });
            }

            const privilegedRoles = ['instructor', 'facilitator'];
            if (!privilegedRoles.includes(member.role)) {
                return res.status(403).json({ error: true, message: "Unauthorized: Insufficient permissions" });
            }

            // If a specific role is required (e.g. 'instructor'), check it
            if (requiredRole && member.role !== requiredRole) {
                return res.status(403).json({ error: true, message: `Unauthorized: ${requiredRole} role required` });
            }

            req.isOwner = false;
            req.communityRole = member.role;
            next();

        } catch (err) {
            console.error("Auth Middleware Error:", err);
            return res.status(500).json({ error: true, message: "Authorization check failed" });
        }
    };
};
