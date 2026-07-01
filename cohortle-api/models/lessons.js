const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "lessons",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      week_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "weeks",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      content_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      caption_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      transcript_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      has_captions: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "lessons",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_lessons_week_id",
          using: "BTREE",
          fields: [{ name: "week_id" }],
        },
      ],
    },
  );
};
