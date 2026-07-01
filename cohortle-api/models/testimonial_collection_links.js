module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'testimonial_collection_links',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'cohorts',
          key: 'id',
        },
      },
      convener_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      auto_approve: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'testimonial_collection_links',
      timestamps: false,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'idx_tcl_token',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'token' }],
        },
        {
          name: 'idx_tcl_cohort_convener',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'cohort_id' }, { name: 'convener_user_id' }],
        },
        {
          name: 'idx_tcl_convener_user_id',
          using: 'BTREE',
          fields: [{ name: 'convener_user_id' }],
        },
      ],
    },
  );
};
