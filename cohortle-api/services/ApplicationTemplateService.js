'use strict';

const db = require('../models');

/**
 * Manages application template questions for a programme.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

/**
 * Get all template questions for a programme, ordered by order_index ASC.
 * @param {number} programmeId
 * @returns {Promise<Array>}
 */
async function getTemplate(programmeId) {
  return db.application_template_questions.findAll({
    where: { programme_id: programmeId },
    order: [['order_index', 'ASC']],
  });
}

/**
 * Save (upsert) template questions for a programme.
 * Existing questions are updated; new ones are created; removed ones are deleted.
 * IMPORTANT: Does NOT modify existing application responses — only the template is changed.
 * @param {number} programmeId
 * @param {Array<Object>} questions - Array of question objects
 * @returns {Promise<Array>} Updated list of questions
 */
async function saveTemplate(programmeId, questions) {
  const incomingIds = questions.filter((q) => q.id).map((q) => q.id);

  // Delete questions that are no longer in the incoming list
  await db.application_template_questions.destroy({
    where: {
      programme_id: programmeId,
      ...(incomingIds.length > 0
        ? { id: { [db.Sequelize.Op.notIn]: incomingIds } }
        : {}),
    },
  });

  // Upsert each question
  const saved = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const data = {
      programme_id: programmeId,
      question_text: q.question_text,
      question_type: q.question_type || 'textarea',
      is_required: q.is_required !== undefined ? q.is_required : true,
      options: q.options || null,
      order_index: q.order_index !== undefined ? q.order_index : i,
      updated_at: new Date(),
    };

    if (q.id) {
      const existing = await db.application_template_questions.findByPk(q.id);
      if (existing) {
        await existing.update(data);
        saved.push(existing);
        continue;
      }
    }

    // Create new
    data.created_at = new Date();
    const created = await db.application_template_questions.create(data);
    saved.push(created);
  }

  return saved;
}

/**
 * Reorder questions by updating their order_index values.
 * @param {number} programmeId
 * @param {Array<string>} orderedIds - Question IDs in the desired order
 * @returns {Promise<void>}
 */
async function reorderQuestions(programmeId, orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.application_template_questions.update(
      { order_index: i, updated_at: new Date() },
      { where: { id: orderedIds[i], programme_id: programmeId } }
    );
  }
}

module.exports = { getTemplate, saveTemplate, reorderQuestions };
