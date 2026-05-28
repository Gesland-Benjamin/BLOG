import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";
import User from "../models/User.model.js";
import { deleteProcessedImages } from "../services/image.js";
import path from "path";
import { fileURLToPath } from "url";
import { prepareVideoUrl } from "../utils/videoHelper.js";
import { getImageBaseName, getUploadsDir } from "../utils/uploadPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   FORM CREATE ARTICLE
========================= */
export async function showNewArticleForm(req, res) {
  try {
    const categories = await Categorie.findAll({
      order: [["name", "ASC"]]
    });

    res.render("new-article", {
      categories,
      isEditing: false,
      article: {},
      errors: [],
      formData: {},
      ogImageTags: ""
    });
  } catch (error) {
    console.error("showNewArticleForm error:", error);
    res.status(500).send("Erreur chargement catégories");
  }
}

/* =========================
   CREATE ARTICLE (FIXED)
========================= */
export const createArticle = async (req, res) => {
  try {
    console.log("🟡 BODY RECEIVED:", req.body);
    console.log("🟡 FILE:", req.file || req.processedImage);

    const { title, content, categorieId, video } = req.body;

    if (!req.user?.id) {
      return res.status(401).send("Utilisateur non authentifié");
    }

    if (!title || !content || !categorieId) {
      return res.status(400).send("Champs manquants");
    }

    const categoryIdNum = Number(categorieId);

    const category = await Categorie.findByPk(categoryIdNum);
    if (!category) {
      return res.status(400).send("Catégorie introuvable");
    }

    const image = req.processedImage
      ? `/uploads/${req.processedImage.basename}_md.webp`
      : null;

    const image_inline = req.processedInlineImage
      ? `/uploads/${req.processedInlineImage.basename}_md.webp`
      : null;

    const article = await Article.create({
      title: title.trim(),
      content: content.trim(),
      categorieId: categoryIdNum,
      userId: req.user.id,
      image,
      image_inline,
      video: video ? prepareVideoUrl(video.trim()) : null
    });

    console.log("✅ ARTICLE CREATED:", article.id);

    return res.redirect("/article");

  } catch (error) {
    console.error("❌ createArticle error:", error);

    if (req.processedImage) {
      const uploadsDir = getUploadsDir();
      await deleteProcessedImages(uploadsDir, req.processedImage.basename)
        .catch(console.error);
    }

    if (req.processedInlineImage) {
      const uploadsDir = getUploadsDir();
      await deleteProcessedImages(uploadsDir, req.processedInlineImage.basename).catch(console.error);
    }

    return res.status(500).send("Erreur création article");
  }
};

/* =========================
   EDIT FORM
========================= */
export const showEditArticleForm = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [
        { model: Categorie, as: "categorie" },
        { model: User, as: "author" }
      ]
    });

    if (!article) return res.status(404).send("Article non trouvé");

    const categories = await Categorie.findAll({
      order: [["name", "ASC"]]
    });

    res.render("new-article", {
      categories,
      isEditing: true,
      article,
      errors: [],
      formData: {},
      ogImageTags: ""
    });

  } catch (error) {
    console.error("showEditArticleForm error:", error);
    res.status(500).send("Erreur chargement article");
  }
};

/* =========================
   UPDATE ARTICLE
========================= */
export const updateArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).send("Article non trouvé");

    const { title, content, categorieId, video } = req.body;
    const previousImage = article.image;
    const hasNewImage = Boolean(req.processedImage);
    const nextImage = hasNewImage
      ? `/uploads/${req.processedImage.basename}_md.webp`
      : article.image;

    const previousInline = article.image_inline;
    const hasNewInline = Boolean(req.processedInlineImage);
    const nextInline = hasNewInline
      ? `/uploads/${req.processedInlineImage.basename}_md.webp`
      : article.image_inline;

    await article.update({
      title,
      content,
      categorieId: Number(categorieId),
      image: nextImage,
      image_inline: nextInline,
      video: video ? prepareVideoUrl(video.trim()) : null
    });

    if (hasNewImage && previousImage) {
      const uploadsDir = getUploadsDir();
      const previousBaseName = getImageBaseName(previousImage);
      if (previousBaseName) {
        await deleteProcessedImages(uploadsDir, previousBaseName).catch(console.error);
      }
    }

    if (hasNewInline && previousInline) {
      const uploadsDir = getUploadsDir();
      const previousBaseNameInline = getImageBaseName(previousInline);
      if (previousBaseNameInline) {
        await deleteProcessedImages(uploadsDir, previousBaseNameInline).catch(console.error);
      }
    }

    console.log("✅ ARTICLE UPDATED:", article.id);

    res.redirect("/article");

  } catch (error) {
    console.error("updateArticle error:", error);

    if (req.processedImage) {
      const uploadsDir = getUploadsDir();
      await deleteProcessedImages(uploadsDir, req.processedImage.basename)
        .catch(console.error);
    }

    if (req.processedInlineImage) {
      const uploadsDir = getUploadsDir();
      await deleteProcessedImages(uploadsDir, req.processedInlineImage.basename).catch(console.error);
    }

    res.status(500).send("Erreur update article");
  }
};

/* =========================
   DELETE ARTICLE
========================= */
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).send("Article non trouvé");

    // Supprimer les images générées avant de supprimer l'article
    const uploadsDir = getUploadsDir();
    if (article.image) {
      const imageBaseName = getImageBaseName(article.image);
      if (imageBaseName) {
        await deleteProcessedImages(uploadsDir, imageBaseName).catch(console.error);
      }
    }
    if (article.image_inline) {
      const imageInlineBaseName = getImageBaseName(article.image_inline);
      if (imageInlineBaseName) {
        await deleteProcessedImages(uploadsDir, imageInlineBaseName).catch(console.error);
      }
    }

    await article.destroy();

    console.log("🗑 ARTICLE DELETED:", article.id);

    res.redirect("/article");

  } catch (error) {
    console.error("deleteArticle error:", error);
    res.status(500).send("Erreur suppression article");
  }
};