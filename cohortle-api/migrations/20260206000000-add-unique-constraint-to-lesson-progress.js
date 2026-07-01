'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addConstraint('lesson_progress', {
            fields: ['user_id', 'lesson_id', 'cohort_id'],
            type: 'unique',
            name: 'unique_user_lesson_cohort'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('lesson_progress', 'unique_user_lesson_cohort');
    }
};
