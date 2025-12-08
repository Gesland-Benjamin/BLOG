import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";

export const searchArticles = async (req, res) => {
  try {
    const pageSize = 9;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);
    const search = req.query.q || '';
    const categorie = req.query.categorie || '';

    const where = {};
    const include = [
      { model: User, as: "auteur" },
      { model: Categorie, as: "categorie" }
    ];

    if (search) {
      where.titre = { [Article.sequelize.Sequelize.Op.iLike]: `%${search}%` };
    }

    if (categorie) {
      where.categorie_id = parseInt(categorie);
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include,
      order: [["date_publication", "DESC"]],
      limit,
      offset
    });

    const categories = await Categorie.findAll();

    const articles = rows.map(a => ({
      id: a.id,
      titre: a.titre,
      contenu: a.contenu,
      auteur: a.auteur ? a.auteur.nom_prenom : "Inconnu",
      categorie: a.categorie ? a.categorie.nom : null,
      date_publication: a.date_publication,
      image: a.image
    }));

    let baseUrl = '/search?';
    if (search) baseUrl += `q=${encodeURIComponent(search)}`;
    if (categorie) baseUrl += (search ? '&' : '') + `categorie=${encodeURIComponent(categorie)}`;
    if (!search && !categorie) baseUrl = '/search';

    const paginationData = createPaginationData(count, page, pageSize, baseUrl);

    res.render("search-articles", {
      articles,
      categories,
      pagination: paginationData,
      filters: { q: search, categorie },
      user: req.user,
      baseUrl
    });
  } catch (error) {
    console.error("Erreur searchArticles:", error);
    res.status(500).send("Erreur lors de la recherche d'articles");
  }
};
