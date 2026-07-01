const Sequelize = require("sequelize");

/**
 * Learning Unit Model (stored in programme_modules table)
 * 
 * A Learning Unit is a collection of related lessons on a specific topic.
 * Previously called "Module" in the UI, now displayed as "Learning Unit".
 * 
 * Note: The database table name remains "programme_modules" for backward compatibility.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "programme_modules",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            programme_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "programmes",
                    key: "id",
                },
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING(255),
                allowNull: false,
                defaultValue: "active",
            },
            order_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            tableName: "programme_modules",
            timestamps: true,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [{ name: "id" }],
                },
                {
                    name: "idx_programme_id",
                    using: "BTREE",
                    fields: [{ name: "programme_id" }],
                },
            ],
        },
    );
};
