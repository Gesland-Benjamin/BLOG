import sequelize from "../config/database.js";

import User from "./User.model.js";
import Categorie from "./Categorie.model.js";
import Article from "./Article.model.js";
import Commentaire from "./Commentaire.model.js";

// =========================
// INIT ASSOCIATIONS SAFE
// =========================
export function initAssociations() {
  if (sequelize.models._associationsInitialized) return;
  sequelize.models._associationsInitialized = true;

  // =========================
  // USER ↔ ARTICLE
  // =========================
  User.hasMany(Article, {
    foreignKey: "userId",
    as: "authoredArticles"
  });

  Article.belongsTo(User, {
    foreignKey: "userId",
    as: "author"
  });

  // =========================
  // CATEGORIE ↔ ARTICLE
  // =========================
 Categorie.hasMany(Article, {
  foreignKey: "categorieId",
  as: "categoryArticles"
});

Article.belongsTo(Categorie, {
  foreignKey: "categorieId",
  as: "categorie"
});

  // =========================
  // ARTICLE ↔ COMMENTAIRE
  // =========================
  Article.hasMany(Commentaire, {
    foreignKey: "articleId",
    as: "commentaires"
  });

  Commentaire.belongsTo(Article, {
    foreignKey: "articleId",
    as: "article"
  });

  // =========================
  // USER ↔ COMMENTAIRE
  // =========================
  User.hasMany(Commentaire, {
    foreignKey: "userId",
    as: "commentaires"
  });

  Commentaire.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });

  // =========================
  // SELF COMMENTAIRE
  // =========================
  Commentaire.hasMany(Commentaire, {
    foreignKey: "parentId",
    as: "replies"
  });

  Commentaire.belongsTo(Commentaire, {
    foreignKey: "parentId",
    as: "parent"
  });
}

// =========================
// EXPORTS
// =========================
export {
  sequelize,
  User,
  Article,
  Categorie,
  Commentaire
};