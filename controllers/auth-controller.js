import argon2 from "argon2";
import { User } from "../models/index.js";
import { registerSchema } from "../validators/schemas.js";

// ==============================
// PAGE LOGIN
// ==============================
export const getAuthPage = (req, res) => {
  console.log("📄 GET /auth");

  res.render("auth", {
    title: "Authentification",
    message: req.session.message || null,
    user: req.session.user || null,
    errors: [],
    formData: {}
  });

  delete req.session.message;
};

// ==============================
// PAGE REGISTER
// ==============================
export const getRegisterPage = (req, res) => {
  console.log("📄 GET /auth/register");

  res.render("register", {
    title: "Créer un compte",
    message: null,
    user: req.session.user || null,
    errors: [],
    formData: {}
  });
};

// ==============================
// REGISTER
// ==============================
export const register = async (req, res) => {
  console.log("🚀 POST /auth/register");
  console.log("BODY:", req.body);

  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).render("register", {
        title: "Créer un compte",
        errors: error.details.map(e => e.message),
        user: req.session.user || null,
        formData: req.body
      });
    }

    const { name, email, password } = value;
    const emailLower = email.trim().toLowerCase();

    const existing = await User.findOne({
      where: { email: emailLower }
    });

    if (existing) {
      return res.status(400).render("register", {
        title: "Créer un compte",
        errors: ["Email déjà utilisé"],
        user: req.session.user || null,
        formData: req.body
      });
    }

    if (!password) {
      return res.status(400).render("register", {
        title: "Créer un compte",
        errors: ["Mot de passe manquant"],
        user: req.session.user || null,
        formData: req.body
      });
    }

    let hashed;
    try {
      hashed = await argon2.hash(password);
    } catch (err) {
      console.error("ARGON2 ERROR:", err);

      return res.status(500).render("register", {
        title: "Créer un compte",
        errors: ["Erreur hash mot de passe"],
        user: req.session.user || null,
        formData: req.body
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hashed,
      role: "visiteur"
    });

    console.log("🎉 USER CREATED:", newUser.id);

    req.session.message = "Compte créé avec succès";
    return res.redirect("/auth");

  } catch (error) {
    console.error("💥 REGISTER ERROR:", error);

    return res.status(500).render("register", {
      title: "Créer un compte",
      errors: ["Erreur serveur"],
      user: req.session.user || null,
      formData: req.body
    });
  }
};

// ==============================
// LOGIN
// ==============================
export const login = async (req, res) => {
  console.log("🔐 POST /auth");

  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).render("auth", {
        title: "Authentification",
        errors: ["Email et mot de passe requis"],
        user: null,
        formData: { email }
      });
    }

    const user = await User.scope("withPassword").findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).render("auth", {
        title: "Authentification",
        errors: ["Identifiants invalides"],
        user: null,
        formData: { email }
      });
    }

    let valid = false;

    try {
      valid = await argon2.verify(user.password, password);
    } catch (err) {
      console.error("ARGON2 VERIFY ERROR:", err);
      valid = false;
    }

    if (!valid) {
      return res.status(401).render("auth", {
        title: "Authentification",
        errors: ["Identifiants invalides"],
        user: null,
        formData: { email }
      });
    }

    console.log("✅ LOGIN SUCCESS:", user.id);

    req.session.regenerate((err) => {
      if (err) {
        console.error("SESSION ERROR:", err);
        return res.status(500).render("auth", {
          title: "Authentification",
          errors: ["Erreur session"],
          user: null,
          formData: { email }
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      req.session.save((err) => {
        if (err) {
          console.error("SESSION SAVE ERROR:", err);
          return res.status(500).render("auth", {
            title: "Authentification",
            errors: ["Erreur session"],
            user: null,
            formData: { email }
          });
        }

        return res.redirect("/");
      });
    });

  } catch (error) {
    console.error("💥 LOGIN ERROR:", error);

    return res.status(500).render("auth", {
      title: "Authentification",
      errors: ["Erreur serveur"],
      user: null,
      formData: {}
    });
  }
};