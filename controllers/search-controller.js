import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";
import { Op } from "sequelize";

export const searchArticles = async (req, res) => {
  try {
    const pageSize = 9;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);

    const search = (req.query.q || "").trim();
    const categorie = req.query.categorie || "";

    const where = {};

    const include = [
      { model: Categorie, as: "categorie" }
    ];

    /* =========================
       🔎 RECHERCHE TEXTE
    ========================= */
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    /* =========================
       📁 FILTRE CATÉGORIE
    ========================= */
    if (categorie) {
      const catId = parseInt(categorie, 10);
      if (!Number.isNaN(catId)) {
        where.categorieId = catId;
      }
    }

    /* =========================
       🔥 QUERY FIX
    ========================= */
    const { count, rows } = await Article.findAndCountAll({
      where,
      include,
      order: [["id", "DESC"]], // ✅ FIX CRITIQUE (remplace createdAt)
      limit,
      offset
    });

    const categories = await Categorie.findAll({
      order: [["name", "ASC"]]
    });

    /* =========================
       🧠 FORMAT DATA
    ========================= */
    const articles = rows.map((a) => ({
      id: a.id,
      titre: a.title,                 // ✅ FIX
      contenu: a.content,             // ✅ FIX
      categorie: a.categorie?.name || null,
      date_publication: a.createdAt,  // OK via Sequelize
      image: a.image
    }));

    /* =========================
       🔗 PAGINATION URL
    ========================= */
    let baseUrl = "/search";

    const queryParts = [];
    if (search) queryParts.push(`q=${encodeURIComponent(search)}`);
    if (categorie) queryParts.push(`categorie=${encodeURIComponent(categorie)}`);

    if (queryParts.length > 0) {
      baseUrl += `?${queryParts.join("&")}`;
    }

    const paginationData = createPaginationData(
      count,
      page,
      pageSize,
      baseUrl
    );

    return res.render("search-articles", {
      articles,
      categories,
      pagination: paginationData,
      filters: {
        q: search,
        categorie
      },
      user: req.user,
      baseUrl
    });

  } catch (error) {
    console.error("Erreur searchArticles:", error);
    return res.status(500).send("Erreur lors de la recherche d'articles");
  }
};