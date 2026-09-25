import { DataTypes } from "sequelize";
import { newSlug } from "../utils/seo.js";
import sequelize from "../config/database.js";

const Article = sequelize.define(
  "Article",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    slug: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    seo_title: { type: DataTypes.STRING(255), allowNull: true },
    meta_description: { type: DataTypes.STRING(320), allowNull: true },
    image_alt: { type: DataTypes.STRING(255), allowNull: true },
    is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    related_article_ids: { type: DataTypes.JSON, allowNull: true },
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

    video: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    image_inline: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "image_inline"
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
        return this.published_at || this.createdAt || this.created_at || null;
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
    defaultScope: { where: { is_published: true } },
    hooks: {
      beforeValidate(article) {
        if (article.isNewRecord && !article.slug) article.slug = newSlug(article.title);
        if (article.isNewRecord && article.is_published !== false && !article.published_at) article.published_at = new Date();
      }
    },
    tableName: "articles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true
  }
);

export default Article;