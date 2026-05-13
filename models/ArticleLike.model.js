import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ArticleLike = sequelize.define(
  "ArticleLike",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "article_id"
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id"
    },
    ip: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  },
  {
    tableName: "article_likes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true
  }
);

export default ArticleLike;
