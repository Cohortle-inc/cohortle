'use strict';

/**
 * Verification Tokens Model
 * 
 * Stores email verification tokens with expiration tracking.
 * Used for verifying user email addresses during signup and resend flows.
 * 
 * Requirements: 4.1, 7.1, 7.2, 7.3
 */

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VerificationToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Belongs to User
      VerificationToken.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }

    /**
     * Check if token is expired
     * @returns {boolean} True if token has expired
     */
    isExpired() {
      return new Date() > new Date(this.expires_at);
    }

    /**
     * Check if token has been used
     * @returns {boolean} True if token has been used
     */
    isUsed() {
      return this.used_at !== null;
    }

    /**
     * Check if token is valid (not expired and not used)
     * @returns {boolean} True if token is valid
     */
    isValid() {
      return !this.isExpired() && !this.isUsed();
    }

    /**
     * Mark token as used
     * @returns {Promise<VerificationToken>} Updated token instance
     */
    async markAsUsed() {
      this.used_at = new Date();
      return await this.save();
    }
  }

  VerificationToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [64, 64], // Token should be exactly 64 characters (32 bytes hex)
        },
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isAfterNow(value) {
            if (new Date(value) <= new Date()) {
              throw new Error('Expiration date must be in the future');
            }
          },
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
          isDate: true,
        },
      },
    },
    {
      sequelize,
      modelName: 'verification_tokens',
      tableName: 'verification_tokens',
      timestamps: false, // We manage timestamps manually
      indexes: [
        {
          name: 'idx_verification_tokens_token',
          fields: ['token'],
        },
        {
          name: 'idx_verification_tokens_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_verification_tokens_expires_at',
          fields: ['expires_at'],
        },
      ],
    }
  );

  return VerificationToken;
};
