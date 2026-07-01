module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'testimonial_submissions',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      collection_link_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'testimonial_collection_links',
          key: 'id',
        },
      },
      learner_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      testimonial_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'testimonials',
          key: 'id',
        },
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'testimonial_submissions',
      timestamps: false,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'idx_ts_link_learner',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'collection_link_id' }, { name: 'learner_user_id' }],
        },
        {
          name: 'idx_ts_collection_link_id',
          using: 'BTREE',
          fields: [{ name: 'collection_link_id' }],
        },
        {
          name: 'idx_ts_learner_user_id',
          using: 'BTREE',
          fields: [{ name: 'learner_user_id' }],
        },
      ],
    },
  );
};
