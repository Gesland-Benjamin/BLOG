import argon2 from "argon2";
import User from "../models/User.model.js";

export const login = async (req, res) => {
  const { email, mot_de_passe } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).render("auth", { message: "Identifiants invalides." });
  }
  const valid = await argon2.verify(user.mot_de_passe, mot_de_passe);
  if (!valid) {
    return res.status(401).render("auth", { message: "Identifiants invalides." });
  }
 
  // Stocke l'utilisateur dans la session
  req.session.user = {
    id: user.id,
    nom_prenom: user.nom_prenom,
    email: user.email,
    role: user.role
  };

  res.redirect("/");
  
};