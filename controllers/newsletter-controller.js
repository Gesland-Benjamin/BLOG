import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import {
  sendNewsletterConfirmationEmail,
  sendNewsletterWelcomeEmail
} from "../services/email.js";
import crypto from "crypto";

// =========================
// FORM PAGE
// =========================
export const showNewsletterForm = (req, res) => {
  res.render("newsletter", {
    title: "Newsletter",
    user: req.user,
    errors: [],
    message: null,
    formData: {}
  });
};

// =========================
// SUBSCRIBE
// =========================
export const subscribeNewsletter = async (req, res) => {
  const emailRaw = req.body?.email || "";
  const email = emailRaw.trim().toLowerCase();

  if (!email) {
    return res.status(400).render("newsletter", {
      title: "Newsletter",
      user: req.user,
      errors: ["Email requis"],
      message: null,
      formData: { email }
    });
  }

  try {
    const existing = await NewsletterSubscriber.findOne({
      where: { email }
    });

    // Déjà inscrit confirmé
    if (existing && existing.confirmed) {
      return res.render("newsletter", {
        title: "Newsletter",
        user: req.user,
        errors: [],
        message: "Cet email est déjà inscrit.",
        formData: { email }
      });
    }

    // Existe mais non confirmé → renvoi email
    if (existing && !existing.confirmed) {
      await sendNewsletterConfirmationEmail(
        email,
        existing.confirmation_token
      );

      return res.render("newsletter", {
        title: "Newsletter",
        user: req.user,
        errors: [],
        message: "Email de confirmation renvoyé.",
        formData: {}
      });
    }

    // Nouveau subscriber
    const token = crypto.randomBytes(32).toString("hex");

    await NewsletterSubscriber.create({
      email,
      confirmed: false,
      confirmation_token: token,
      user_id: req.user?.id || null
    });

    try {
      await sendNewsletterConfirmationEmail(email, token);

      return res.render("newsletter", {
        title: "Newsletter",
        user: req.user,
        errors: [],
        message:
          "Un email de confirmation a été envoyé. Vérifiez votre boîte mail.",
        formData: {}
      });
    } catch (emailError) {
      console.error("EMAIL ERROR:", emailError);

      return res.render("newsletter", {
        title: "Newsletter",
        user: req.user,
        errors: [],
        message:
          "Inscription enregistrée mais erreur d’envoi email.",
        formData: {}
      });
    }
  } catch (error) {
    console.error("SUBSCRIBE ERROR:", error);

    return res.status(500).render("newsletter", {
      title: "Newsletter",
      user: req.user,
      errors: ["Erreur serveur"],
      message: null,
      formData: { email }
    });
  }
};

// =========================
// CONFIRM
// =========================
export const confirmSubscription = async (req, res) => {
  const token = req.params?.token;

  try {
    const subscriber = await NewsletterSubscriber.findOne({
      where: { confirmation_token: token }
    });

    if (!subscriber) {
      return res.render("newsletter-confirm", {
        title: "Confirmation",
        success: false,
        message: "Lien invalide ou expiré",
        user: req.user
      });
    }

    if (subscriber.confirmed) {
      return res.render("newsletter-confirm", {
        title: "Confirmation",
        success: true,
        message: "Déjà confirmé",
        user: req.user
      });
    }

    subscriber.confirmed = true;
    subscriber.confirmed_at = new Date();
    subscriber.confirmation_token = null;

    await subscriber.save();

    try {
      await sendNewsletterWelcomeEmail(subscriber.email);
    } catch (e) {
      console.error("WELCOME EMAIL ERROR:", e);
    }

    return res.render("newsletter-confirm", {
      title: "Confirmation",
      success: true,
      message: "Inscription confirmée avec succès",
      user: req.user
    });
  } catch (error) {
    console.error("CONFIRM ERROR:", error);
    return res.status(500).render("500", { error: error.message });
  }
};

// =========================
// UNSUBSCRIBE FORM
// =========================
export const showUnsubscribeForm = (req, res) => {
  res.render("newsletter-unsubscribe", {
    title: "Désinscription",
    user: req.user,
    errors: [],
    message: null,
    formData: { email: req.query.email || "" }
  });
};

// =========================
// UNSUBSCRIBE
// =========================
export const unsubscribe = async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();

  if (!email) {
    return res.render("newsletter-unsubscribe", {
      title: "Désinscription",
      user: req.user,
      errors: ["Email requis"],
      message: null,
      formData: { email }
    });
  }

  try {
    const subscriber = await NewsletterSubscriber.findOne({
      where: { email }
    });

    if (!subscriber) {
      return res.render("newsletter-unsubscribe", {
        title: "Désinscription",
        user: req.user,
        errors: [],
        message: "Email non trouvé",
        formData: { email }
      });
    }

    await subscriber.destroy();

    return res.render("newsletter-unsubscribe", {
      title: "Désinscription",
      user: req.user,
      errors: [],
      message: "Désinscription réussie",
      formData: {}
    });
  } catch (error) {
    console.error("UNSUBSCRIBE ERROR:", error);

    return res.status(500).render("newsletter-unsubscribe", {
      title: "Désinscription",
      user: req.user,
      errors: ["Erreur serveur"],
      message: null,
      formData: { email }
    });
  }
};