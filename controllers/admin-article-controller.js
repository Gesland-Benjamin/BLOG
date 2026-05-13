import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";
import User from "../models/User.model.js";
import { deleteProcessedImages } from "../services/image.js";
import path from "path";
import { fileURLToPath } from "url";
import { prepareVideoUrl } from "../utils/videoHelper.js";

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

    const article = await Article.create({
      title: title.trim(),
      content: content.trim(),
      categorieId: categoryIdNum,
      userId: req.user.id,
      image,
      video: video ? prepareVideoUrl(video.trim()) : null
    });

    console.log("✅ ARTICLE CREATED:", article.id);

    return res.redirect("/article");

  } catch (error) {
    console.error("❌ createArticle error:", error);

    if (req.processedImage) {
      const uploadsDir = path.join(__dirname, "../public/uploads");
      await deleteProcessedImages(uploadsDir, req.processedImage.basename)
        .catch(console.error);
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

    await article.update({
      title,
      content,
      categorieId: Number(categorieId),
      video: video ? prepareVideoUrl(video.trim()) : null
    });

    console.log("✅ ARTICLE UPDATED:", article.id);

    res.redirect("/article");

  } catch (error) {
    console.error("updateArticle error:", error);
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

    await article.destroy();

    console.log("🗑 ARTICLE DELETED:", article.id);

    res.redirect("/article");

  } catch (error) {
    console.error("deleteArticle error:", error);
    res.status(500).send("Erreur suppression article");
  }
};