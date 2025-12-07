import Joi from 'joi';

// Schéma d'inscription
export const registerSchema = Joi.object({
  nom_prenom: Joi.string()
    .min(3)
    .max(150)
    .required()
    .messages({
      'string.empty': 'Le nom complet est requis',
      'string.min': 'Le nom doit contenir au moins 3 caractères',
      'string.max': 'Le nom ne peut pas dépasser 150 caractères',
      'any.required': 'Le nom complet est requis'
    }),
  email: Joi.string()
    .email()
    .max(150)
    .required()
    .messages({
      'string.empty': 'L\'adresse email est requise',
      'string.email': 'L\'adresse email n\'est pas valide',
      'string.max': 'L\'email ne peut pas dépasser 150 caractères',
      'any.required': 'L\'adresse email est requise'
    }),
  mot_de_passe: Joi.string()
    .min(8)
    .max(255)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
      'any.required': 'Le mot de passe est requis'
    }),
  mot_de_passe_confirm: Joi.string()
    .valid(Joi.ref('mot_de_passe'))
    .required()
    .messages({
      'any.only': 'Les mots de passe ne correspondent pas',
      'any.required': 'La confirmation du mot de passe est requise'
    })
});

// Schéma de connexion
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'adresse email est requise',
      'string.email': 'L\'adresse email n\'est pas valide',
      'any.required': 'L\'adresse email est requise'
    }),
  mot_de_passe: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'any.required': 'Le mot de passe est requis'
    })
});

// Schéma mot de passe oublié
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'adresse email est requise',
      'string.email': 'L\'adresse email n\'est pas valide',
      'any.required': 'L\'adresse email est requise'
    })
});

// Schéma réinitialisation mot de passe
export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(255)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Le nouveau mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
      'any.required': 'Le nouveau mot de passe est requis'
    }),
  password_confirm: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Les mots de passe ne correspondent pas',
      'any.required': 'La confirmation du mot de passe est requise'
    })
});

// Schéma création/édition d'article
export const articleSchema = Joi.object({
  titre: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Le titre est requis',
      'string.min': 'Le titre doit contenir au moins 5 caractères',
      'string.max': 'Le titre ne peut pas dépasser 255 caractères',
      'any.required': 'Le titre est requis'
    }),
  contenu: Joi.string()
    .min(50)
    .required()
    .messages({
      'string.empty': 'Le contenu est requis',
      'string.min': 'Le contenu doit contenir au moins 50 caractères',
      'any.required': 'Le contenu est requis'
    }),
  categorie_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'La catégorie est invalide',
      'number.integer': 'La catégorie est invalide',
      'number.positive': 'La catégorie est invalide',
      'any.required': 'La catégorie est requise'
    })
});

// Schéma catégorie
export const categorySchema = Joi.object({
  nom: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Le nom de la catégorie est requis',
      'string.min': 'Le nom doit contenir au moins 3 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom de la catégorie est requis'
    })
});

// Schéma commentaire
export const commentSchema = Joi.object({
  nom: Joi.string()
    .min(3)
    .max(150)
    .when('user_id', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    })
    .messages({
      'string.empty': 'Votre nom est requis',
      'string.min': 'Le nom doit contenir au moins 3 caractères',
      'string.max': 'Le nom ne peut pas dépasser 150 caractères',
      'any.required': 'Votre nom est requis'
    }),
  contenu: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Le commentaire est requis',
      'string.min': 'Le commentaire doit contenir au moins 10 caractères',
      'string.max': 'Le commentaire ne peut pas dépasser 1000 caractères',
      'any.required': 'Le commentaire est requis'
    }),
  user_id: Joi.number().optional()
});

// Schéma newsletter
export const newsletterSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(150)
    .required()
    .messages({
      'string.empty': 'L\'adresse email est requise',
      'string.email': 'L\'adresse email n\'est pas valide',
      'string.max': 'L\'email ne peut pas dépasser 150 caractères',
      'any.required': 'L\'adresse email est requise'
    })
});
