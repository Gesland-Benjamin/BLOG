import Commentaire from "../models/Commentaire.model.js";
import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";

export const listCommentsAdmin = async (req, res) => {
  try {
    const pageSize = 20;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);

    const { count, rows } = await Commentaire.findAndCountAll({
      include: [
        { model: Article, as: "article" },
        { model: User, as: "user" }
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
