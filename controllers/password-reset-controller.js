import argon2 from 'argon2';
import User from '../models/User.model.js';
import { sendResetEmail, sendConfirmationEmail } from '../services/email.js';
import { appUrl, signToken, tokenPayload, verifyToken, safeLog } from '../utils/security.js';

const genericMessage = 'Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé.';
export const showForgotPasswordForm = (req, res) => res.render('forgot-password', { error: null, message: null, devToken: null });
export async function sendPasswordReset(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.scope('withPassword').findOne({ where: { email } });
    res.render('forgot-password', { error: null, message: genericMessage, devToken: null });
    if (user) {
      const token = signToken('password-reset', { id: user.id }, user.password, 3600);
      void sendResetEmail(user.email, token, `${appUrl()}/auth/reset/${token}`).catch(safeLog);
    }
  } catch (error) { next(error); }
}
async function tokenUser(token) {
  const payload = tokenPayload(token);
  if (!payload) return null;
  const user = await User.scope('withPassword').findByPk(payload.id);
  return user && verifyToken(token, 'password-reset', user.password) ? user : null;
}
export async function showResetPasswordForm(req, res, next) {
  try {
    const user = await tokenUser(req.params.token);
    res.status(user ? 200 : 400).render('reset-password', {
      token: req.params.token, isValid: !!user, error: user ? null : 'Lien invalide ou expiré', errors: []
    });
  } catch (error) { next(error); }
}
export async function resetPassword(req, res, next) {
  try {
    const user = await tokenUser(req.params.token);
    if (!user) return res.status(400).render('reset-password', { token: '', isValid: false, error: 'Lien invalide ou expiré', errors: [] });
    const hashed = await argon2.hash(req.body.password);
    // Compare-and-swap : un seul des deux usages simultanés d'un lien peut réussir.
    const [changed] = await User.update({ password: hashed }, { where: { id: user.id, password: user.password } });
    if (changed !== 1) return res.status(400).render('reset-password', { token: '', isValid: false, error: 'Lien déjà utilisé', errors: [] });
    // L'empreinte du hash a changé : loadSessionUser rejette toutes les anciennes sessions.
    req.session.regenerate(error => {
      if (error) return next(error);
      req.session.message = 'Mot de passe mis à jour. Vous pouvez vous connecter.';
      req.session.save(error => error ? next(error) : res.redirect('/auth'));
    });
    void sendConfirmationEmail(user.email, user.name).catch(safeLog);
  } catch (error) { next(error); }
}
