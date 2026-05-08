import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Categorie = sequelize.define(
  "Categorie",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    nom: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.name;
      }
    }
  },
  {
    tableName: "categories",

    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    underscored: true
  }
);

export default Categorie;