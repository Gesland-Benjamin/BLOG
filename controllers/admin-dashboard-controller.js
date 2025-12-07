import Article from "../models/Article.model.js";
import Commentaire from "../models/Commentaire.model.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import User from "../models/User.model.js";

export const getDashboard = async (req, res) => {
  try {
    // Statistiques générales
    const totalArticles = await Article.count();
    const totalCommentaires = await Commentaire.count();
    const commentairesPending = await Commentaire.count({ where: { statut: "pending" } });
    const totalAbonnes = await NewsletterSubscriber.count();
    
    // Articles récents
    const recentArticles = await Article.findAll({
      include: [
        { model: User, as: "auteur", attributes: ['nom_prenom'] }
      ],
      order: [["date_publication", "DESC"]],
      limit: 5
    });

    // Commentaires en attente
    const pendingComments = await Commentaire.findAll({
      where: { statut: "pending" },
      include: [
        { model: Article, as: "article", attributes: ['id', 'titre'] }
      ],
      order: [["date", "DESC"]],
      limit: 5
    });

    // Derniers abonnés
    const recentSubscribers = await NewsletterSubscriber.findAll({
      order: [["date_inscription", "DESC"]],
      limit: 5
    });

    // Articles les plus likés
    const topArticles = await Article.findAll({
      include: [
        { model: User, as: "auteur", attributes: ['nom_prenom'] }
      ],
      order: [["likes", "DESC"]],
      limit: 5
    });

    res.render("admin-dashboard", {
      stats: {
        totalArticles,
        totalCommentaires,
        commentairesPending,
        totalAbonnes
      },
      recentArticles,
      pendingComments,
      recentSubscribers,
      topArticles
    });
  } catch (error) {
    console.error("Erreur getDashboard:", error);
    res.status(500).send("Erreur lors du chargement du dashboard");
  }
};
