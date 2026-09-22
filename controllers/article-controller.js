import { safeLog, appUrl } from '../utils/security.js';
import sequelize from '../config/database.js';
import { escapeHtml as encodeAttribute } from '../utils/security.js';
import { formatArticleText, articlePlainText } from '../public/js/article-format.js';
import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";
import Commentaire from "../models/Commentaire.model.js";
import ArticleLike from "../models/ArticleLike.model.js";

import { Op, literal } from "sequelize";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";
import { generateOpenGraphImage } from "../services/imageHelper.js";
import { prepareVideoUrl, getVideoType } from "../utils/videoHelper.js";
import { formatDate, toDateObject } from "../utils/date.js";

function getArticleCreatedAt(article) {
  return article?.createdAt || article?.created_at || article?.date_publication || null;
}

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
    safeLog(error);
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
            contenu: articlePlainText(a.content),
            image: a.image,
            image_alt: a.image_alt || a.title,
            auteur: a.author?.name || "Inconnu",
            date_publication: getArticleCreatedAt(a),
            date_publication_formatted: formatDate(getArticleCreatedAt(a), 'fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          }))
        });
      }
    }

    return res.render("article", {
      articlesParCategorie,
      user: req.user
    });

  } catch (error) {
    safeLog(error);
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

    // déterminer si l'utilisateur (ou l'IP) a déjà liké
    let hasLiked = false;
    try {
      if (req.user && req.user.id) {
        const rec = await ArticleLike.findOne({ where: { articleId: id, userId: req.user.id } });
        hasLiked = !!rec;
      } else {
        const ip = req.ip || req.headers["x-forwarded-for"] || null;
        if (ip) {
          const rec = await ArticleLike.findOne({ where: { articleId: id, ip } });
          hasLiked = !!rec;
        }
      }
    } catch (err) {
      safeLog(err);
      hasLiked = false;
    }

    const escapeHtml = (value = "") => String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const renderParagraphs = (text) => {
      return text
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => {
          return `<p>${formatArticleText(block).replace(/\n/g, '<br>')}</p>`;
        })
        .join('');
    };

    const buildContentHtml = (content, inlineImageUrl, imageAlt) => {
      const text = content || "";
      const imageHtml = inlineImageUrl
        ? `\n\n<div class="article-inline-image" style="margin:2rem 0 1.5rem;"><img src="${encodeAttribute(inlineImageUrl)}" alt="${escapeHtml(imageAlt)}" loading="lazy" srcset="${encodeAttribute(inlineImageUrl)} 600w, ${encodeAttribute(inlineImageUrl.replace('_md', '_lg'))} 1200w" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 8px 16px rgba(0, 0, 0, 0.08);"></div>\n\n`
        : "";

      if (inlineImageUrl && text.includes('[[IMAGE_INLINE]]')) {
        const position = text.indexOf('[[IMAGE_INLINE]]');
        return renderParagraphs(text.slice(0, position)) + imageHtml +
          renderParagraphs(text.slice(position + '[[IMAGE_INLINE]]'.length));
      }

      return renderParagraphs(text);
    };

    const contentHasInlinePlaceholder = article.content?.includes('[[IMAGE_INLINE]]');

    const articleData = {
      id: article.id,
      titre: article.title,
      contenu: article.content,
      contenuHtml: buildContentHtml(article.content, article.image_inline, article.image_alt || article.title),
      inlineImagePlacedInContent: contentHasInlinePlaceholder,
      auteur: article.author?.name || "Inconnu",
      categorie: article.categorie?.name || null,
      date_publication: getArticleCreatedAt(article),
      date_publication_iso: toDateObject(getArticleCreatedAt(article))?.toISOString() || '',
      date_publication_formatted: formatDate(getArticleCreatedAt(article), 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      image: article.image,
      image_inline: article.image_inline || null,
      image_alt: article.image_alt || article.title,
      video: article.video ? prepareVideoUrl(article.video) : null,
      videoType: article.video ? getVideoType(article.video) : null,
      likes: article.likes || 0,
      liked: hasLiked,
      description: articlePlainText(article.content || "").substring(0, 160),
      url: `${appUrl()}/article/${article.id}`
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
        date_publication: c.createdAt || c.created_at || c.date || null,
        date_publication_formatted: formatDate(c.createdAt || c.created_at || c.date || null, 'fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        replies: (c.replies || []).map(r => ({
          id: r.id,
          nom: r.nom || "Lecteur",
          contenu: r.contenu,
          date: r.date,
          date_publication: r.createdAt || r.created_at || r.date || null,
          date_publication_formatted: formatDate(r.createdAt || r.created_at || r.date || null, 'fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          is_admin_reply: r.is_admin_reply,
          user: r.user
        }))
      }));

    } catch (err) {
      safeLog(err);

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
        date_publication: c.createdAt || c.created_at || c.date || null,
        date_publication_formatted: formatDate(c.createdAt || c.created_at || c.date || null, 'fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
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
    safeLog(error);
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
      statut: req.user?.role === "admin" ? "approved" : "pending",
      is_spam: spam
    });

    return res.redirect(`/article/${articleId}?comment_submitted=1`);

  } catch (error) {
    safeLog(error);
    return res.status(500).send("Erreur commentaire");
  }
};

/* =========================
   LIKE ARTICLE
========================= */
export const likeArticle = async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Identifiant invalide' });
  try {
    const result = await sequelize.transaction(async transaction => {
      // Verrouiller la même ligne pour sérialiser vérification et incrément.
      const article = await Article.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!article) return { status: 404, body: { message: 'Article introuvable' } };
      const identity = req.user ? { userId: req.user.id } : { ip: req.ip };
      if (await ArticleLike.findOne({ where: { articleId: id, ...identity }, transaction })) return { status: 400, body: { message: 'Vous avez déjà liké cet article' } };
      await ArticleLike.create({ articleId: id, userId: req.user?.id || null, ip: req.ip }, { transaction });
      await article.increment('likes', { by: 1, transaction });
      await article.reload({ transaction });
      return { status: 200, body: { likes: article.likes } };
    });
    return res.status(result.status).json(result.body);
  } catch (error) { next(error); }
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
    const search = typeof req.query.search === "string" ? req.query.search.slice(0, 200) : "";

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
      contenu: articlePlainText(a.content),
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
    safeLog(error);
    return res.status(500).send("Erreur catégorie");
  }
};
