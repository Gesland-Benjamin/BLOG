import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";



export async function showNewArticleForm(req, res) {
  try {
    const categories = await Categorie.findAll();
    res.render("new-article", { categories, isEditing: false, article: {} });
  } catch (error) {
    console.error("Erreur findAll Categorie:", error);
    res.status(500).send("Erreur lors du chargement des catégories");
  }
}

export const createArticle = async (req, res) => {
  try {
    const { titre, contenu, categorie_id } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // Debug logs pour diagnostiquer les problèmes d'insertion
    console.log('createArticle payload:', { titre, categorie_id, image });
    console.log('createArticle req.user:', req.user ? { id: req.user.id, nom: req.user.nom_prenom } : null);

    // Validation : s'assurer que la catégorie existe
    const categorieIdNum = parseInt(categorie_id, 10);
    if (Number.isNaN(categorieIdNum)) {
      console.error('categorie_id invalide:', categorie_id);
      return res.status(400).send('Identifiant de catégorie invalide');
    }

    const categorie = await Categorie.findByPk(categorieIdNum);
    if (!categorie) {
      console.error('Categorie introuvable pour id:', categorieIdNum);
      return res.status(400).send('Catégorie introuvable');
    }

    const newArticle = await Article.create({
      titre,
      contenu,
      categorie_id: categorieIdNum,
      auteur_id: req.user ? req.user.id : null,
      image
    });

    console.log('Article créé id=', newArticle.id);

    res.redirect("/article");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la création de l'article");
  }
};

export const showEditArticleForm = async (req, res) => {
  try {
    const articleId = req.params.id;
    
    const article = await Article.findByPk(articleId, {
      include: [{ model: Categorie, as: "categorie" }]
    });

    if (!article) {
      return res.status(404).send('Article non trouvé');
    }

    const categories = await Categorie.findAll();
    
    res.render("new-article", { 
      categories,
      article: {
        id: article.id,
        titre: article.titre,
        contenu: article.contenu,
        categorie_id: article.categorie_id,
        image: article.image
      },
      isEditing: true
    });
  } catch (error) {
    console.error("Erreur showEditArticleForm:", error);
    res.status(500).send("Erreur lors du chargement de l'article");
  }
};

export const updateArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const { titre, contenu, categorie_id } = req.body;

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).send('Article non trouvé');
    }

    // Validation : s'assurer que la catégorie existe
    const categorieIdNum = parseInt(categorie_id, 10);
    if (Number.isNaN(categorieIdNum)) {
      return res.status(400).send('Identifiant de catégorie invalide');
    }

    const categorie = await Categorie.findByPk(categorieIdNum);
    if (!categorie) {
      return res.status(400).send('Catégorie introuvable');
    }

    // Mettre à jour l'image si fournie
    if (req.file) {
      article.image = `/uploads/${req.file.filename}`;
    }

    await article.update({
      titre,
      contenu,
      categorie_id: categorieIdNum
    });

    console.log('Article mis à jour id=', articleId);

    res.redirect("/article");
  } catch (error) {
    console.error('Erreur updateArticle:', error);
    res.status(500).send("Erreur lors de la mise à jour de l'article");
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const articleId = req.params.id;

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    await article.destroy();

    console.log('Article supprimé id=', articleId);

    res.status(200).json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteArticle:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
  }
};