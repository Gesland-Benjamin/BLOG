import crypto from 'crypto';
import User from '../models/User.model.js';
import { sendResetEmail, sendConfirmationEmail } from '../services/email.js';
import argon2 from 'argon2';

/**
 * Afficher le formulaire "Mot de passe oublié"
 */
export const showForgotPasswordForm = async (req, res) => {
  try {
    res.render('forgot-password', { error: null, message: null, devToken: null });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du formulaire:', error);
    res.status(500).render('500');
  }
};

/**
 * Traiter la demande de réinitialisation (envoyer l'email)
 */
export const sendPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === '') {
      return res.render('forgot-password', {
        error: 'Veuillez entrer votre adresse email',
        message: null,
        devToken: null
      });
    }

    // Trouver l'utilisateur par email
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.render('forgot-password', {
        error: null,
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation',
        devToken: null
      });
    }

    // Générer un token unique et valide 1 heure
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Sauvegarder le token
    await user.update({
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    // Construire l'URL de réinitialisation
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset/${resetToken}`;

    // Envoyer l'email (ou afficher un message de fallback)
    try {
      await sendResetEmail(user.email, resetToken, resetUrl);
    } catch (emailError) {
      console.warn('Email non envoyé, affichage du token en dev:', emailError);
      // En développement, afficher le token
      if (process.env.NODE_ENV !== 'production') {
        return res.render('forgot-password', {
          error: null,
          message: `Email de réinitialisation envoyé à ${user.email}`,
          devToken: resetToken // À supprimer en production
        });
      }
    }

    res.render('forgot-password', {
      error: null,
      message: `Email de réinitialisation envoyé à ${user.email}`,
      devToken: null
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).render('500');
  }
};

/**
 * Afficher le formulaire de réinitialisation avec token
 */
export const showResetPasswordForm = async (req, res) => {
  try {
    const { token } = req.params;

    // Chercher l'utilisateur avec ce token
    const user = await User.findOne({
      where: { reset_token: token }
    });

    if (!user || !user.reset_token_expiry || new Date() > user.reset_token_expiry) {
      return res.status(400).render('reset-password', {
        token,
        error: 'Ce lien de réinitialisation a expiré ou est invalide',
        isValid: false
      });
    }

    res.render('reset-password', {
      token,
      error: null,
      isValid: true
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du formulaire de réinitialisation:', error);
    res.status(500).render('500');
  }
};

/**
 * Traiter la réinitialisation du mot de passe
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, password_confirm } = req.body;

    // Validation
    if (!password || password.trim() === '') {
      return res.render('reset-password', {
        token,
        error: 'Veuillez entrer un nouveau mot de passe',
        isValid: true
      });
    }

    if (password !== password_confirm) {
      return res.render('reset-password', {
        token,
        error: 'Les mots de passe ne correspondent pas',
        isValid: true
      });
    }

    if (password.length < 8) {
      return res.render('reset-password', {
        token,
        error: 'Le mot de passe doit contenir au moins 8 caractères',
        isValid: true
      });
    }

    // Chercher l'utilisateur avec ce token
    const user = await User.findOne({
      where: { reset_token: token }
    });

    if (!user || !user.reset_token_expiry || new Date() > user.reset_token_expiry) {
      return res.status(400).render('reset-password', {
        token,
        error: 'Ce lien de réinitialisation a expiré ou est invalide',
        isValid: false
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await argon2.hash(password);

    // Mettre à jour l'utilisateur
    await user.update({
      mot_de_passe: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });

    // Envoyer un email de confirmation
    try {
      await sendConfirmationEmail(user.email, user.nom_prenom);
    } catch (emailError) {
      console.warn('Email de confirmation non envoyé:', emailError);
    }

    req.session.message = {
      type: 'success',
      text: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    };

    res.redirect('/auth');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).render('500');
  }
};
