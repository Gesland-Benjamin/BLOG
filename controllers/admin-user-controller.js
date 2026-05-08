import User from "../models/User.model.js";
import Article from "../models/Article.model.js";
import Commentaire from "../models/Commentaire.model.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import sequelize from "../config/database.js";

export const deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = parseInt(req.params.id, 10);

    if (Number.isNaN(userId)) {
      req.session.message = { type: "error", text: "ID utilisateur invalide" };
      return res.redirect("/admin/dashboard");
    }

    // 🔒 empêcher auto suppression
    if (req.user && req.user.id === userId) {
      req.session.message = { type: "error", text: "Vous ne pouvez pas supprimer votre propre compte" };
      return res.redirect("/admin/dashboard");
    }

    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      req.session.message = { type: "error", text: "Utilisateur introuvable" };
      return res.redirect("/admin/dashboard");
    }

    // 🔥 protection admin
    if (user.role === "admin") {
      const adminCount = await User.count({
        where: { role: "admin" },
        transaction
      });

      if (adminCount <= 1) {
        req.session.message = {
          type: "error",
          text: "Impossible de supprimer le dernier administrateur"
        };
        return res.redirect("/admin/dashboard");
      }
    }

    // =========================
    // CLEAN DATA
    // =========================

    // 🔹 supprimer commentaires
    await Commentaire.destroy({
      where: { userId },
      transaction
    });

    // 🔹 supprimer abonnements newsletter liés
    await NewsletterSubscriber.destroy({
      where: { user_id: userId },
      transaction
    });

    // 🔹 supprimer articles (ou tu peux choisir de les anonymiser)
    await Article.destroy({
      where: { userId },
      transaction
    });

    // 🔹 supprimer user
    await user.destroy({ transaction });

    await transaction.commit();

    req.session.message = {
      type: "success",
      text: "Utilisateur supprimé avec succès"
    };

    res.redirect("/admin/dashboard");

  } catch (error) {
    await transaction.rollback();

    console.error("❌ deleteUser:", error);

    req.session.message = {
      type: "error",
      text: "Erreur lors de la suppression de l'utilisateur"
    };

    res.redirect("/admin/dashboard");
  }
};