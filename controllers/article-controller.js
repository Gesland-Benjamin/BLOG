import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";
import Commentaire from "../models/Commentaire.model.js";
import { generateOpenGraphImage } from "../services/imageHelper.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";
import { prepareVideoUrl, getVideoType } from "../utils/videoHelper.js";


const getArticlePage = (req, res) => {
    res.render("article", { articlesParCategorie: {}, user: req.user }); 
};
export default { getArticlePage };



export const getArticlesParCategorie = async (req, res) => {
  try {
    // Récupère toutes les catégories de la base de données
    const toutesCategories = await Categorie.findAll({
      order: [["nom", "ASC"]]
    });

    const articlesParCategorie = [];

    // Pour chaque catégorie, récupère le dernier article
    for (const categorie of toutesCategories) {
      const article = await Article.findOne({
        where: { categorie_id: categorie.id },
        include: [
          { model: User, as: "auteur" },
          { model: Categorie, as: "categorie" }
        ],
        order: [["date_publication", "DESC"]]
      });

      if (article) {
        articlesParCategorie.push({
          categorie: categorie.nom,
          id: article.id,
          titre: article.titre,
          contenu: article.contenu,
          image: article.image,
          image_alt: article.image_alt || article.titre,
          auteur: article.auteur ? article.auteur.nom_prenom : "Inconnu",
          date_publication: article.date_publication
        });
      }
    }

    res.render("article", { articlesParCategorie, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors du chargement des articles.");
  }
};



export const getArticleById = async (req, res) => {
  const id = req.params.id;
  try {
    const article = await Article.findByPk(id, {
      include: [
        { model: User, as: "auteur" },
        { model: Categorie, as: "categorie" }
      ]
    });

    if (!article) {
      return res.status(404).send("Article non trouvé.");
    }

    let alreadyLiked = false;
    const rawCookie = req.cookies?.likedArticles;
    if (rawCookie) {
      try {
        const parsed = JSON.parse(rawCookie);
        if (Array.isArray(parsed)) {
          alreadyLiked = parsed.map(Number).filter(Number.isFinite).includes(Number(id));
        }
      } catch (err) {
        console.warn("Cookie likedArticles illisible, on continue sans", err);
      }
    }

    const articleData = {
      id: article.id,
      titre: article.titre,
      contenu: article.contenu,
      auteur: article.auteur ? article.auteur.nom_prenom : "Inconnu",
      categorie: article.categorie ? article.categorie.nom : null,
      date_publication: article.date_publication,
      image: article.image,
      image_alt: article.image_alt || article.titre,
      video: article.video ? prepareVideoUrl(article.video) : null,
      videoType: article.video ? getVideoType(article.video) : null,
      likes: article.likes || 0,
      liked: alreadyLiked,
      // Meta données pour SEO
      description: (article.contenu || '').substring(0, 160),
      url: `${process.env.SITE_URL || 'http://localhost:3000'}/article/${article.id}`,
      openGraphImage: article.image || `${process.env.SITE_URL || 'http://localhost:3000'}/default-og-image.png`
    };

    const commentaires = await Commentaire.findAll({
      where: { article_id: id, statut: "approved", parent_id: null },
      include: [
        { 
          model: Commentaire, 
          as: "replies",
          where: { statut: "approved" },
          required: false,
          include: [{ model: User, as: "user" }],
          order: [["date", "ASC"]]
        }
      ],
      order: [["date", "DESC"]]
    });

    const commentSubmitted = req.query && req.query.comment_submitted === "1";

    // Générer les meta tags OpenGraph
    const ogImageTags = generateOpenGraphImage({
      imageUrl: articleData.openGraphImage,
      imageAlt: articleData.image_alt,
      width: '1200',
      height: '630'
    });

    res.render("article-detail", { 
      article: articleData, 
      user: req.user, 
      commentaires, 
      commentSubmitted,
      ogImageTags,
      errors: [],
      formData: {}
    });
  } catch (error) {
    console.error("Erreur getArticleById:", error);
    res.status(500).send("Erreur lors du chargement de l'article.");
  }
};

export const postComment = async (req, res) => {
  const articleId = Number(req.params.id);
  const { nom, contenu } = req.body || {};

  if (!Number.isInteger(articleId)) {
    return res.status(400).send("Article invalide");
  }

  if (!contenu || (!req.user && !nom)) {
    return res.status(400).send("Nom et contenu requis");
  }

  try {
    const article = await Article.findByPk(articleId);
    if (!article) return res.status(404).send("Article introuvable");

    // Heuristique anti-spam simple
    const lower = (contenu || "").toLowerCase();
    const looksSpam = lower.includes("http://") || lower.includes("https://") || lower.includes("www.");

    await Commentaire.create({
      article_id: articleId,
      contenu,
      nom: req.user ? req.user.nom_prenom : nom,
      user_id: req.user ? req.user.id : null,
      statut: req.user ? "approved" : "pending",
      is_spam: looksSpam
    });

    return res.redirect(`/article/${articleId}?comment_submitted=1`);
  } catch (error) {
    console.error("Erreur postComment:", error);
    return res.status(500).send("Impossible d'enregistrer le commentaire pour le moment");
  }
};

// Permet à n'importe quel visiteur (connecté ou non) de liker un article
export const likeArticle = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Identifiant d'article invalide" });
  }

  try {
    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ message: "Article introuvable" });
    }

    const rawCookie = req.cookies?.likedArticles;
    let likedArticles = [];
    if (rawCookie) {
      try {
        const parsed = JSON.parse(rawCookie);
        if (Array.isArray(parsed)) {
          likedArticles = parsed.map(Number).filter(Number.isFinite);
        }
      } catch (err) {
        console.warn("Cookie likedArticles illisible, on repart à zéro", err);
      }
    }

    const alreadyLiked = likedArticles.includes(id);
    if (alreadyLiked) {
      return res.json({ likes: article.likes || 0, liked: true });
    }

    await article.increment("likes", { by: 1 });
    await article.reload();

    const updatedLiked = [...likedArticles, id];
    res.cookie("likedArticles", JSON.stringify(updatedLiked), {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000
    });

    return res.json({ likes: article.likes || 0, liked: true });
  } catch (error) {
    console.error("Erreur likeArticle:", error);
    return res.status(500).json({ message: "Erreur lors de l'enregistrement du like" });
  }
};

export const getArticlesByCategorieName = async (req, res) => {
  const rawNom = req.params.nom || '';
  const decoded = decodeURIComponent(rawNom);
  const normalize = str =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  try {
    const toutesCategories = await Categorie.findAll();
    const categorieTrouvee = toutesCategories.find(c => normalize(c.nom) === normalize(decoded));

    if (!categorieTrouvee) {
      return res.status(404).render('articles-by-category', { 
        articles: [], 
        categorie: decoded, 
        user: req.user,
        pagination: { page: 1, pages: 0, total: 0 },
        search: '',
        baseUrl: `/article/categorie/${encodeURIComponent(decoded)}`
      });
    }

    const pageSize = 6;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);
    const search = req.query.search || '';

    const where = { categorie_id: categorieTrouvee.id };
    if (search) {
      where.titre = { [Article.sequelize.Sequelize.Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [{ model: User, as: "auteur" }, { model: Categorie, as: "categorie" }],
      order: [["date_publication", "DESC"]],
      limit,
      offset
    });

    const articlesSimplifies = rows.map(a => ({
      id: a.id,
      titre: a.titre,
      contenu: a.contenu,
      auteur: a.auteur ? a.auteur.nom_prenom : "Inconnu",
      date_publication: a.date_publication
    }));

    const baseUrl = `/article/categorie/${encodeURIComponent(categorieTrouvee.nom)}`;
    const paginationData = createPaginationData(count, page, pageSize, baseUrl);
    if (search) {
      paginationData.pages = paginationData.pages.map(p => ({
        ...p,
        url: p.url + `&search=${encodeURIComponent(search)}`
      }));
      paginationData.previous_url = paginationData.previous_url ? paginationData.previous_url + `&search=${encodeURIComponent(search)}` : null;
      paginationData.next_url = paginationData.next_url ? paginationData.next_url + `&search=${encodeURIComponent(search)}` : null;
    }

    res.render("articles-by-category", { 
      articles: articlesSimplifies, 
      categorie: categorieTrouvee.nom, 
      user: req.user,
      pagination: paginationData,
      search,
      baseUrl
    });
  } catch (error) {
    console.error("Erreur getArticlesByCategorieName:", error);
    res.status(500).send("Erreur lors du chargement des articles de la catégorie.");
  }
};