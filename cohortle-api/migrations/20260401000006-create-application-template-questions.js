'use strict';

/**
 * Migration: Create application_template_questions table
 *
 * Stores the convener-defined questions for a programme's application form.
 *
 * Columns:
 *   id            UUID PK
 *   programme_id  INT NOT NULL FK → programmes(id)
 *   question_text TEXT NOT NULL
 *   question_type ENUM-like STRING: text|textarea|select|multiselect
 *   is_required   BOOLEAN NOT NULL DEFAULT TRUE
 *   options       JSON NULL — for select/multiselect types
 *   order_index   INT NOT NULL DEFAULT 0
 *   created_at    TIMESTAMP NOT NULL DEFAULT NOW()
 *   updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
 *
 * Requirements: 3.2
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('application_template_questions')) {
      console.log('Table application_template_questions already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('application_template_questions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      programme_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'programmes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Programme this question belongs to',
      },

      question_text: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'The question text shown to applicants',
      },

      question_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'textarea',
        comment: 'Input type: text | textarea | select | multiselect',
      },

      is_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the applicant must answer this question',
      },

      options: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of option strings for select/multiselect types',
      },

      order_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Display order within the form (ascending)',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('application_template_questions', ['programme_id'], {
      name: 'idx_template_questions_programme_id',
    }).catch(() => {
      console.log('Index idx_template_questions_programme_id already exists');
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE application_template_questions
      ADD CONSTRAINT chk_question_type
      CHECK (question_type IN ('text', 'textarea', 'select', 'multiselect'))
    `).catch(() => {
      console.log('Constraint chk_question_type could not be created');
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('application_template_questions', 'idx_template_questions_programme_id').catch(() => {});
    await queryInterface.dropTable('application_template_questions');
  },
};
