import {
  User,
  Article,
  Commentaire,
  Categorie
} from "../models/index.js";

import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import { createPaginationData } from "../utils/pagination.js";
import { formatDate } from "../utils/date.js";

export const getDashboard = async (req, res) => {
  try {
    // 🔥 GLOBAL PAGE SIZE = 5 PARTOUT
    const pageSize = 5;

    const userPage = Math.max(parseInt(req.query.userPage) || 1, 1);
    const commentPage = Math.max(parseInt(req.query.commentPage) || 1, 1);
    const subscriberPage = Math.max(parseInt(req.query.subscriberPage) || 1, 1);
    const categoriesPage = Math.max(parseInt(req.query.categoriesPage) || 1, 1);

    // =========================
    // STATS
    // =========================
    const [
      totalUsers,
      totalArticles,
      totalCommentaires,
      commentairesPending,
      totalAbonnes
    ] = await Promise.all([
      User.count(),
      Article.count(),
      Commentaire.count(),
      Commentaire.count({ where: { statut: "pending" } }),
      NewsletterSubscriber.count()
    ]);

    console.log("📊 Dashboard stats loaded");

    // =========================
    // USERS
    // =========================
    const { count: usersCount, rows: users } = await User.findAndCountAll({
      attributes: ["id", "name", "email", "role"],
      order: [["id", "DESC"]],
      limit: pageSize,
      offset: (userPage - 1) * pageSize
    });

    console.log(`👤 Users loaded: ${users.length}/${usersCount}`);

    // =========================
    // ARTICLES RECENTS
    // =========================
    const recentArticles = await Article.findAll({
      attributes: ["id", "title", "likes", "created_at"],
      include: [
        { model: User, as: "author", attributes: ["id", "name"] },
        { model: Categorie, as: "categorie", attributes: ["id", "name"] }
      ],
      order: [["created_at", "DESC"]],
      limit: pageSize
    });

    console.log(`📰 Recent articles loaded: ${recentArticles.length}`);

    const recentArticlesWithDates = recentArticles.map(article => ({
      ...article.toJSON(),
      created_at_formatted: formatDate(article.created_at, 'fr-FR')
    }));

    // =========================
    // COMMENTS
    // =========================
    const { count: commentsCount, rows: pendingComments } =
      await Commentaire.findAndCountAll({
        where: { statut: "pending" },
        include: [
          { model: Article, as: "article", attributes: ["id", "title"] },
          { model: User, as: "user", attributes: ["id", "name"] }
        ],
        order: [["created_at", "DESC"]],
        limit: pageSize,
        offset: (commentPage - 1) * pageSize
      });

    console.log(`💬 Pending comments: ${pendingComments.length}/${commentsCount}`);

    // =========================
    // SUBSCRIBERS
    // =========================
    const { count: subCount, rows: recentSubscribers } =
      await NewsletterSubscriber.findAndCountAll({
        attributes: ["id", "email", "date_inscription"],
        order: [["date_inscription", "DESC"]],
        limit: pageSize,
        offset: (subscriberPage - 1) * pageSize
      });

    console.log(`📧 Subscribers loaded: ${recentSubscribers.length}/${subCount}`);

    const recentSubscribersWithDates = recentSubscribers.map(subscriber => ({
      ...subscriber.toJSON(),
      date_inscription_formatted: formatDate(subscriber.date_inscription, 'fr-FR')
    }));

    // =========================
    // TOP ARTICLES
    // =========================
    const topArticles = await Article.findAll({
      attributes: ["id", "title", "likes"],
      order: [["likes", "DESC"]],
      limit: pageSize
    });

    console.log(`🔥 Top articles loaded: ${topArticles.length}`);

    // =========================
    // CATEGORIES
    // =========================
    const categoriesCount = await Categorie.count();

    const { rows: categories } = await Categorie.findAndCountAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      limit: pageSize,
      offset: (categoriesPage - 1) * pageSize
    });

    console.log(`🏷️ Categories loaded: ${categories.length}/${categoriesCount}`);

    // =========================
    // PAGINATION
    // =========================
    const usersPagination = createPaginationData(
      usersCount,
      userPage,
      pageSize,
      "/admin/dashboard",
      "userPage"
    );

    const commentsPagination = createPaginationData(
      commentsCount,
      commentPage,
      pageSize,
      "/admin/dashboard",
      "commentPage"
    );

    const subscribersPagination = createPaginationData(
      subCount,
      subscriberPage,
      pageSize,
      "/admin/dashboard",
      "subscriberPage"
    );

    const categoriesPagination = createPaginationData(
      categoriesCount,
      categoriesPage,
      pageSize,
      "/admin/dashboard",
      "categoriesPage"
    );

    console.log("📄 Pagination generated");

    // =========================
    // RENDER
    // =========================
    return res.render("admin-dashboard", {
      stats: {
        totalUsers,
        totalArticles,
        totalCommentaires,
        commentairesPending,
        totalAbonnes
      },

      users,
      recentArticles: recentArticlesWithDates,
      pendingComments,
      topArticles,
      recentSubscribers: recentSubscribersWithDates,
      categories,

      usersPagination,
      commentsPagination,
      subscribersPagination,
      categoriesPagination
    });

  } catch (error) {
    console.error("❌ Dashboard error:", error);

    return res.status(500).render("500", {
      message: "Erreur dashboard",
      error: error.message
    });
  }
};