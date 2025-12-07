import Commentaire from "../models/Commentaire.model.js";
import Article from "../models/Article.model.js";
import User from "../models/User.model.js";

export const listCommentsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Commentaire.findAndCountAll({
      include: [
        { model: Article, as: "article" },
        { model: User, as: "user" }
      ],
      order: [["date", "DESC"]],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render("admin-commentaires", { 
      comments: rows,
      pagination: { page, pages: totalPages, total: count }
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
