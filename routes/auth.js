import { Router } from "express";
import { getAuthPage, getRegisterPage, register, login } from "../controllers/auth-controller.js";

const router = Router();

router.get("/", getAuthPage);
router.get("/register", getRegisterPage);

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth"); // Redirige vers la page de connexion après déconnexion
  });
});


// Traitement du formulaire
router.post("/register", register); 
router.post("/", login);

export default router;


