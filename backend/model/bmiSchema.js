
const { DataTypes } = require("sequelize");
const sequelize = require("../utils/dbConfig");

const BMI = sequelize.define(
    "BMI",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: true
        },

        age: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        weight: {
            type: DataTypes.FLOAT,
            allowNull: false
        },

        height: {
            type: DataTypes.FLOAT,
            allowNull: false
        },

        bmIndex: {
            type: DataTypes.FLOAT,
            allowNull: true
        },

        bmr: {
            type: DataTypes.FLOAT,
            allowNull: true
        },

        bfp: {
            type: DataTypes.FLOAT,
            allowNull: true
        },

        gender: {
            type: DataTypes.ENUM("male", "female"),
            allowNull: false
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: "bmis",
        timestamps: false,

        indexes: [
            {
                fields: ["name"]
            },
            {
                fields: ["age"]
            },
            {
                fields: ["age", "bmIndex"]
            }
        ]
    }
);

module.exports = BMI;


