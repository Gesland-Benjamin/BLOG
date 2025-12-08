import Commentaire from "../models/Commentaire.model.js";
import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";

export const listCommentsAdmin = async (req, res) => {
  try {
    const pageSize = 20;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);

    const { count, rows } = await Commentaire.findAndCountAll({
      where: { parent_id: null }, // Seulement les commentaires parents
      include: [
        { model: Article, as: "article" },
        { model: User, as: "user" },
        { 
          model: Commentaire, 
          as: "replies",
          include: [{ model: User, as: "user" }],
          order: [["date", "ASC"]]
        }
      ],
      order: [["date", "DESC"]],
      limit,
      offset
    });

    const baseUrl = '/admin/commentaires';
    const paginationData = createPaginationData(count, page, pageSize, baseUrl);

    res.render("admin-commentaires", { 
      comments: rows,
      pagination: paginationData,
      baseUrl
    });
  } catch (error) {
    console.error("Erreur listCommentsAdmin:", error);
    res.status(500).send("Erreur lors du chargement des commentaires");
  }
};

export const approveComment = async (req, res) => {
  try {
    const comment = await Commentaire.findByPk(req.params.id);
    if (!comment) return res.status(404).send("Commentaire introuvable");
    await comment.update({ statut: "approved", is_spam: false });
    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("Erreur approveComment:", error);
    res.status(500).send("Erreur lors de l'approbation");
  }
};

export const rejectComment = async (req, res) => {
  try {
    const comment = await Commentaire.findByPk(req.params.id);
    if (!comment) return res.status(404).send("Commentaire introuvable");
    await comment.update({ statut: "rejected" });
    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("Erreur rejectComment:", error);
    res.status(500).send("Erreur lors de la mise en attente");
  }
};

export const markSpamComment = async (req, res) => {
  try {
    const comment = await Commentaire.findByPk(req.params.id);
    if (!comment) return res.status(404).send("Commentaire introuvable");
    await comment.update({ statut: "rejected", is_spam: true });
    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("Erreur markSpamComment:", error);
    res.status(500).send("Erreur lors du marquage spam");
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Commentaire.findByPk(req.params.id);
    if (!comment) return res.status(404).send("Commentaire introuvable");
    await comment.destroy();
    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("Erreur deleteComment:", error);
    res.status(500).send("Erreur lors de la suppression");
  }
};

export const replyToComment = async (req, res) => {
  try {
    const parentId = req.params.id;
    const { contenu } = req.body;
    
    if (!contenu || contenu.trim().length === 0) {
      return res.status(400).send("Le contenu de la réponse est requis");
    }
    
    // Vérifier que le commentaire parent existe
    const parentComment = await Commentaire.findByPk(parentId);
    if (!parentComment) {
      return res.status(404).send("Commentaire parent introuvable");
    }
    
    // Créer la réponse
    await Commentaire.create({
      contenu: contenu.trim(),
      parent_id: parentId,
      article_id: parentComment.article_id,
      user_id: req.user.id,
      nom: req.user.nom_prenom,
      is_admin_reply: true,
      statut: 'approved' // Les réponses admin sont automatiquement approuvées
    });
    
    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("Erreur replyToComment:", error);
    res.status(500).send("Erreur lors de la création de la réponse");
  }
};
