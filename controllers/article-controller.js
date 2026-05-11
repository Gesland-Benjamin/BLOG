import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";
import Commentaire from "../models/Commentaire.model.js";

import { Op, literal } from "sequelize";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";
import { generateOpenGraphImage } from "../services/imageHelper.js";
import { prepareVideoUrl, getVideoType } from "../utils/videoHelper.js";

/* =========================
   PAGE SIMPLE ARTICLES
========================= */
export const getArticlePage = async (req, res) => {
  try {
    return res.render("article", {
      articlesParCategorie: [],
      user: req.user
    });
  } catch (error) {
    console.error("getArticlePage error:", error);
    return res.status(500).send("Erreur page articles");
  }
};

/* =========================
   ARTICLES PAR CATÉGORIE
========================= */
export const getArticlesParCategorie = async (req, res) => {
  try {
    const categories = await Categorie.findAll({
      order: [["name", "ASC"]]
    });

    const articlesParCategorie = [];

    for (const categorie of categories) {
      const articles = await Article.findAll({
        where: { categorieId: categorie.id },
        include: [
          { model: User, as: "author" },
          { model: Categorie, as: "categorie" }
        ],
        order: [["created_at", "DESC"]],
        limit: 5
      });

      if (articles.length > 0) {
        articlesParCategorie.push({
          categorie: categorie.name,
          articles: articles.map(a => ({
            id: a.id,
            titre: a.title,
            contenu: a.content,
            image: a.image,
            image_alt: a.image_alt || a.title,
            auteur: a.author?.name || "Inconnu",
            date_publication: a.createdAt
          }))
        });
      }
    }

    return res.render("article", {
      articlesParCategorie,
      user: req.user
    });

  } catch (error) {
    console.error("getArticlesParCategorie error:", error);
    return res.status(500).send("Erreur chargement articles");
  }
};

/* =========================
   ARTICLE BY ID (FIX FINAL)
========================= */
export const getArticleById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const article = await Article.findByPk(id, {
      include: [
        { model: User, as: "author" },
        { model: Categorie, as: "categorie" }
      ]
    });

    if (!article) return res.status(404).send("Article non trouvé");

    const articleData = {
      id: article.id,
      titre: article.title,
      contenu: article.content,
      auteur: article.author?.name || "Inconnu",
      categorie: article.categorie?.name || null,
      date_publication: article.createdAt,
      image: article.image,
      image_alt: article.image_alt || article.title,
      video: article.video ? prepareVideoUrl(article.video) : null,
      videoType: article.video ? getVideoType(article.video) : null,
      likes: article.likes || 0,
      description: (article.content || "").substring(0, 160),
      url: `${process.env.SITE_URL || "http://localhost:3000"}/article/${article.id}`
    };

    /* =========================
       COMMENTS FIX DEFINITIF
    ========================= */
    const pageSize = 10;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);

    const where = {
      articleId: id,
      statut: "approved",
      parentId: null
    };

    const total = await Commentaire.count({ where });

    let commentaires = [];

    try {
      const rawComments = await Commentaire.findAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name"],
            required: false
          },
          {
            model: Commentaire,
            as: "replies",
            where: { statut: "approved" },
            required: false,
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name"],
                required: false
              }
            ]
          }
        ],
        order: [[literal("created_at DESC")]], // ✅ FIX ULTIME
        limit,
        offset
      });

      commentaires = rawComments.map(c => ({
        id: c.id,
        nom: c.nom || "Lecteur",
        contenu: c.contenu,
        date: c.date,
        replies: (c.replies || []).map(r => ({
          id: r.id,
          nom: r.nom || "Lecteur",
          contenu: r.contenu,
          date: r.date,
          is_admin_reply: r.is_admin_reply,
          user: r.user
        }))
      }));

    } catch (err) {
      console.error("⚠️ fallback commentaires:", err.message);

      const rawComments = await Commentaire.findAll({
        where,
        order: [[literal("created_at DESC")]], // ✅ FIX ULTIME
        limit,
        offset
      });

      commentaires = rawComments.map(c => ({
        id: c.id,
        nom: c.nom || "Lecteur",
        contenu: c.contenu,
        date: c.date,
        replies: []
      }));
    }

    const pagination = createPaginationData(
      total,
      page,
      pageSize,
      `/article/${id}`
    );

    const ogTags = generateOpenGraphImage({
      imageUrl: article.image,
      imageAlt: article.image_alt,
      width: "1200",
      height: "630"
    });

    return res.render("article-detail", {
      article: articleData,
      user: req.user,
      commentaires,
      commentsPagination: pagination,
      commentsBaseUrl: `/article/${id}`,
      ogImageTags: ogTags,
      commentSubmitted: req.query.comment_submitted === "1",
      errors: [],
      formData: {}
    });

  } catch (error) {
    console.error("getArticleById error:", error);
    return res.status(500).send("Erreur article");
  }
};

/* =========================
   POST COMMENT
========================= */
export const postComment = async (req, res) => {
  try {
    const articleId = Number(req.params.id);
    const { nom, contenu } = req.body;

    if (!articleId || !contenu) {
      return res.status(400).send("Données invalides");
    }

    const article = await Article.findByPk(articleId);
    if (!article) return res.status(404).send("Article introuvable");

    const spam = /(http|www)/i.test(contenu);

    await Commentaire.create({
      articleId,
      content: contenu,
      name: req.user?.name || nom,
      userId: req.user?.id || null,
      statut: req.user ? "approved" : "pending",
      is_spam: spam
    });

    return res.redirect(`/article/${articleId}?comment_submitted=1`);

  } catch (error) {
    console.error("postComment error:", error);
    return res.status(500).send("Erreur commentaire");
  }
};

/* =========================
   LIKE ARTICLE
========================= */
export const likeArticle = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ message: "Not found" });

    await article.increment("likes", { by: 1 });
    await article.reload();

    return res.json({ likes: article.likes });

  } catch (error) {
    console.error("likeArticle error:", error);
    return res.status(500).json({ message: "Erreur like" });
  }
};

/* =========================
   ARTICLES BY CATEGORY NAME
========================= */
export const getArticlesByCategorieName = async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.nom || "");

    const category = await Categorie.findOne({
      where: { name }
    });

    if (!category) {
      return res.render("articles-by-category", {
        articles: [],
        categorie: name,
        user: req.user,
        pagination: { page: 1, pages: 0, total: 0 },
        search: "",
        baseUrl: `/article/categorie/${encodeURIComponent(name)}`
      });
    }

    const pageSize = 6;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);
    const search = req.query.search || "";

    const where = {
      categorieId: category.id
    };

    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        { model: User, as: "author" },
        { model: Categorie, as: "categorie" }
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset
    });

    const articles = rows.map(a => ({
      id: a.id,
      titre: a.title,
      contenu: a.content,
      auteur: a.author?.name || "Inconnu",
      date_publication: a.createdAt,
      image: a.image,
      image_alt: a.image_alt || a.title
    }));

    const baseUrl = `/article/categorie/${encodeURIComponent(category.name)}`;
    const pagination = createPaginationData(count, page, pageSize, baseUrl);

    return res.render("articles-by-category", {
      articles,
      categorie: category.name,
      user: req.user,
      pagination,
      search,
      baseUrl
    });

  } catch (error) {
    console.error("getArticlesByCategorieName error:", error);
    return res.status(500).send("Erreur catégorie");
  }
};