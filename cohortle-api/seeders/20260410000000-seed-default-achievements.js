"use strict";

/**
 * Seeder for default achievement definitions
 * This seeder is idempotent — it uses findOrCreate keyed on `name`
 * so it can be run multiple times safely without duplicating rows.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const defaultAchievements = [
  {
    name: "First Step",
    description: "Complete your very first lesson.",
    icon: "",
    criteria: JSON.stringify({ type: "first_lesson", threshold: 1 }),
    rarity: "common",
    category: "first",
  },
  {
    name: "Getting Started",
    description: "Complete 5 lessons.",
    icon: "",
    criteria: JSON.stringify({ type: "lessons_completed", threshold: 5 }),
    rarity: "common",
    category: "learning",
  },
  {
    name: "On a Roll",
    description: "Complete 10 lessons.",
    icon: "",
    criteria: JSON.stringify({ type: "lessons_completed", threshold: 10 }),
    rarity: "common",
    category: "learning",
  },
  {
    name: "Dedicated Learner",
    description: "Complete 25 lessons.",
    icon: "",
    criteria: JSON.stringify({ type: "lessons_completed", threshold: 25 }),
    rarity: "rare",
    category: "learning",
  },
  {
    name: "Century Club",
    description: "Complete 100 lessons.",
    icon: "",
    criteria: JSON.stringify({ type: "lessons_completed", threshold: 100 }),
    rarity: "epic",
    category: "milestone",
  },
  {
    name: "3-Day Streak",
    description: "Maintain a learning streak for 3 consecutive days.",
    icon: "",
    criteria: JSON.stringify({ type: "streak_days", threshold: 3 }),
    rarity: "common",
    category: "streak",
  },
  {
    name: "Week Warrior",
    description: "Maintain a learning streak for 7 consecutive days.",
    icon: "",
    criteria: JSON.stringify({ type: "streak_days", threshold: 7 }),
    rarity: "rare",
    category: "streak",
  },
  {
    name: "Month Master",
    description: "Maintain a learning streak for 30 consecutive days.",
    icon: "",
    criteria: JSON.stringify({ type: "streak_days", threshold: 30 }),
    rarity: "epic",
    category: "streak",
  },
  {
    name: "Consistent Learner",
    description: "Be active on 14 distinct days.",
    icon: "",
    criteria: JSON.stringify({ type: "days_active", threshold: 14 }),
    rarity: "rare",
    category: "consistency",
  },
  {
    name: "Programme Graduate",
    description: "Complete your first programme.",
    icon: "",
    criteria: JSON.stringify({ type: "programmes_completed", threshold: 1 }),
    rarity: "rare",
    category: "completion",
  },
  {
    name: "Double Graduate",
    description: "Complete two programmes.",
    icon: "",
    criteria: JSON.stringify({ type: "programmes_completed", threshold: 2 }),
    rarity: "epic",
    category: "completion",
  },
  {
    name: "Legend",
    description: "Complete 500 lessons.",
    icon: "",
    criteria: JSON.stringify({ type: "lessons_completed", threshold: 500 }),
    rarity: "legendary",
    category: "milestone",
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Seeding default achievements...");

    for (const achievement of defaultAchievements) {
      const [, created] = await queryInterface.sequelize.query(
        `INSERT IGNORE INTO achievements (id, name, description, icon, criteria, rarity, category)
         VALUES (UUID(), :name, :description, :icon, :criteria, :rarity, :category)`,
        {
          replacements: achievement,
          type: Sequelize.QueryTypes.INSERT,
        }
      );

      if (created) {
        console.log(`  Created achievement: ${achievement.name}`);
      } else {
        console.log(`  Skipped (already exists): ${achievement.name}`);
      }
    }

    console.log("Default achievements seeded successfully!");
  },

  async down(queryInterface, Sequelize) {
    const names = defaultAchievements.map((a) => a.name);
    await queryInterface.sequelize.query(
      `DELETE FROM achievements WHERE name IN (:names)`,
      {
        replacements: { names },
        type: Sequelize.QueryTypes.DELETE,
      }
    );
    console.log("Default achievements removed.");
  },
};
