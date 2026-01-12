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
    

    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const pageSize = 5;

    // Articles récents
    const recentArticlesCount = await Article.count();
    const recentArticles = await Article.findAll({
      attributes: ['id', 'titre', 'date_publication', 'auteur_id', 'likes'],
      include: [
        { model: User, as: "auteur", attributes: ['nom_prenom'] }
      ],
      order: [["date_publication", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
    const recentArticlesPagination = {
      total: Math.ceil(recentArticlesCount / pageSize),
      total_items: recentArticlesCount,
      pages: Array.from({length: Math.ceil(recentArticlesCount / pageSize)}, (_, i) => ({
        number: i + 1,
        url: `/admin/dashboard?page=${i + 1}`,
        isActive: page === i + 1
      })),
      has_previous: page > 1,
      has_next: page < Math.ceil(recentArticlesCount / pageSize),
      previous_url: page > 1 ? `/admin/dashboard?page=${page - 1}` : null,
      next_url: page < Math.ceil(recentArticlesCount / pageSize) ? `/admin/dashboard?page=${page + 1}` : null,
      start_item: (page - 1) * pageSize + 1,
      end_item: Math.min(page * pageSize, recentArticlesCount)
    };

    // Commentaires en attente
    const pendingCommentsCount = await Commentaire.count({ where: { statut: "pending" } });
    const pendingComments = await Commentaire.findAll({
      where: { statut: "pending" },
      include: [
        { model: Article, as: "article", attributes: ['id', 'titre'] }
      ],
      order: [["date", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
    const pendingCommentsPagination = {
      total: Math.ceil(pendingCommentsCount / pageSize),
      total_items: pendingCommentsCount,
      pages: Array.from({length: Math.ceil(pendingCommentsCount / pageSize)}, (_, i) => ({
        number: i + 1,
        url: `/admin/dashboard?page=${i + 1}`,
        isActive: page === i + 1
      })),
      has_previous: page > 1,
      has_next: page < Math.ceil(pendingCommentsCount / pageSize),
      previous_url: page > 1 ? `/admin/dashboard?page=${page - 1}` : null,
      next_url: page < Math.ceil(pendingCommentsCount / pageSize) ? `/admin/dashboard?page=${page + 1}` : null,
      start_item: (page - 1) * pageSize + 1,
      end_item: Math.min(page * pageSize, pendingCommentsCount)
    };

    // Derniers abonnés
    const recentSubscribersCount = await NewsletterSubscriber.count();
    const recentSubscribers = await NewsletterSubscriber.findAll({
      order: [["date_inscription", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
    const recentSubscribersPagination = {
      total: Math.ceil(recentSubscribersCount / pageSize),
      total_items: recentSubscribersCount,
      pages: Array.from({length: Math.ceil(recentSubscribersCount / pageSize)}, (_, i) => ({
        number: i + 1,
        url: `/admin/dashboard?page=${i + 1}`,
        isActive: page === i + 1
      })),
      has_previous: page > 1,
      has_next: page < Math.ceil(recentSubscribersCount / pageSize),
      previous_url: page > 1 ? `/admin/dashboard?page=${page - 1}` : null,
      next_url: page < Math.ceil(recentSubscribersCount / pageSize) ? `/admin/dashboard?page=${page + 1}` : null,
      start_item: (page - 1) * pageSize + 1,
      end_item: Math.min(page * pageSize, recentSubscribersCount)
    };

    // Articles les plus likés
    const topArticlesCount = await Article.count();
    const topArticles = await Article.findAll({
      attributes: ['id', 'titre', 'likes', 'auteur_id'],
      include: [
        { model: User, as: "auteur", attributes: ['nom_prenom'] }
      ],
      order: [["likes", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
    const topArticlesPagination = {
      total: Math.ceil(topArticlesCount / pageSize),
      total_items: topArticlesCount,
      pages: Array.from({length: Math.ceil(topArticlesCount / pageSize)}, (_, i) => ({
        number: i + 1,
        url: `/admin/dashboard?page=${i + 1}`,
        isActive: page === i + 1
      })),
      has_previous: page > 1,
      has_next: page < Math.ceil(topArticlesCount / pageSize),
      previous_url: page > 1 ? `/admin/dashboard?page=${page - 1}` : null,
      next_url: page < Math.ceil(topArticlesCount / pageSize) ? `/admin/dashboard?page=${page + 1}` : null,
      start_item: (page - 1) * pageSize + 1,
      end_item: Math.min(page * pageSize, topArticlesCount)
    };

    res.render("admin-dashboard", {
      stats: {
        totalArticles,
        totalCommentaires,
        commentairesPending,
        totalAbonnes
      },
      recentArticles,
      recentArticlesPagination,
      pendingComments,
      pendingCommentsPagination,
      recentSubscribers,
      recentSubscribersPagination,
      topArticles,
      topArticlesPagination
    });
  } catch (error) {
    console.error("Erreur getDashboard:", error);
    res.status(500).send("Erreur lors du chargement du dashboard");
  }
};
