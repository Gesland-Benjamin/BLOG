import crypto from "crypto";
import argon2 from "argon2";
import User from "../models/User.model.js";
import {
  sendResetEmail,
  sendConfirmationEmail
} from "../services/email.js";

/**
 * FORGOT PASSWORD FORM
 */
export const showForgotPasswordForm = async (req, res) => {
  try {
    res.render("forgot-password", {
      error: null,
      message: null,
      devToken: null
    });
  } catch (error) {
    console.error("Forgot form error:", error);
    res.status(500).render("500");
  }
};

/**
 * SEND RESET EMAIL
 */
export const sendPasswordReset = async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();

  if (!email) {
    return res.render("forgot-password", {
      error: "Email requis",
      message: null,
      devToken: null
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    // Ne pas leak si user existe
    if (!user) {
      return res.render("forgot-password", {
        error: null,
        message:
          "Si l’email existe, un lien de réinitialisation a été envoyé.",
        devToken: null
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await user.update({
      reset_token: token,
      reset_token_expiry: expiry
    });

    // Build a safe base URL: prefer APP_URL, otherwise use request host/protocol
    const rawAppUrl = process.env.APP_URL || "";
    const baseUrl = rawAppUrl && rawAppUrl.trim()
      ? rawAppUrl.replace(/\/+$/, "")
      : `${req.protocol}://${req.get("host")}`;

    const resetUrl = `${baseUrl}/auth/reset/${token}`;

    try {
      await sendResetEmail(user.email, token, resetUrl);
    } catch (err) {
      console.warn("EMAIL RESET ERROR:", err);
    }

    return res.render("forgot-password", {
      error: null,
      message: "Email de réinitialisation envoyé",
      devToken: null
    });
  } catch (error) {
    console.error("RESET REQUEST ERROR:", error);
    return res.status(500).render("500");
  }
};

/**
 * SHOW RESET FORM
 */
export const showResetPasswordForm = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      where: { reset_token: token }
    });

    if (!user || !user.reset_token_expiry || new Date() > user.reset_token_expiry) {
      return res.status(400).render("reset-password", {
        token,
        error: "Lien invalide ou expiré",
        isValid: false
      });
    }

    res.render("reset-password", {
      token,
      error: null,
      isValid: true
    });
  } catch (error) {
    console.error("SHOW RESET ERROR:", error);
    res.status(500).render("500");
  }
};

/**
 * RESET PASSWORD
 */
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const password = req.body?.password || "";
  const confirm = req.body?.password_confirm || "";

  if (!password) {
    return res.render("reset-password", {
      token,
      error: "Mot de passe requis",
      isValid: true
    });
  }

  if (password !== confirm) {
    return res.render("reset-password", {
      token,
      error: "Les mots de passe ne correspondent pas",
      isValid: true
    });
  }

  if (password.length < 8) {
    return res.render("reset-password", {
      token,
      error: "8 caractères minimum",
      isValid: true
    });
  }

  try {
    const user = await User.findOne({
      where: { reset_token: token }
    });

    if (!user || !user.reset_token_expiry || new Date() > user.reset_token_expiry) {
      return res.status(400).render("reset-password", {
        token,
        error: "Lien expiré ou invalide",
        isValid: false
      });
    }

    const hashed = await argon2.hash(password);

    await user.update({
      password: hashed,
      reset_token: null,
      reset_token_expiry: null
    });

    try {
      await sendConfirmationEmail(user.email, user.name);
    } catch (err) {
      console.warn("CONFIRM EMAIL ERROR:", err);
    }

    req.session.message = {
      type: "success",
      text: "Mot de passe mis à jour"
    };

    return res.redirect("/auth");
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).render("500");
  }
};