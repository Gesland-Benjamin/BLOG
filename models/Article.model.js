import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Article = sequelize.define(
  "Article",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id"
    },

    categorieId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "categorie_id"
    },

    titre: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.title;
      }
    },

    contenu: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.content;
      }
    },

    date_publication: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.createdAt || this.created_at || null;
      }
    },

    auteur: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.author?.nom_prenom || this.author?.name || null;
      }
    },

  },
  {
    tableName: "articles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true
  }
);

export default Article;