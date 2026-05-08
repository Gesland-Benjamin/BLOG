import { Router } from "express";

import {
  getAuthPage,
  getRegisterPage,
  register,
  login
} from "../controllers/auth-controller.js";

import {
  showForgotPasswordForm,
  sendPasswordReset,
  showResetPasswordForm,
  resetPassword
} from "../controllers/password-reset-controller.js";

import { validateRequest } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../validators/schemas.js";

import {
  loginRateLimit,
  formRateLimit
} from "../middleware/rateLimit.js";

const router = Router();

// ====================== AUTH PAGES ======================
router.get("/", getAuthPage);
router.get("/register", getRegisterPage);

// ====================== FORGOT PASSWORD ======================
router.get("/forgot", showForgotPasswordForm);
router.post(
  "/forgot",
  formRateLimit,
  validateRequest(forgotPasswordSchema),
  sendPasswordReset
);

// ====================== RESET PASSWORD ======================
router.get("/reset/:token", showResetPasswordForm);
router.post(
  "/reset/:token",
  formRateLimit,
  validateRequest(resetPasswordSchema),
  resetPassword
);

// ====================== REGISTER ======================
router.post(
  "/register",
  formRateLimit,
  validateRequest(registerSchema),
  register
);

// ====================== LOGIN ======================
router.post(
  "/",
  loginRateLimit,
  validateRequest(loginSchema),
  login
);

// ====================== LOGOUT ======================
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Erreur destruction session:", err);
      return res.status(500).render("500");
    }

    res.clearCookie("sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    console.log("✅ LOGOUT SUCCESS");

    return res.redirect("/?logout=1");
  });
});

export default router;