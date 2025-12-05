import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";



export async function showNewArticleForm(req, res) {
  try {
    const categories = await Categorie.findAll();
    res.render("new-article", { categories });
  } catch (error) {
    console.error("Erreur findAll Categorie:", error);
    res.status(500).send("Erreur lors du chargement des catégories");
  }
}

export const createArticle = async (req, res) => {
  try {
    const { titre, contenu, categorie_id } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    await Article.create({
      titre,
      contenu,
      categorie_id,
      auteur_id: req.user.id, // ou req.session.user.id selon ton auth
      image
    });

    res.redirect("/article");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la création de l'article");
  }
};