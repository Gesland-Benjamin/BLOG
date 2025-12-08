import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";
import { deleteProcessedImages } from "../services/image.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export async function showNewArticleForm(req, res) {
  try {
    const categories = await Categorie.findAll();
    res.render("new-article", { categories, isEditing: false, article: {}, errors: [], formData: {}, ogImageTags: '' });
  } catch (error) {
    console.error("Erreur findAll Categorie:", error);
    res.status(500).send("Erreur lors du chargement des catégories");
  }
}

export const createArticle = async (req, res) => {
  try {
    const { titre, contenu, categorie_id, image_alt } = req.body;
    let image = null;
    let imageAlt = image_alt || null;

    // Utiliser l'image traitée si disponible
    if (req.processedImage) {
      // Utiliser la version moyenne pour le preview
      image = `/uploads/${req.processedImage.basename}_md.webp`;
      
      // Générer un alt text par défaut si pas fourni
      if (!imageAlt) {
        imageAlt = titre || 'Image de l\'article';
      }
    }

    // Debug logs pour diagnostiquer les problèmes d'insertion
    console.log('createArticle payload:', { titre, categorie_id, image, imageAlt });
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
      image,
      image_alt: imageAlt
    });

    console.log('Article créé id=', newArticle.id);

    res.redirect("/article");
  } catch (error) {
    console.error(error);
    
    // Supprimer les images traitées en cas d'erreur
    if (req.processedImage) {
      try {
        const uploadsDir = path.join(__dirname, "../public/uploads");
        await deleteProcessedImages(uploadsDir, req.processedImage.basename);
      } catch (deleteError) {
        console.error('Erreur lors de la suppression des images:', deleteError);
      }
    }
    
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
        image: article.image,
        image_alt: article.image_alt
      },
      isEditing: true,
      errors: [],
      formData: {},
      ogImageTags: ''
    });
  } catch (error) {
    console.error("Erreur showEditArticleForm:", error);
    res.status(500).send("Erreur lors du chargement de l'article");
  }
};

export const updateArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const { titre, contenu, categorie_id, image_alt } = req.body;

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
    let imageAlt = image_alt || article.image_alt;
    
    if (req.processedImage) {
      // Supprimer l'ancienne image si elle existe
      if (article.image) {
        try {
          const oldBasename = article.image
            .split('/').pop()  // Récupérer le nom du fichier
            .replace(/_[a-z]{2}\.webp$/, '');  // Enlever le suffixe de taille
          
          const uploadsDir = path.join(__dirname, "../public/uploads");
          await deleteProcessedImages(uploadsDir, oldBasename);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'ancienne image:', error);
        }
      }
      
      // Utiliser la version moyenne de la nouvelle image
      article.image = `/uploads/${req.processedImage.basename}_md.webp`;
      
      // Générer un alt text par défaut si pas fourni
      if (!imageAlt) {
        imageAlt = titre || 'Image de l\'article';
      }
    }

    await article.update({
      titre,
      contenu,
      categorie_id: categorieIdNum,
      image: article.image,
      image_alt: imageAlt
    });

    console.log('Article mis à jour id=', articleId);

    res.redirect("/article");
  } catch (error) {
    console.error('Erreur updateArticle:', error);
    
    // Supprimer les images traitées en cas d'erreur
    if (req.processedImage) {
      try {
        const uploadsDir = path.join(__dirname, "../public/uploads");
        await deleteProcessedImages(uploadsDir, req.processedImage.basename);
      } catch (deleteError) {
        console.error('Erreur lors de la suppression des images:', deleteError);
      }
    }
    
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

    // Supprimer les images associées
    if (article.image) {
      try {
        const basename = article.image
          .split('/').pop()  // Récupérer le nom du fichier
          .replace(/_[a-z]{2}\.webp$/, '');  // Enlever le suffixe de taille
        
        const uploadsDir = path.join(__dirname, "../public/uploads");
        await deleteProcessedImages(uploadsDir, basename);
        console.log(`Images supprimées pour l'article ${articleId}`);
      } catch (error) {
        console.error('Erreur lors de la suppression des images:', error);
      }
    }

    await article.destroy();

    console.log('Article supprimé id=', articleId);

    res.status(200).json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteArticle:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
  }
};