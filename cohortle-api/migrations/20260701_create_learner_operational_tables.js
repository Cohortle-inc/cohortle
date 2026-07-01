'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create learner_notes table
      await queryInterface.createTable(
        'learner_notes',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'enrollments', key: 'id' },
            comment: 'Foreign key to enrollments'
          },
          note_type: {
            type: Sequelize.ENUM('support', 'intervention', 'engagement', 'achievement', 'issue', 'follow_up', 'general'),
            allowNull: false,
            defaultValue: 'general',
            comment: 'Category of the note'
          },
          content: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'Note content'
          },
          created_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'User ID who created the note'
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          linked_entity_type: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Type of entity this note relates to (lesson, assignment, etc.)'
          },
          linked_entity_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'ID of the linked entity'
          }
        },
        { transaction }
      );

      await queryInterface.addIndex('learner_notes', ['enrollment_id'], { transaction });
      await queryInterface.addIndex('learner_notes', ['note_type'], { transaction });
      await queryInterface.addIndex('learner_notes', ['created_by'], { transaction });
      await queryInterface.addIndex('learner_notes', ['created_at'], { transaction });

      // Create learner_communication_events table
      await queryInterface.createTable(
        'learner_communication_events',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'enrollments', key: 'id' },
            comment: 'Foreign key to enrollments'
          },
          channel: {
            type: Sequelize.ENUM('email', 'in_app', 'sms', 'notification'),
            allowNull: false,
            comment: 'Communication channel'
          },
          template_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'ID of the communication template used'
          },
          subject: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Email subject or notification title'
          },
          body_preview: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Preview of message body'
          },
          created_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'User ID who sent the communication'
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          delivery_status: {
            type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'bounced'),
            defaultValue: 'pending',
            comment: 'Delivery status'
          },
          delivery_timestamp: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When the message was actually delivered'
          },
          read_at: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When learner read the message (if trackable)'
          }
        },
        { transaction }
      );

      await queryInterface.addIndex('learner_communication_events', ['enrollment_id'], { transaction });
      await queryInterface.addIndex('learner_communication_events', ['channel'], { transaction });
      await queryInterface.addIndex('learner_communication_events', ['created_by'], { transaction });
      await queryInterface.addIndex('learner_communication_events', ['delivery_status'], { transaction });
      await queryInterface.addIndex('learner_communication_events', ['created_at'], { transaction });

      // Create learner_attendance table
      await queryInterface.createTable(
        'learner_attendance',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'enrollments', key: 'id' }
          },
          cohort_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'cohorts', key: 'id' }
          },
          event_type: {
            type: Sequelize.ENUM('live_session', 'workshop', 'office_hours', 'group_activity', 'milestone_check_in'),
            allowNull: false,
            comment: 'Type of event'
          },
          event_date: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Date/time of the event'
          },
          status: {
            type: Sequelize.ENUM('attended', 'absent', 'late', 'excused', 'pending'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Attendance status'
          },
          recorded_by: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'User ID who recorded attendance'
          },
          recorded_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          notes: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Additional notes about attendance'
          }
        },
        { transaction }
      );

      await queryInterface.addIndex('learner_attendance', ['enrollment_id'], { transaction });
      await queryInterface.addIndex('learner_attendance', ['cohort_id'], { transaction });
      await queryInterface.addIndex('learner_attendance', ['event_date'], { transaction });
      await queryInterface.addIndex('learner_attendance', ['status'], { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('learner_attendance', { transaction });
      await queryInterface.dropTable('learner_communication_events', { transaction });
      await queryInterface.dropTable('learner_notes', { transaction });
    });
  }
};
