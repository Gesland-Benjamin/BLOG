import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import User from "../models/User.model.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";
import { Op } from "sequelize";

/**
 * LISTE SUBSCRIBERS
 */
export const listSubscribers = async (req, res) => {
  try {
    const pageSize = 20;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);
    const search = req.query.search?.trim() || "";

    const where = {};

    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { date_inscription: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await NewsletterSubscriber.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"] // ✅ FIX
        }
      ],
      order: [["date_inscription", "DESC"]],
      limit,
      offset
    });

    // 🔥 stats GLOBAL (pas seulement page)
    const [confirmedCount, pendingCount] = await Promise.all([
      NewsletterSubscriber.count({ where: { confirmed: true } }),
      NewsletterSubscriber.count({ where: { confirmed: false } })
    ]);

    const stats = {
      total: count,
      confirmed: confirmedCount,
      pending: pendingCount
    };

    let baseUrl = "/admin/newsletter";
    if (search) {
      baseUrl += `?search=${encodeURIComponent(search)}`;
    }

    const pagination = createPaginationData(count, page, pageSize, baseUrl);

    res.render("admin-newsletter", {
      title: "Gestion de la newsletter",
      subscribers: rows,
      stats,
      pagination,
      baseUrl,
      user: req.user,
      search
    });

  } catch (error) {
    console.error("❌ listSubscribers:", error);
    res.status(500).render("500", {
      title: "Erreur serveur",
      error: error.message
    });
  }
};

/**
 * EXPORT CSV
 */
export const exportSubscribersCSV = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name"] // ✅ FIX
        }
      ],
      order: [["date_inscription", "DESC"]]
    });

    let csv = "Email,Nom,Confirmé,Date inscription\n";

    subscribers.forEach(sub => {
      csv += `"${sub.email}","${sub.user?.name || ""}","${sub.confirmed ? "Oui" : "Non"}","${sub.date_inscription}"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=subscribers.csv");

    res.send(csv);

  } catch (error) {
    console.error("❌ exportSubscribersCSV:", error);
    res.status(500).render("500", {
      title: "Erreur export CSV",
      error: error.message
    });
  }
};

/**
 * DELETE
 */
export const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findByPk(req.params.id);

    if (!subscriber) {
      return res.status(404).render("404", {
        title: "Abonné introuvable"
      });
    }

    await subscriber.destroy();

    req.session.message = {
      type: "success",
      text: "Abonné supprimé avec succès"
    };

    res.redirect("/admin/newsletter");

  } catch (error) {
    console.error("❌ deleteSubscriber:", error);

    res.status(500).render("500", {
      title: "Erreur suppression",
      error: error.message
    });
  }
};

/**
 * RESEND CONFIRMATION
 */
export const resendConfirmation = async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findByPk(req.params.id);

    if (!subscriber) {
      return res.status(404).render("404", {
        title: "Abonné introuvable"
      });
    }

    // TODO: brancher service email réel
    console.log(`📧 Confirmation renvoyée à : ${subscriber.email}`);

    res.redirect("/admin/newsletter");

  } catch (error) {
    console.error("❌ resendConfirmation:", error);
    res.status(500).render("500", {
      title: "Erreur renvoi confirmation",
      error: error.message
    });
  }
};