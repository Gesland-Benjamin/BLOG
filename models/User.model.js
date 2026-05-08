import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    role: {
      type: DataTypes.ENUM("visiteur", "admin"),
      allowNull: false,
      defaultValue: "visiteur"
    },

    nom_prenom: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.name;
      }
    }
  },
  {
    tableName: "users",

    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // ⚠️ conseillé dans ton cas : évite conflits avec foreign keys
    underscored: true,

    defaultScope: {
      attributes: { exclude: ["password"] }
    },

    scopes: {
      withPassword: {
        attributes: {}
      }
    }
  }
);

export default User;