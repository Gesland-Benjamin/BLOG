import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";

export const searchArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;
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

    const totalPages = Math.ceil(count / limit);

    res.render("search-articles", {
      articles,
      categories,
      pagination: { page, pages: totalPages, total: count },
      filters: { q: search, categorie },
      user: req.user
    });
  } catch (error) {
    console.error("Erreur searchArticles:", error);
    res.status(500).send("Erreur lors de la recherche d'articles");
  }
};
