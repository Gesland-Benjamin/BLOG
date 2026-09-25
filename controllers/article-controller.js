import { articleImageDimensions, articleImageSrcset } from '../services/articleImage.js';
import { articlePath, articleSeo, breadcrumbSchema, resolveArticleSlug, seriesForArticle } from '../utils/seo.js';
import { renderArticleContent } from '../public/js/article-content.js';
import { safeLog } from '../utils/security.js';
import sequelize from '../config/database.js';
import { escapeHtml as encodeAttribute } from '../utils/security.js';
import { articlePlainText } from '../public/js/article-format.js';
import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";
import Commentaire from "../models/Commentaire.model.js";
import ArticleLike from "../models/ArticleLike.model.js";

import { Op, literal } from "sequelize";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";
import { prepareVideoUrl, getVideoType } from "../utils/videoHelper.js";
import { formatDate, toDateObject } from "../utils/date.js";

function getArticleCreatedAt(article) {
  return article?.published_at || article?.createdAt || article?.created_at || article?.date_publication || null;
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
            slug: a.slug,
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
    const key = req.params.id;
    const numeric = /^\d+$/.test(key);
    const article = await Article.findOne({
      where: numeric ? { id: key } : { slug: resolveArticleSlug(key) },
      include: [
        { model: User, as: "author" },
        { model: Categorie, as: "categorie" }
      ]
    });

    if (!article) return res.status(404).render('404', { seo: { ...res.locals.seo, noindex: true } });
    const id = article.id;
    if (article.slug && key !== article.slug) {
      const query = new URLSearchParams();
      if (/^\d+$/.test(req.query.page || '')) query.set('page', req.query.page);
      if (req.query.comment_submitted === '1') query.set('comment_submitted', '1');
      return res.redirect(301, articlePath(article) + (query.size ? `?${query}` : ''));
    }
    const seo = articleSeo(article);
    const breadcrumbs = [{ name: 'Accueil', path: '/' },
      ...(article.categorie ? [{ name: article.categorie.name, path: `/article/categorie/${encodeURIComponent(article.categorie.name)}` }] : []),
      { name: article.title, path: articlePath(article) }];
    const manualIds = Array.isArray(article.related_article_ids) ? article.related_article_ids.filter(value => Number.isInteger(value) && value !== id).slice(0, 5) : [];
    const manualArticles = manualIds.length ? await Article.findAll({ where: { id: { [Op.in]: manualIds } } }) : [];
    const similarArticles = manualArticles.length < 5 ? await Article.findAll({
      where: { categorieId: article.categorieId, id: { [Op.notIn]: [id, ...manualIds] } },
      order: [['created_at', 'DESC']], limit: 5 - manualArticles.length
    }) : [];
    const relatedArticles = [...manualArticles, ...similarArticles];
    const articleSeries = [];
    for (const series of seriesForArticle(article.slug)) {
      // Default scope only: an unpublished or removed episode never gets a link.
      const episodes = await Article.findAll({ where: { slug: { [Op.in]: series.slugs } }, attributes: ['id', 'slug', 'title'] });
      const bySlug = new Map(episodes.map(episode => [episode.slug, episode]));
      const ordered = series.slugs.map(slug => bySlug.get(slug)).filter(Boolean);
      if (ordered.length > 1) articleSeries.push({ title: series.title, articles: ordered });
    }

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

    const [imageDimensions, inlineDimensions] = await Promise.all([
      articleImageDimensions(article.image), articleImageDimensions(article.image_inline)
    ]);
    const [imageSrcset, inlineSrcset] = await Promise.all([
      articleImageSrcset(article.image, imageDimensions), articleImageSrcset(article.image_inline, inlineDimensions)
    ]);
    const renderedContent = renderArticleContent(article.content);
    const inlineImageHtml = article.image_inline
      ? `<div class="article-inline-image" style="margin:2rem 0 1.5rem"><img src="${encodeAttribute(article.image_inline)}" alt="${escapeHtml(article.image_alt || article.title)}" loading="lazy" ${inlineSrcset ? `srcset="${encodeAttribute(inlineSrcset)}" sizes="(max-width: 900px) 100vw, 900px"` : ''} ${inlineDimensions ? `width="${inlineDimensions.width}" height="${inlineDimensions.height}"` : ''} style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 8px 16px rgba(0,0,0,.08)"></div>` : '';

    const contentHasInlinePlaceholder = article.content?.includes('[[IMAGE_INLINE]]');

    const articleData = {
      id: article.id,
      slug: article.slug,
      date_modified_iso: seo.modified,
      date_modified_formatted: formatDate(article.updated_at),
      titre: article.title,
      contenu: article.content,
      contenuHtml: renderedContent.html.replace('<p>[[IMAGE_INLINE]]</p>', inlineImageHtml),
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
      imageDimensions,
      inlineDimensions,
      imageSrcset,
      inlineSrcset,
      image_inline: article.image_inline || null,
      image_alt: article.image_alt || article.title,
      video: article.video ? prepareVideoUrl(article.video) : null,
      videoType: article.video ? getVideoType(article.video) : null,
      likes: article.likes || 0,
      liked: hasLiked,
      description: seo.description,
      url: seo.canonical
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
      articlePath(article)
    );

    return res.render("article-detail", {
      article: articleData,
      seo,
      breadcrumbs,
      breadcrumbData: breadcrumbSchema(breadcrumbs),
      toc: renderedContent.toc,
      relatedArticles,
      articleSeries,
      user: req.user,
      commentaires,
      commentsPagination: pagination,
      commentsBaseUrl: articlePath(article),
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

    return res.redirect(`${articlePath(article)}?comment_submitted=1`);

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
      await article.increment('likes', { by: 1, transaction, silent: true });
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
    const name = req.params.nom || "";

    const category = await Categorie.findOne({
      where: { name }
    });

    if (!category) return res.status(404).render('404', { seo: { ...res.locals.seo, noindex: true } });

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
      slug: a.slug,
      titre: a.title,
      contenu: articlePlainText(a.content),
      auteur: a.author?.name || "Inconnu",
      date_publication_formatted: formatDate(a.published_at || a.created_at),
      date_publication: (a.published_at || a.created_at),
      image: a.image,
      image_alt: a.image_alt || a.title
    }));

    if (page > 1 && offset >= count) return res.status(404).render('404', { seo: { ...res.locals.seo, noindex: true } });
    const baseUrl = `/article/categorie/${encodeURIComponent(category.name)}` + (search ? `?search=${encodeURIComponent(search)}` : '');
    const pagination = createPaginationData(count, page, pageSize, baseUrl);

    return res.render("articles-by-category", {
      articles,
      seo: { ...res.locals.seo, title: category.name, description: category.description?.trim() || `Les articles d’Emi dans la rubrique ${category.name}. Découvrez ses expériences et ses réflexions, puis poursuivez votre lecture.` },
      categoryDescription: category.description?.trim() || '',
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
