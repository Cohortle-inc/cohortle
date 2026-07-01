const { Op } = require("sequelize");
const db = require("../models");
const StreakService = require("./StreakService");

/**
 * Service for managing learner profiles, preferences, goals, and achievements
 * Handles profile updates, notification preferences, learning goals, and achievement tracking
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13
 */
class ProfileService {
  /**
   * Get user profile with learning statistics
   * Returns user details and calculated learning stats
   * 
   * @param {number} userId - The user ID
   * @returns {Promise<{user: UserProfile, stats: LearningStats}>}
   * 
   * Requirements: 8.1, 8.5, 8.6
   */
  async getUserProfile(userId) {
    try {
      console.log(`[ProfileService] Getting profile for user ${userId}`);
      
      // Get user details
      const user = await db.users.findByPk(userId, {
        attributes: ["id", "first_name", "last_name", "email", "email_verified", "joined_at", "profile_image", "bio", "linkedin_username",
          "organisation_slug", "organisation_name", "organisation_description", "organisation_tagline",
          "contact_email", "contact_phone", "website_url", "linkedin_url", "twitter_url", "facebook_url", "instagram_url",
          "organisation_logo_url", "hero_image_url", "intro_video_url", "tawk_property_id", "tawk_widget_id"],
      });

      if (!user) {
        console.error(`[ProfileService] User ${userId} not found`);
        throw new Error("User not found");
      }
      
      // Get the most recent role assignment separately to avoid Sequelize separate query issues
      const roleAssignment = await db.user_role_assignments.findOne({
        where: { user_id: userId, status: 'active' },
        attributes: ['role_id'],
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id']
        }],
        order: [['assigned_at', 'DESC']]
      });
      
      // Extract role name from role assignment, with fallback to users.role_id
      let roleName = roleAssignment?.role?.name || null;

      // Fallback: check users.role_id directly (handles users where role assignment
      // row exists but role JOIN fails, or no assignment row at all)
      if (!roleName) {
        const userWithRole = await db.users.findOne({
          where: { id: userId },
          attributes: ['role_id'],
          include: [{ model: db.roles, as: 'role', attributes: ['name'], required: false }]
        });
        roleName = userWithRole?.role?.name || 'unassigned';
      }

      // Calculate learning stats
      const stats = await this._calculateLearningStats(userId);

      // Use joined_at if available, otherwise use current date as fallback
      const joinedAt = user.joined_at ? user.joined_at.toISOString() : new Date().toISOString();

      return {
        user: {
          id: user.id,
          name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email,
          email: user.email,
          role: roleName,
          email_verified: user.email_verified === 1,
          profilePicture: user.profile_image || null,
          bio: user.bio || null,
          linkedinUsername: user.linkedin_username || null,
          joinedAt,
          organisation_slug: user.organisation_slug || null,
          organisationSlug: user.organisation_slug || null,
          organisationName: user.organisation_name || null,
          organisationDescription: user.organisation_description || null,
          organisationTagline: user.organisation_tagline || null,
          contactEmail: user.contact_email || null,
          contactPhone: user.contact_phone || null,
          websiteUrl: user.website_url || null,
          linkedinUrl: user.linkedin_url || null,
          twitterUrl: user.twitter_url || null,
          facebookUrl: user.facebook_url || null,
          instagramUrl: user.instagram_url || null,
          organisationLogoUrl: user.organisation_logo_url || null,
          heroImageUrl: user.hero_image_url || null,
          introVideoUrl: user.intro_video_url || null,
          tawkPropertyId: user.tawk_property_id || null,
          tawkWidgetId: user.tawk_widget_id || null,
        },
        stats,
      };
    } catch (error) {
      console.error("[ProfileService] Error getting user profile:", error);
      console.error("[ProfileService] Error stack:", error.stack);
      throw error;
    }
  }

  /**
   * Calculate learning statistics for a user
   * Private helper method
   * 
   * @param {number} userId - The user ID
   * @returns {Promise<LearningStats>}
   * @private
   */
  async _calculateLearningStats(userId) {
    try {
      // Get total enrolled programmes
      const totalProgrammes = await db.enrollments.count({
        where: { user_id: userId },
        distinct: true,
        col: "cohort_id",
      });

      // Get total lessons completed
      let totalLessonsCompleted = 0;
      try {
        totalLessonsCompleted = await db.lesson_completions.count({
          where: { user_id: userId },
        });
      } catch (err) {
        // If lesson_completions table doesn't exist yet, default to 0
        if (err.message && err.message.includes("doesn't exist")) {
          console.warn("lesson_completions table not yet created - defaulting to 0");
          totalLessonsCompleted = 0;
        } else {
          throw err;
        }
      }

      // Get completed programmes (programmes where all lessons are completed)
      const enrollments = await db.enrollments.findAll({
        where: { user_id: userId },
        include: [
          {
            model: db.cohorts,
            as: "cohort",
            include: [
              {
                model: db.programmes,
                as: "programme",
                include: [
                  {
                    model: db.weeks,
                    as: "weeks",
                    include: [
                      {
                        model: db.lessons,
                        as: "lessons",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      let completedProgrammes = 0;

      for (const enrollment of enrollments) {
        const programme = enrollment.cohort.programme;
        const allLessons = [];

        // Collect all lessons from all weeks
        programme.weeks.forEach((week) => {
          week.lessons.forEach((lesson) => {
            allLessons.push(lesson.id);
          });
        });

        if (allLessons.length === 0) {
          continue;
        }

        // Check if all lessons are completed
        try {
          const completedCount = await db.lesson_completions.count({
            where: {
              user_id: userId,
              cohort_id: enrollment.cohort_id,
              lesson_id: {
                [Op.in]: allLessons,
              },
            },
          });

          if (completedCount === allLessons.length) {
            completedProgrammes++;
          }
        } catch (err) {
          // If lesson_completions table doesn't exist, skip this check
          if (err.message && err.message.includes("doesn't exist")) {
            console.warn("lesson_completions table not yet created - skipping completion check");
          } else {
            throw err;
          }
        }
      }

      // Get real streak values from StreakService
      const { currentStreak, longestStreak } = await StreakService.getStreak(userId);

      return {
        totalProgrammes,
        completedProgrammes,
        totalLessonsCompleted,
        currentStreak,
        longestStreak,
      };
    } catch (error) {
      console.error("Error calculating learning stats:", error);
      throw error;
    }
  }

  /**
   * Update user's profile image
   * Validates URL length and updates the profile_image field
   * 
   * @param {number} userId - The user ID
   * @param {string} avatarUrl - New avatar URL
   * @returns {Promise<UserProfile>}
   * @throws {Error} If URL exceeds 500 characters or user not found
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.5
   */
  async updateProfileImage(userId, avatarUrl) {
    try {
      console.log(`[ProfileService] Updating profile image for user ${userId}`);
      
      // Validate URL length (max 500 characters as per database schema)
      if (avatarUrl && avatarUrl.length > 500) {
        console.error(`[ProfileService] Avatar URL exceeds 500 characters: ${avatarUrl.length}`);
        throw new Error("Avatar URL exceeds maximum length of 500 characters");
      }

      // Find user
      const user = await db.users.findByPk(userId);

      if (!user) {
        console.error(`[ProfileService] User ${userId} not found`);
        throw new Error("User not found");
      }

      // Update profile_image field
      await user.update({
        profile_image: avatarUrl,
      });

      console.log(`[ProfileService] Successfully updated profile image for user ${userId}`);

      // Get the most recent role assignment
      const roleAssignment = await db.user_role_assignments.findOne({
        where: { user_id: userId, status: 'active' },
        attributes: ['role_id'],
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id']
        }],
        order: [['assigned_at', 'DESC']]
      });
      
      let roleName = roleAssignment?.role?.name || null;
      if (!roleName) {
        const userWithRole = await db.users.findOne({
          where: { id: userId },
          attributes: ['role_id'],
          include: [{ model: db.roles, as: 'role', attributes: ['name'], required: false }]
        });
        roleName = userWithRole?.role?.name || 'unassigned';
      }
      
      return {
        id: user.id,
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email,
        email: user.email,
        role: roleName,
        profilePicture: user.profile_image,
        bio: user.bio || null,
        linkedinUsername: user.linkedin_username || null,
        joinedAt: user.joined_at ? user.joined_at.toISOString() : new Date().toISOString(),
      };
    } catch (error) {
      console.error("[ProfileService] Error updating profile image:", error);
      console.error("[ProfileService] Error stack:", error.stack);
      throw error;
    }
  }

  /**
   * Update user profile
   * Validates that name is not empty
   * 
   * @param {number} userId - The user ID
   * @param {Object} data - Profile update data
   * @param {string} [data.name] - New name
   * @param {string} [data.profilePicture] - New profile picture URL
   * @returns {Promise<UserProfile>}
   * 
   * Requirements: 8.2, 8.3, 8.4
   */
  async updateProfile(userId, data) {
    try {
      // Validate name if provided
      if (data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
          throw new Error("Name cannot be empty");
        }
      }

      // Find user
      const user = await db.users.findByPk(userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Update user - split name into first_name and last_name
      const updateData = {};
      if (data.name !== undefined) {
        const nameParts = data.name.trim().split(' ');
        updateData.first_name = nameParts[0] || '';
        updateData.last_name = nameParts.slice(1).join(' ') || '';
      }
      
      if (data.profilePicture !== undefined) {
        updateData.profile_image = data.profilePicture || null;
      }
      
      if (data.bio !== undefined) {
        updateData.bio = data.bio ? data.bio.trim() : null;
      }
      
      if (data.linkedinUsername !== undefined) {
        // Store only the username, not the full URL
        const username = data.linkedinUsername ? data.linkedinUsername.trim() : null;
        updateData.linkedin_username = username;
      }

      if (data.organisation_slug !== undefined) {
        updateData.organisation_slug = data.organisation_slug ? data.organisation_slug.trim().toLowerCase() : null;
      }

      if (data.organisation_name !== undefined) {
        updateData.organisation_name = data.organisation_name ? data.organisation_name.trim() : null;
      }

      if (data.organisation_description !== undefined) {
        updateData.organisation_description = data.organisation_description ? data.organisation_description.trim() : null;
      }

      if (data.organisation_tagline !== undefined) {
        updateData.organisation_tagline = data.organisation_tagline ? data.organisation_tagline.trim() : null;
      }
      if (data.contact_email !== undefined) {
        updateData.contact_email = data.contact_email ? data.contact_email.trim() : null;
      }
      if (data.contact_phone !== undefined) {
        updateData.contact_phone = data.contact_phone ? data.contact_phone.trim() : null;
      }
      if (data.website_url !== undefined) {
        updateData.website_url = data.website_url ? data.website_url.trim() : null;
      }
      if (data.linkedin_url !== undefined) {
        updateData.linkedin_url = data.linkedin_url ? data.linkedin_url.trim() : null;
      }
      if (data.twitter_url !== undefined) {
        updateData.twitter_url = data.twitter_url ? data.twitter_url.trim() : null;
      }
      if (data.facebook_url !== undefined) {
        updateData.facebook_url = data.facebook_url ? data.facebook_url.trim() : null;
      }
      if (data.instagram_url !== undefined) {
        updateData.instagram_url = data.instagram_url ? data.instagram_url.trim() : null;
      }
      if (data.organisation_logo_url !== undefined) {
        updateData.organisation_logo_url = data.organisation_logo_url ? data.organisation_logo_url.trim() : null;
      }
      if (data.hero_image_url !== undefined) {
        updateData.hero_image_url = data.hero_image_url ? data.hero_image_url.trim() : null;
      }
      if (data.intro_video_url !== undefined) {
        updateData.intro_video_url = data.intro_video_url ? data.intro_video_url.trim() : null;
      }
      if (data.tawk_property_id !== undefined) {
        updateData.tawk_property_id = data.tawk_property_id ? data.tawk_property_id.trim() : null;
      }
      if (data.tawk_widget_id !== undefined) {
        updateData.tawk_widget_id = data.tawk_widget_id ? data.tawk_widget_id.trim() : null;
      }

      await user.update(updateData);

      // Get the most recent role assignment
      const roleAssignment = await db.user_role_assignments.findOne({
        where: { user_id: userId, status: 'active' },
        attributes: ['role_id'],
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id']
        }],
        order: [['assigned_at', 'DESC']]
      });
      
      let roleName = roleAssignment?.role?.name || null;
      if (!roleName) {
        const userWithRole = await db.users.findOne({
          where: { id: userId },
          attributes: ['role_id'],
          include: [{ model: db.roles, as: 'role', attributes: ['name'], required: false }]
        });
        roleName = userWithRole?.role?.name || 'unassigned';
      }
      
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        role: roleName,
        profilePicture: user.profile_image || null,
        bio: user.bio || null,
        linkedinUsername: user.linkedin_username || null,
        joinedAt: user.joined_at ? user.joined_at.toISOString() : new Date().toISOString(),
        organisation_slug: user.organisation_slug || null,
        organisationSlug: user.organisation_slug || null,
        organisationName: user.organisation_name || null,
        organisationDescription: user.organisation_description || null,
        organisationTagline: user.organisation_tagline || null,
        contactEmail: user.contact_email || null,
        contactPhone: user.contact_phone || null,
        websiteUrl: user.website_url || null,
        linkedinUrl: user.linkedin_url || null,
        twitterUrl: user.twitter_url || null,
        facebookUrl: user.facebook_url || null,
        instagramUrl: user.instagram_url || null,
        organisationLogoUrl: user.organisation_logo_url || null,
        heroImageUrl: user.hero_image_url || null,
        introVideoUrl: user.intro_video_url || null,
        tawkPropertyId: user.tawk_property_id || null,
        tawkWidgetId: user.tawk_widget_id || null,
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   * Creates default preferences if they don't exist
   * 
   * @param {number} userId - The user ID
   * @returns {Promise<NotificationPreferences>}
   * 
   * Requirements: 8.7, 8.8
   */
  async getPreferences(userId) {
    try {
      // Get or create preferences
      let preferences = await db.user_preferences.findOne({
        where: { user_id: userId },
      });

      if (!preferences) {
        // Create default preferences
        preferences = await db.user_preferences.create({
          user_id: userId,
          email_lesson_reminders: true,
          email_community_activity: true,
          email_programme_updates: true,
          email_weekly_digest: true,
        });
      }

      return {
        emailLessonReminders: preferences.email_lesson_reminders,
        emailCommunityActivity: preferences.email_community_activity,
        emailProgrammeUpdates: preferences.email_programme_updates,
        emailWeeklyDigest: preferences.email_weekly_digest,
      };
    } catch (error) {
      console.error("Error getting preferences:", error);
      
      // If table doesn't exist yet (migrations not run), return defaults
      if (error.message && error.message.includes("doesn't exist")) {
        console.warn("User preferences table not yet created - returning defaults");
        return {
          emailLessonReminders: true,
          emailCommunityActivity: true,
          emailProgrammeUpdates: true,
          emailWeeklyDigest: true,
        };
      }
      
      throw error;
    }
  }

  /**
   * Update notification preferences
   * 
   * @param {number} userId - The user ID
   * @param {NotificationPreferences} preferences - New preferences
   * @returns {Promise<NotificationPreferences>}
   * 
   * Requirements: 8.8, 8.9
   */
  async updatePreferences(userId, preferences) {
    try {
      // Upsert preferences
      const [userPreferences, created] = await db.user_preferences.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          email_lesson_reminders: preferences.emailLessonReminders ?? true,
          email_community_activity: preferences.emailCommunityActivity ?? true,
          email_programme_updates: preferences.emailProgrammeUpdates ?? true,
          email_weekly_digest: preferences.emailWeeklyDigest ?? true,
        },
      });

      if (!created) {
        // Update existing preferences
        await userPreferences.update({
          email_lesson_reminders: preferences.emailLessonReminders ?? userPreferences.email_lesson_reminders,
          email_community_activity: preferences.emailCommunityActivity ?? userPreferences.email_community_activity,
          email_programme_updates: preferences.emailProgrammeUpdates ?? userPreferences.email_programme_updates,
          email_weekly_digest: preferences.emailWeeklyDigest ?? userPreferences.email_weekly_digest,
        });
      }

      return {
        emailLessonReminders: userPreferences.email_lesson_reminders,
        emailCommunityActivity: userPreferences.email_community_activity,
        emailProgrammeUpdates: userPreferences.email_programme_updates,
        emailWeeklyDigest: userPreferences.email_weekly_digest,
      };
    } catch (error) {
      console.error("Error updating preferences:", error);
      throw error;
    }
  }

  /**
   * Get learning goal for a user
   * Returns null if no goal is set
   * 
   * @param {number} userId - The user ID
   * @returns {Promise<LearningGoal|null>}
   * 
   * Requirements: 8.12, 8.13
   */
  async getLearningGoal(userId) {
    try {
      const goal = await db.learning_goals.findOne({
        where: { user_id: userId },
      });

      if (!goal) {
        return null;
      }

      // Calculate current progress toward goal
      const current = await this._calculateGoalProgress(userId, goal.goal_type);

      return {
        type: goal.goal_type,
        target: goal.target_value,
        current,
      };
    } catch (error) {
      console.error("Error getting learning goal:", error);
      
      // If table doesn't exist yet (migrations not run), return null
      if (error.message && error.message.includes("doesn't exist")) {
        console.warn("Learning goals table not yet created - returning null");
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Calculate current progress toward a learning goal
   * Private helper method
   * 
   * @param {number} userId - The user ID
   * @param {string} goalType - The goal type ('lessons_per_week' or 'hours_per_week')
   * @returns {Promise<number>}
   * @private
   */
  async _calculateGoalProgress(userId, goalType) {
    try {
      if (goalType === "lessons_per_week") {
        // Count lessons completed in the last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const count = await db.lesson_completions.count({
          where: {
            user_id: userId,
            completed_at: {
              [Op.gte]: oneWeekAgo,
            },
          },
        });

        return count;
      } else if (goalType === "hours_per_week") {
        // Sum estimated_duration of lessons completed in the last 7 days.
        // Falls back to 30 minutes per lesson when duration is not set.
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const BackendSDK = require("../core/BackendSDK");
        const sdk = new BackendSDK();
        const rows = await sdk.rawQuery(`
          SELECT COALESCE(l.estimated_duration, 30) AS duration_minutes
          FROM lesson_completions lc
          JOIN lessons l ON l.id = lc.lesson_id
          WHERE lc.user_id = ${userId}
            AND lc.completed_at >= '${oneWeekAgo.toISOString().slice(0, 19).replace("T", " ")}'
        `);

        const totalMinutes = (rows || []).reduce(
          (sum, r) => sum + (Number(r.duration_minutes) || 30),
          0
        );
        // Return fractional hours rounded to 1 decimal
        return Math.round((totalMinutes / 60) * 10) / 10;
      }

      return 0;
    } catch (error) {
      console.error("Error calculating goal progress:", error);
      return 0;
    }
  }

  /**
   * Set or update learning goal
   * 
   * @param {number} userId - The user ID
   * @param {LearningGoal} goal - The learning goal
   * @returns {Promise<LearningGoal>}
   * 
   * Requirements: 8.12, 8.13
   */
  async setLearningGoal(userId, goal) {
    try {
      // Validate goal type
      if (!["lessons_per_week", "hours_per_week"].includes(goal.type)) {
        throw new Error("Invalid goal type");
      }

      // Validate target value
      if (!goal.target || goal.target <= 0) {
        throw new Error("Target value must be greater than 0");
      }

      // Upsert goal
      const [learningGoal, created] = await db.learning_goals.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          goal_type: goal.type,
          target_value: goal.target,
        },
      });

      if (!created) {
        // Update existing goal
        await learningGoal.update({
          goal_type: goal.type,
          target_value: goal.target,
        });
      }

      // Calculate current progress
      const current = await this._calculateGoalProgress(userId, goal.type);

      return {
        type: learningGoal.goal_type,
        target: learningGoal.target_value,
        current,
      };
    } catch (error) {
      console.error("Error setting learning goal:", error);
      throw error;
    }
  }

  /**
   * Get achievements earned by a user
   * 
   * @param {number} userId - The user ID
   * @returns {Promise<Array<Achievement>>}
   * 
   * Requirements: 8.10, 8.11
   */
  async getUserAchievements(userId) {
    try {
      const userAchievements = await db.user_achievements.findAll({
        where: { user_id: userId },
        include: [
          {
            model: db.achievements,
            as: "achievement",
          },
        ],
        order: [["earned_at", "DESC"]],
      });

      return userAchievements.map((ua) => ({
        id: ua.achievement.id,
        title: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        earnedAt: ua.earned_at ? ua.earned_at.toISOString() : new Date().toISOString(),
        rarity: ua.achievement.rarity || 'common',
        category: ua.achievement.category || '',
      }));
    } catch (error) {
      console.error("Error getting user achievements:", error);
      
      // If table doesn't exist yet (migrations not run), return empty array
      if (error.message && error.message.includes("doesn't exist")) {
        console.warn("Achievements tables not yet created - returning empty array");
        return [];
      }
      
      throw error;
    }
  }
  /**
   * Change user password
   * Verifies current password and updates to new password
   * 
   * @param {number} userId - The user ID
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password to set
   * @returns {Promise<void>}
   * @throws {Error} If user not found or current password is incorrect
   * 
   * Requirements: Password change functionality
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      console.log(`[ProfileService] Changing password for user ${userId}`);
      
      // Get user with password for verification
      const user = await db.users.findByPk(userId, {
        attributes: ["id", "email", "password"],
      });

      if (!user) {
        console.error(`[ProfileService] User ${userId} not found`);
        throw new Error("User not found");
      }

      // Verify current password
      const PasswordService = require("./PasswordService");
      const isCurrentPasswordValid = await PasswordService.compareHash(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        console.error(`[ProfileService] Current password incorrect for user ${userId}`);
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const hashedNewPassword = await PasswordService.hash(newPassword);

      // Update password in database
      await user.update({
        password: hashedNewPassword,
      });

      console.log(`[ProfileService] Successfully changed password for user ${userId}`);
    } catch (error) {
      console.error("[ProfileService] Error changing password:", error);
      console.error("[ProfileService] Error stack:", error.stack);
      throw error;
    }
  }
}

module.exports = new ProfileService();
