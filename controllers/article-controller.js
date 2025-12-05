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

    const articlesParCategorie = {};

    for (const cat of categories) {
      const article = await Article.findOne({
        include: [
          { model: User, as: "auteur" },
          { model: Categorie, as: "categorie", where: { nom: cat.nom } }
        ],
        order: [["date_publication", "DESC"]]
      });

      if (article) {
        articlesParCategorie[cat.key] = {
          id: article.id,
          titre: article.titre,
          contenu: article.contenu,
          auteur: article.auteur ? article.auteur.nom_prenom : "Inconnu",
          date_publication: article.date_publication
        };
      }
    }
    
    res.render("article", { articlesParCategorie });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors du chargement des articles.");
  }
};

export const getArticlesByCategorieName = async (req, res) => {
  const nomCategorie = req.params.nom;
  try {
    // Recherche des articles liés à la catégorie
    const articles = await Article.findAll({
      include: [
        { model: User, as: "auteur" },
        { model: Categorie, as: "categorie", where: { nom: nomCategorie } }
      ],
      order: [["date_publication", "DESC"]]
    });

    // Préparer des objets simples pour la vue
    const articlesSimplifies = articles.map(a => ({
      id: a.id,
      titre: a.titre,
      contenu: a.contenu,
      auteur: a.auteur ? a.auteur.nom_prenom : "Inconnu",
      date_publication: a.date_publication
    }));

    res.render("articles-by-category", { articles: articlesSimplifies, categorie: nomCategorie });
  } catch (error) {
    console.error("Erreur getArticlesByCategorieName:", error);
    res.status(500).send("Erreur lors du chargement des articles de la catégorie.");
  }
};