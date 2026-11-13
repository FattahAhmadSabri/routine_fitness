const { DataTypes } = require("sequelize");
const sequelize = require("../utils/dbConfig");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Name cannot be empty",
        },
        len: {
          args: [2, 50],
          msg: "Name must be between 2 and 50 characters",
        },
      },
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Please enter a valid email",
        },
      },
    },

    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Age must be greater than zero",
        },
      },
    },
    gender: {
    type: DataTypes.ENUM("male", "female"),
    allowNull: false
},
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
      validate: {
        isIn: {
          args: [["user", "admin"]],
          msg: "Role must be either user or admin",
        },
      },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    isPremium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

module.exports = User;
