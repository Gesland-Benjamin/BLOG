import Joi from "joi";

/* =========================
   LOGIN
========================= */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": "L'adresse email est requise",
      "string.email": "L'adresse email n'est pas valide",
      "any.required": "L'adresse email est requise"
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Le mot de passe est requis",
      "any.required": "Le mot de passe est requis"
    })
});


/* =========================
   REGISTER
========================= */
export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "Le nom est requis",
      "string.min": "Minimum 3 caractères",
      "string.max": "Maximum 100 caractères",
      "any.required": "Le nom est requis"
    }),

  email: Joi.string()
    .email()
    .max(150)
    .required()
    .messages({
      "string.empty": "L'email est requis",
      "string.email": "Email invalide",
      "any.required": "L'email est requis"
    }),

  password: Joi.string()
    .min(8)
    .max(255)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.empty": "Mot de passe requis",
      "string.min": "Min 8 caractères",
      "string.pattern.base": "Majuscule, minuscule et chiffre requis",
      "any.required": "Mot de passe requis"
    }),

  password_confirm: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Les mots de passe ne correspondent pas",
      "any.required": "Confirmation requise"
    })
});


/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
});


/* =========================
   RESET PASSWORD
========================= */
export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(255)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),

  password_confirm: Joi.string()
    .valid(Joi.ref("password"))
    .required()
});


/* =========================
   ARTICLE (FIX CRITIQUE)
========================= */
export const articleSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      "string.empty": "Le titre est requis",
      "string.min": "Minimum 5 caractères",
      "any.required": "Le titre est requis"
    }),

  content: Joi.string()
    .min(50)
    .required()
    .messages({
      "string.empty": "Le contenu est requis",
      "string.min": "Minimum 50 caractères",
      "any.required": "Le contenu est requis"
    }),

  categorieId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "Catégorie invalide",
      "any.required": "Catégorie requise"
    }),

  video: Joi.string()
    .uri()
    .allow("")
    .optional()
});


/* =========================
   CATEGORY (OPTIONNEL)
========================= */
export const categorySchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
});


/* =========================
   COMMENT
========================= */
export const commentSchema = Joi.object({
  nom: Joi.string()
    .min(3)
    .max(150)
    .optional(),

  contenu: Joi.string()
    .min(10)
    .max(1000)
    .required()
}).unknown(true);


/* =========================
   NEWSLETTER
========================= */
export const newsletterSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(150)
    .required()
});