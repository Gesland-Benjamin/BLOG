import { getPaginationParams, createPaginationData } from '../utils/pagination.js';
import { formatDate } from '../utils/date.js';
import { safeLog } from '../utils/security.js';
import { Op } from "sequelize";
import { Article, User, Categorie } from "../models/index.js";
import { sendContactInquiryEmail } from "../services/email.js";

// =========================
// HOME
// =========================
export const getHomePage = async (req, res) => {
  try {
    const archiveMonths = Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - index);

      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: new Intl.DateTimeFormat("fr-FR", {
          month: "long",
          year: "numeric"
        }).format(date),
        url: `/archive/${date.getFullYear()}/${date.getMonth() + 1}`
      };
    });

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
      slug: a.slug,
      titre: a.title,
      extrait: (a.content || "").substring(0, 120),
      date: (a.published_at || a.created_at),
      image: a.image,
      categorie: a.categorie?.name || null,
      auteur: a.author?.name || "Inconnu"
    }));

    const latest = recentArticles[0] || null;

    const featuredArticle = latest
      ? {
          id: latest.id,
          slug: latest.slug,
          titre: latest.title,
          extrait: (latest.content || "").substring(0, 200),
          date: (latest.published_at || latest.created_at),
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
      slug: a.slug,
      titre: a.title,
      extrait: (a.content || "").substring(0, 160),
      date: (a.published_at || a.created_at),
      image: a.image,
      categorie: a.categorie?.name || null,
      auteur: a.author?.name || "Inconnu"
    }));

    const topLikedSections = [...topLikedMap.values()].map((a) => ({
      id: a.id,
      slug: a.slug,
      titre: a.title,
      extrait: (a.content || "").substring(0, 160),
      date: (a.published_at || a.created_at),
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
      topLikedSections,
      archiveMonths
    });

  } catch (error) {
    safeLog(error);
    return res.status(500).render("index", {
      title: "Accueil",
      user: req.user,
      recentPosts: [],
      featuredArticle: null,
      carouselItems: [],
      topLikedSections: [],
      archiveMonths: []
    });
  }
};

// =========================
// ARTICLES PAR MOIS
// =========================
export const getArticlesByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;

    if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || Number(month) < 1 || Number(month) > 12) return res.status(404).render('404', { seo: { ...res.locals.seo, noindex: true } });
    const { page, limit, offset } = getPaginationParams(req.query.page, 9);
    const baseUrl = `/archive/${Number(year)}/${Number(month)}`;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const { count, rows: articles } = await Article.findAndCountAll({
      where: { [Op.or]: [
        { published_at: { [Op.gte]: startDate, [Op.lt]: endDate } },
        { published_at: null, created_at: { [Op.gte]: startDate, [Op.lt]: endDate } }
      ] },
      include: [{ model: User, as: "author" }, { model: Categorie, as: "categorie" }],
      order: [["created_at", "DESC"]], limit, offset
    });
    if (page > 1 && offset >= count) return res.status(404).render('404', { seo: { ...res.locals.seo, noindex: true } });

    const articlesMapped = articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      titre: article.title,
      contenu: article.content,
      image: article.image,
      categorie: article.categorie?.name || article.categorie?.nom || null,
      auteur: article.author?.name || "Inconnu",
      date_publication_formatted: formatDate(article.published_at || article.created_at),
      date_publication: (article.published_at || article.created_at)
    }));

    // Préparer le nom du mois et l'année pour la vue
    const monthIndex = startDate.getMonth();
    const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(startDate);
    const yearNum = startDate.getFullYear();

    // Ajouter un extrait aux articles pour l'affichage
    const articlesWithExcerpt = articlesMapped.map(a => ({
      ...a,
      extrait: (a.contenu || '').substring(0, 200)
    }));

    res.render("articles-by-month", {
      articles: articlesWithExcerpt,
      title: "Articles du mois",
      seo: { ...res.locals.seo, title: `Articles de ${monthName} ${yearNum}`, canonical: new URL(baseUrl + (page > 1 ? `?page=${page}` : ''), res.locals.seo.canonical).href },
      pagination: createPaginationData(count, page, limit, baseUrl),
      baseUrl,
      monthName,
      year: yearNum
    });

  } catch (error) {
    safeLog(error);
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
export const postRenseignements = async (req, res) => {
  try {
    const { nom = "", email = "", telephone = "", sujet = "", message = "" } = req.body;
    const errors = [];

    const cleanNom = nom.trim();
    const cleanEmail = email.trim();
    const cleanTelephone = telephone.trim();
    const cleanSujet = sujet.trim();
    const cleanMessage = message.trim();

    if (!cleanNom) errors.push("Le nom est obligatoire.");
    if (!cleanEmail) {
      errors.push("L'email est obligatoire.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.push("L'email n'est pas valide.");
    }
    if (!cleanSujet) errors.push("L'objet est obligatoire.");
    if (!cleanMessage) {
      errors.push("Le message est obligatoire.");
    } else if (cleanMessage.length > 1200) {
      errors.push("Le message ne doit pas dépasser 1200 caractères.");
    }

    if (errors.length) {
      return res.status(400).render("renseignements", {
        title: "Contact",
        user: req.user,
        errors,
        formData: {
          nom: cleanNom,
          email: cleanEmail,
          telephone: cleanTelephone,
          sujet: cleanSujet,
          message: cleanMessage
        }
      });
    }

    await sendContactInquiryEmail({
      nom: cleanNom,
      email: cleanEmail,
      telephone: cleanTelephone,
      sujet: cleanSujet,
      message: cleanMessage
    });

    req.session.message = "Message envoyé. Nous revenons vers vous rapidement.";
    return res.redirect("/renseignements");
  } catch (error) {
    safeLog(error);
    return res.status(500).render("renseignements", {
      title: "Contact",
      user: req.user,
      errors: ["Impossible d'envoyer votre message pour le moment. Veuillez réessayer."],
      formData: {
        nom: (req.body?.nom || "").trim(),
        email: (req.body?.email || "").trim(),
        telephone: (req.body?.telephone || "").trim(),
        sujet: (req.body?.sujet || "").trim(),
        message: (req.body?.message || "").trim()
      }
    });
  }
};