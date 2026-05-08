import { Op } from "sequelize";
import { Article, User, Categorie } from "../models/index.js";

// =========================
// HOME
// =========================
export const getHomePage = async (req, res) => {
  try {
    const recentArticles = await Article.findAll({
      include: [
        { model: User, as: "author", attributes: ["id", "name"] },
        { model: Categorie, as: "categorie", attributes: ["id", "name"] }
      ],
      order: [["created_at", "DESC"]],
      limit: 3
    });

    const recentPosts = recentArticles.map((a) => ({
      id: a.id,
      titre: a.title,
      extrait: (a.content || "").substring(0, 120),
      date: a.created_at,
      image: a.image,
      categorie: a.categorie?.name || null,
      auteur: a.author?.name || "Inconnu"
    }));

    const latest = recentArticles[0] || null;

    const featuredArticle = latest
      ? {
          id: latest.id,
          titre: latest.title,
          extrait: (latest.content || "").substring(0, 200),
          date: latest.created_at,
          image: latest.image,
          categorie: latest.categorie?.name || null,
          auteur: latest.author?.name || "Inconnu"
        }
      : null;

    const categories = await Categorie.findAll({
      order: [["name", "ASC"]]
    });

    const categoryIds = categories.map((c) => c.id);

    const articles = await Article.findAll({
      where: {
        categorieId: {
          [Op.in]: categoryIds
        }
      },
      include: [
        { model: User, as: "author", attributes: ["id", "name"] },
        { model: Categorie, as: "categorie", attributes: ["id", "name"] }
      ],
      order: [["created_at", "DESC"]]
    });

    const carouselMap = new Map();
    const topLikedMap = new Map();

    for (const article of articles) {
      if (!carouselMap.has(article.categorieId)) {
        carouselMap.set(article.categorieId, article);
      }

      const current = topLikedMap.get(article.categorieId);
      if (!current || (article.likes || 0) > (current.likes || 0)) {
        topLikedMap.set(article.categorieId, article);
      }
    }

    const carouselItems = [...carouselMap.values()].map((a) => ({
      id: a.id,
      titre: a.title,
      extrait: (a.content || "").substring(0, 160),
      date: a.created_at,
      image: a.image,
      categorie: a.categorie?.name || null,
      auteur: a.author?.name || "Inconnu"
    }));

    const topLikedSections = [...topLikedMap.values()].map((a) => ({
      id: a.id,
      titre: a.title,
      extrait: (a.content || "").substring(0, 160),
      date: a.created_at,
      image: a.image,
      categorie: a.categorie?.name || null,
      auteur: a.author?.name || "Inconnu",
      likes: a.likes || 0
    }));

    return res.render("index", {
      title: "Accueil",
      user: req.user,
      recentPosts,
      featuredArticle,
      carouselItems,
      topLikedSections
    });

  } catch (error) {
    console.error("HOME ERROR:", error);
    return res.status(500).render("index", {
      title: "Accueil",
      user: req.user,
      recentPosts: [],
      featuredArticle: null,
      carouselItems: [],
      topLikedSections: []
    });
  }
};

// =========================
// ARTICLES PAR MOIS
// =========================
export const getArticlesByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const articles = await Article.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { model: User, as: "author" },
        { model: Categorie, as: "categorie" }
      ],
      order: [["created_at", "DESC"]]
    });

    const articlesMapped = articles.map((article) => ({
      id: article.id,
      titre: article.title,
      contenu: article.content,
      image: article.image,
      categorie: article.categorie?.name || article.categorie?.nom || null,
      auteur: article.author?.name || "Inconnu",
      date_publication: article.createdAt
    }));

    res.render("articles-by-month", {
      articles: articlesMapped,
      title: "Articles du mois"
    });

  } catch (error) {
    console.error("MONTH ERROR:", error);
    res.status(500).render("500");
  }
};

// =========================
// RENSEIGNEMENTS (GET)
// =========================
export const getRenseignementsPage = (req, res) => {
  res.render("renseignements", {
    title: "Contact",
    user: req.user,
    errors: [],
    formData: {}
  });
};

// =========================
// RENSEIGNEMENTS (POST)
// =========================
export const postRenseignements = (req, res) => {
  req.session.message = "Message envoyé";
  res.redirect("/renseignements");
};