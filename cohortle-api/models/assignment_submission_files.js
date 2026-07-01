const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'assignment_submission_files',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      submission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'assignment_submissions', key: 'id' },
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'assignment_submission_files',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: 'idx_assignment_submission_files_submission_id',
          fields: ['submission_id'],
        },
      ],
    }
  );
};
