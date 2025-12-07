import { Router } from "express";
import { getAuthPage, getRegisterPage, register, login } from "../controllers/auth-controller.js";
import { showForgotPasswordForm, sendPasswordReset, showResetPasswordForm, resetPassword } from "../controllers/password-reset-controller.js";
import { validateRequest } from "../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/schemas.js";
import { loginRateLimit, formRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", getAuthPage);
router.get("/register", getRegisterPage);
router.get("/forgot", showForgotPasswordForm);
router.post("/forgot", formRateLimit, validateRequest(forgotPasswordSchema), sendPasswordReset);
router.get("/reset/:token", showResetPasswordForm);
router.post("/reset/:token", formRateLimit, validateRequest(resetPasswordSchema), resetPassword);

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur lors de la destruction de session:', err);
      return res.status(500).render('500');
    }
    // Vider aussi le cookie de session
    res.clearCookie('connect.sid');
    res.redirect("/");
  });
});

// Traitement du formulaire - avec rate limiting strict pour éviter les attaques par force brute
router.post("/register", formRateLimit, validateRequest(registerSchema), register); 
router.post("/", loginRateLimit, validateRequest(loginSchema), login);

export default router;


