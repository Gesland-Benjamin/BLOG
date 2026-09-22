import { safeLog } from '../utils/security.js';
import argon2 from "argon2";
import User from "../models/User.model.js";

export const login = async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!email || !password) {
    return res.status(400).render("auth", {
      message: "Email et mot de passe sont requis.",
      formData: { email }
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !user.password) {
      return res.status(401).render("auth", {
        message: "Identifiants invalides.",
        formData: { email }
      });
    }

    let valid = false;

    try {
      valid = await argon2.verify(user.password, password);
    } catch (err) {
      safeLog(err);
      valid = false;
    }

    if (!valid) {
      return res.status(401).render("auth", {
        message: "Identifiants invalides.",
        formData: { email }
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        safeLog(err);
        return res.status(500).render("auth", {
          message: "Erreur interne.",
          formData: { email }
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name, // ✅ FIX IMPORTANT
        email: user.email,
        role: user.role
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
        }

        return res.redirect("/");
      });
    });

  } catch (err) {
    safeLog(err);

    return res.status(500).render("auth", {
      message: "Erreur lors de la connexion.",
      formData: { email }
    });
  }
};