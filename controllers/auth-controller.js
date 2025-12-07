
import argon2 from "argon2";
import User from "../models/User.model.js";

// Afficher la page de connexion
export const getAuthPage = (req, res) => {
  res.render("auth", {
    title: "Authentification",
    message: "Veuillez vous connecter pour accéder à votre compte",
    user: req.user,
    errors: [],
    formData: {}
  });
};

// Afficher la page d'inscription
export const getRegisterPage = (req, res) => {
  res.render("register", {
    title: "Créer un compte",
    message: "Veuillez remplir le formulaire pour vous inscrire",
    user: req.user,
    errors: [],
    formData: {}
  });
};

// Traiter l’inscription
export const register = async (req, res) => {
  try {
    const { nom_prenom, email, mot_de_passe, confirm_password } = req.body;

    if (mot_de_passe !== confirm_password) {
      return res.status(400).send("Les mots de passe ne correspondent pas.");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send("Un compte avec cet email existe déjà.");
    }

    const hashedPassword = await argon2.hash(mot_de_passe);

    await User.create({
      nom_prenom,
      email,
      mot_de_passe: hashedPassword,
      role: "visiteur"
    });

    res.redirect("/auth");
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).send("Erreur lors de l'inscription");
  }
};

export const login = async (req, res) => {
  const { email, mot_de_passe } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).send("Identifiants invalides.");
  }
  const valid = await argon2.verify(user.mot_de_passe, mot_de_passe);
  if (!valid) {
    return res.status(401).send("Identifiants invalides.");
  }
  // Enregistre l'utilisateur dans la session
  req.session.user = user;
  res.redirect("/"); // Redirige vers l'accueil ou une autre page
};