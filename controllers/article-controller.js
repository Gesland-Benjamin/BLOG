import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";


const getArticlePage = (req, res) => {
    res.render("article", { articlesParCategorie: {}, user: req.user }); 
};
export default { getArticlePage };



export const getArticlesParCategorie = async (req, res) => {
  try {
    // Récupère le dernier article pour chaque catégorie
    const categories = [
      { nom: "Beauté", key: "Beauté" },
      { nom: "Nutrition", key: "Nutrition" },
      { nom: "Développement Personnels", key: "DéveloppementPersonnels" }
    ];

    const normalize = (str = "") => str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const toutesCategories = await Categorie.findAll();
    const articlesParCategorie = {};

    for (const cat of categories) {
      const categorieTrouvee = toutesCategories.find(c => normalize(c.nom) === normalize(cat.nom));
      if (!categorieTrouvee) continue;

      const article = await Article.findOne({
        where: { categorie_id: categorieTrouvee.id },
        include: [
          { model: User, as: "auteur" },
          { model: Categorie, as: "categorie" }
        ],
        order: [["date_publication", "DESC"]]
      });

      if (article) {
        articlesParCategorie[cat.key] = {
          id: article.id,
          titre: article.titre,
          contenu: article.contenu,
          auteur: article.auteur ? article.auteur.nom_prenom : "Inconnu",
          date_publication: article.date_publication,
          categorie: categorieTrouvee.nom
        };
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

    const articleData = {
      id: article.id,
      titre: article.titre,
      contenu: article.contenu,
      auteur: article.auteur ? article.auteur.nom_prenom : "Inconnu",
      categorie: article.categorie ? article.categorie.nom : null,
      date_publication: article.date_publication,
      image: article.image
    };

    res.render("article-detail", { article: articleData, user: req.user });
  } catch (error) {
    console.error("Erreur getArticleById:", error);
    res.status(500).send("Erreur lors du chargement de l'article.");
  }
};

export const getArticlesByCategorieName = async (req, res) => {
  const rawNom = req.params.nom || '';
  // Décode et normalise pour comparer sans accents / casse / espaces
  const decoded = decodeURIComponent(rawNom);
  const normalize = str =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime accents
      .replace(/\s+/g, ' ')
      .trim();

  try {
    console.log('getArticlesByCategorieName param raw:', rawNom, 'decoded:', decoded);

    // Cherche la catégorie de façon plus tolérante (sans dépendre d'une comparaison SQL exacte)
    const toutesCategories = await Categorie.findAll();
    const categorieTrouvee = toutesCategories.find(c => normalize(c.nom) === normalize(decoded));

    if (!categorieTrouvee) {
      console.log('Catégorie introuvable en base pour :', decoded);
      return res.status(404).render('articles-by-category', { articles: [], categorie: decoded });
    }

    // Récupère les articles par categorie_id (évite les problèmes de join/where sur le include)
    const articles = await Article.findAll({
      where: { categorie_id: categorieTrouvee.id },
      include: [{ model: User, as: "auteur" }, { model: Categorie, as: "categorie" }],
      order: [["date_publication", "DESC"]]
    });

    console.log('articles trouvés pour', categorieTrouvee.nom, ':', articles.length);

    const articlesSimplifies = articles.map(a => ({
      id: a.id,
      titre: a.titre,
      contenu: a.contenu,
      auteur: a.auteur ? a.auteur.nom_prenom : "Inconnu",
      date_publication: a.date_publication
    }));

    res.render("articles-by-category", { articles: articlesSimplifies, categorie: categorieTrouvee.nom, user: req.user });
  } catch (error) {
    console.error("Erreur getArticlesByCategorieName:", error);
    res.status(500).send("Erreur lors du chargement des articles de la catégorie.");
  }
};