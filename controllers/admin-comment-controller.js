import Commentaire from "../models/Commentaire.model.js";
import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";
import { Op } from "sequelize";

/* =========================
   LIST COMMENTS ADMIN
========================= */
export const listCommentsAdmin = async (req, res) => {
  try {
    const pageSize = 10;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);
    const search = req.query.search?.trim() || "";

    const where = {
      parentId: null
    };

    if (search) {
      where[Op.or] = [
        { content: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Commentaire.findAndCountAll({
      where,

      // 🔥 IMPORTANT FIX Sequelize COUNT + JOIN
      distinct: true,
      subQuery: false,

      include: [
        {
          model: Article,
          as: "article",
          attributes: ["id", "title"],
          required: false
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
          required: false
        },
        {
          model: Commentaire,
          as: "replies",
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name"],
              required: false
            }
          ]
        }
      ],

      // 🔥 FIX compat MySQL + timestamps Sequelize
      order: [["created_at", "DESC"]],

      limit,
      offset
    });
    const baseUrl = "/admin/commentaires";
    
    const pagination = createPaginationData(
      count,
      page,
      pageSize,
      "/admin/commentaires"
    );

    return res.render("admin-commentaires", {
      comments: rows,
      pagination,
      search,
      baseUrl
    });

  } catch (error) {
    console.error("❌ listCommentsAdmin:", error);
    return res.status(500).send("Erreur commentaire admin");
  }
};

/* =========================
   APPROVE
========================= */
export const approveComment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).send("ID invalide");

    const comment = await Commentaire.findByPk(id);
    if (!comment) return res.status(404).send("Introuvable");

    await comment.update({
      statut: "approved",
      is_spam: false
    });

    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("❌ approveComment:", error);
    res.status(500).send("Erreur approve");
  }
};

/* =========================
   REJECT
========================= */
export const rejectComment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).send("ID invalide");

    const comment = await Commentaire.findByPk(id);
    if (!comment) return res.status(404).send("Introuvable");

    await comment.update({
      statut: "rejected"
    });

    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("❌ rejectComment:", error);
    res.status(500).send("Erreur reject");
  }
};

/* =========================
   MARK SPAM
========================= */
export const markSpamComment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).send("ID invalide");

    const comment = await Commentaire.findByPk(id);
    if (!comment) return res.status(404).send("Introuvable");

    await comment.update({
      is_spam: true,
      statut: "rejected"
    });

    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("❌ markSpamComment:", error);
    res.status(500).send("Erreur spam");
  }
};

/* =========================
   DELETE
========================= */
export const deleteComment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).send("ID invalide");

    const comment = await Commentaire.findByPk(id);
    if (!comment) return res.status(404).send("Introuvable");

    await comment.destroy();

    res.redirect("/admin/commentaires");
  } catch (error) {
    console.error("❌ deleteComment:", error);
    res.status(500).send("Erreur delete");
  }
};

/* =========================
   REPLY
========================= */
export const replyToComment = async (req, res) => {
  try {
    const parentId = parseInt(req.params.id, 10);
    const content = req.body.contenu?.trim();

    if (!parentId) return res.status(400).send("ID invalide");
    if (!content) return res.status(400).send("Contenu requis");

    const parent = await Commentaire.findByPk(parentId);
    if (!parent) return res.status(404).send("Parent introuvable");

    await Commentaire.create({
      content,
      parentId,
      articleId: parent.articleId,
      userId: req.user?.id || null,
      name: req.user?.name || "Admin",
      is_admin_reply: true,
      statut: "approved"
    });

    res.redirect("/admin/commentaires");

  } catch (error) {
    console.error("❌ replyToComment:", error);
    res.status(500).send("Erreur reply");
  }
};