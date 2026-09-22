import { createHash } from 'node:crypto';
import NewsletterSubscriber from '../models/NewsletterSubscriber.model.js';
import { sendNewsletterConfirmationEmail, sendNewsletterWelcomeEmail, sendUnsubscribeEmail } from '../services/email.js';
import { appUrl, signToken, tokenPayload, verifyToken, equalSecret, safeLog } from '../utils/security.js';
import { newsletterSchema } from '../validators/schemas.js';

const binding = subscriber => `${subscriber.email}\0${new Date(subscriber.date_inscription).toISOString()}`;
const tokenHash = token => createHash('sha256').update(token).digest('hex');
const unsubscribeLink = subscriber => `${appUrl()}/newsletter/unsubscribe?token=${signToken('unsubscribe', { id: subscriber.id }, binding(subscriber), 365 * 86400)}`;
export const showNewsletterForm = (req, res) => res.render('newsletter', { title: 'Newsletter', errors: [], message: null, formData: {} });

export async function sendSubscriberConfirmation(subscriber) {
  if (subscriber.confirmed) return;
  const token = signToken('newsletter-confirm', { id: subscriber.id }, binding(subscriber), 48 * 3600);
  await subscriber.update({ confirmation_token: tokenHash(token) });
  await sendNewsletterConfirmationEmail(subscriber.email, token);
}

export async function subscribeNewsletter(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const [subscriber] = await NewsletterSubscriber.findOrCreate({
      where: { email }, defaults: { confirmed: false, confirmation_token: null, user_id: req.user?.id || null }
    });
    if (!subscriber.confirmed) {
      void sendSubscriberConfirmation(subscriber).catch(safeLog);
    }
    return res.render('newsletter', { title: 'Newsletter', errors: [], formData: {}, message: 'Si nécessaire, un email de confirmation vous sera envoyé.' });
  } catch (error) { next(error); }
}
export async function confirmSubscription(req, res, next) {
  try {
    const token = req.params.token;
    const payload = tokenPayload(token);
    const subscriber = payload ? await NewsletterSubscriber.findByPk(payload.id) : null;
    const valid = subscriber && verifyToken(token, 'newsletter-confirm', binding(subscriber)) && equalSecret(subscriber.confirmation_token, tokenHash(token));
    let success = false;
    if (valid) {
      const [changed] = await NewsletterSubscriber.update({ confirmed: true, confirmed_at: new Date(), confirmation_token: null }, {
        where: { id: subscriber.id, confirmed: false, confirmation_token: tokenHash(token) }
      });
      success = changed === 1;
      if (success) void sendNewsletterWelcomeEmail(subscriber.email, unsubscribeLink(subscriber)).catch(safeLog);
    }
    return res.status(success ? 200 : 400).render('newsletter-confirm', { title: 'Confirmation', success,
      message: success ? 'Inscription confirmée avec succès.' : 'Lien invalide, expiré ou déjà utilisé. Vous pouvez demander un nouvel email.' });
  } catch (error) { next(error); }
}
export const showUnsubscribeForm = (req, res) => res.render('newsletter-unsubscribe', {
  title: 'Désinscription', errors: [], message: null, success: false,
  token: typeof req.query.token === 'string' && req.query.token.length <= 2048 ? req.query.token : '', email: ''
});
export async function unsubscribe(req, res, next) {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token : '';
    if (token) {
      const payload = tokenPayload(token);
      const subscriber = payload ? await NewsletterSubscriber.findByPk(payload.id) : null;
      const valid = subscriber && verifyToken(token, 'unsubscribe', binding(subscriber));
      if (valid) await subscriber.destroy();
      return res.status(valid ? 200 : 400).render('newsletter-unsubscribe', {
        title: 'Désinscription', errors: [], email: '', token: '', success: !!valid,
        message: valid ? 'Votre désinscription est enregistrée.' : 'Ce lien est invalide ou expiré. Demandez-en un nouveau.'
      });
    }
    const { value, error } = newsletterSchema.validate({ email: req.body.email });
    if (error) return res.status(400).render('newsletter-unsubscribe', { title: 'Désinscription', errors: ['Adresse email invalide.'], email: '', token: '', success: false, message: null });
    const subscriber = await NewsletterSubscriber.findOne({ where: { email: value.email } });
    res.render('newsletter-unsubscribe', { title: 'Désinscription', errors: [], email: '', token: '', success: false,
      message: 'Si cette adresse est inscrite, un lien de désinscription vous sera envoyé.' });
    if (subscriber) void sendUnsubscribeEmail(subscriber.email, unsubscribeLink(subscriber)).catch(safeLog);
  } catch (error) { next(error); }
}
