import { newsletterEmail } from './newsletterTemplate.js';
import { escapeHtml, appUrl, safeLog } from '../utils/security.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Construction du transporteur email
// Priorité : si EMAIL_HOST est défini, on utilise host/port/secure ; sinon service
const hasHostConfig = !!process.env.EMAIL_HOST;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;

if (!user || !pass) {
  console.warn('⚠️  Email: identifiants manquants (EMAIL_USER / EMAIL_PASSWORD)');
}

const transporter = nodemailer.createTransport(
  hasHostConfig
    ? {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        requireTLS: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        auth: user && pass ? { user, pass } : undefined,
        logger: process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEBUG === 'true',
        debug: process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEBUG === 'true',
      }
    : {
        service: process.env.EMAIL_SERVICE || 'gmail',
        requireTLS: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        auth: user && pass ? { user, pass } : undefined,
        logger: process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEBUG === 'true',
        debug: process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEBUG === 'true',
      }
);

// Aucun destinataire, lien sensible ou contenu de message journalisé.
async function sendMailWithLogging(mailOptions) {
  return transporter.sendMail(mailOptions);
}

function getBrandFromAddress() {
  return `Emi-Pulse <${process.env.EMAIL_USER || 'contact@emi-pulse.fr'}>`;
}

function buildNewsletterText(lines) {
  return lines.filter(Boolean).join('\n\n');
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export async function sendResetEmail(email, resetToken, resetUrl) {
  try {
    const mailOptions = {
      from: getBrandFromAddress(),
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      replyTo: process.env.EMAIL_USER || 'contact@emi-pulse.fr',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
              .content { padding: 20px; }
              .button { 
                display: inline-block; 
                background-color: #0d6efd; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 5px;
                margin: 20px 0;
              }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
              .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Emi-Pulse</h1>
              </div>
              
              <div class="content">
                <p>Bonjour,</p>
                <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte Emi-Pulse.</p>
                <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                
                <p>Ou copiez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
                  ${resetUrl}
                </p>
                
                <div class="warning">
                  <strong>⚠️  Important :</strong> Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </div>
                
                <p>Cordialement,<br>L'équipe Emi-Pulse</p>
              </div>
              
              <div class="footer">
                <p>Cet email a été envoyé parce qu'une demande de réinitialisation de mot de passe a été faite sur le compte associé à cette adresse email.</p>
                <p>Si vous avez des questions, répondez simplement à ce message.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: buildNewsletterText([
        'Réinitialisation de votre mot de passe Emi-Pulse',
        'Vous avez demandé une réinitialisation de mot de passe pour votre compte Emi-Pulse.',
        `Créez un nouveau mot de passe ici : ${resetUrl}`,
        'Ce lien expirera dans 1 heure.',
        "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.",
        'Cordialement,',
        'L\'équipe Emi-Pulse'
      ])
    };

    await sendMailWithLogging(mailOptions);

    return true;
  } catch (error) {
    safeLog(error);
    throw error;
  }
}

/**
 * Envoyer un email de confirmation de réinitialisation
 */
export async function sendConfirmationEmail(email, userName) {
  try {
    const mailOptions = {
      from: getBrandFromAddress(),
      to: email,
      subject: 'Votre mot de passe Emi-Pulse a été réinitialisé',
      replyTo: process.env.EMAIL_USER || 'contact@emi-pulse.fr',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #d4edda; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
              .content { padding: 20px; }
              .button { 
                display: inline-block; 
                background-color: #0d6efd; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 5px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Mot de passe réinitialisé</h1>
              </div>
              
              <div class="content">
                <p>Bonjour ${userName},</p>
                
                <p>Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                
                <a href="${appUrl()}/auth" class="button">Se connecter</a>
                
                <p>Si vous n'avez pas effectué cette action, veuillez contacter le support immédiatement.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: buildNewsletterText([
        `Bonjour ${userName},`,
        'Votre mot de passe Emi-Pulse a été réinitialisé avec succès.',
        'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
        "Si vous n'avez pas effectué cette action, veuillez contacter le support immédiatement.",
        'Cordialement,',
        'L\'équipe Emi-Pulse'
      ])
    };

    await sendMailWithLogging(mailOptions);

    return true;
  } catch (error) {
    safeLog(error);
    throw error;
  }
}

/**
 * Envoyer un email de confirmation d'inscription à la newsletter
 */
export async function sendNewsletterConfirmationEmail(email, confirmationToken) {
  try {
    const confirmUrl = `${appUrl()}/newsletter/confirm/${confirmationToken}`;
    
    const mailOptions = {
      from: getBrandFromAddress(),
      to: email,
      subject: 'Confirmation de votre inscription à la newsletter Emi-Pulse',
      replyTo: process.env.EMAIL_USER || 'contact@emi-pulse.fr',
      html: newsletterEmail({
        title: 'Encore un clic pour nous rejoindre',
        preview: 'Confirmez votre inscription à la newsletter Emi’Pulse.',
        paragraphs: ['Bonjour,', 'Vous avez demandé à recevoir les articles et les nouvelles d’Emi’Pulse par e-mail. Confirmez votre adresse pour finaliser votre inscription.'],
        actionLabel: 'Confirmer mon inscription', actionUrl: confirmUrl,
        note: 'Ce lien est valable 48 heures. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre abonnement ne sera pas activé.'
      }),
      text: buildNewsletterText([
        'Confirmation de votre inscription à la newsletter Emi-Pulse',
        'Vous avez demandé à recevoir la newsletter Emi-Pulse.',
        `Validez votre inscription ici : ${confirmUrl}`,
        'Ce lien est valide pendant 48 heures.',
        "Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.",
        'Cordialement,',
        'L\'équipe Emi-Pulse'
      ])
    };

    await sendMailWithLogging(mailOptions);

    return true;
  } catch (error) {
    safeLog(error);
    throw error;
  }
}

/**
 * Envoyer un email de bienvenue après confirmation
 */
export async function sendNewsletterWelcomeEmail(email, unsubscribeUrl) {
  try {
    if (!unsubscribeUrl) throw new Error('Lien de désinscription requis');
    
    const mailOptions = {
      from: getBrandFromAddress(),
      to: email,
      subject: 'Bienvenue sur la newsletter Emi-Pulse',
      replyTo: process.env.EMAIL_USER || 'contact@emi-pulse.fr',
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'Precedence': 'bulk'
      },
      html: newsletterEmail({
        title: 'Bienvenue dans la newsletter',
        preview: 'Votre inscription est confirmée. À bientôt sur Emi’Pulse !',
        paragraphs: ['Votre inscription est confirmée, merci de nous rejoindre !', 'Vous pourrez recevoir les nouveaux articles et les actualités du blog directement dans votre boîte mail. En attendant, prenez le temps de découvrir les dernières publications.'],
        actionLabel: 'Découvrir les articles', actionUrl: `${appUrl()}/article`,
        note: 'Vous gardez le choix : un lien de désinscription est disponible au bas de ce message.',
        unsubscribeUrl
      }),
      text: buildNewsletterText([
        'Bienvenue sur la newsletter Emi-Pulse',
        'Votre inscription à la newsletter est confirmée.',
        'Vous pourrez recevoir les nouveaux articles et les actualités du blog.',
        `Découvrez nos derniers articles : ${appUrl()}`,
        `Pour vous désabonner : ${unsubscribeUrl}`,
        'Cordialement,',
        'L\'équipe Emi-pulse'
      ])
    };

    await sendMailWithLogging(mailOptions);

    return true;
  } catch (error) {
    safeLog(error);
    throw error;
  }
}

/**
 * Envoyer un email de demande de renseignements (formulaire contact)
 */
export async function sendContactInquiryEmail({ nom, email, telephone, sujet, message }) {
  try {
    const destination = process.env.CONTACT_TO || process.env.EMAIL_USER || 'contact@emi-pulse.fr';
    const safeNom = (nom || '').trim();
    const safeEmail = (email || '').trim();
    const safeTelephone = (telephone || '').trim() || 'Non renseigné';
    const safeSujet = (sujet || '').trim();
    const safeMessage = (message || '').trim();

    const mailOptions = {
      from: getBrandFromAddress(),
      to: destination,
      replyTo: safeEmail || (process.env.EMAIL_USER || 'contact@emi-pulse.fr'),
      subject: `[Renseignements] ${safeSujet}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 680px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 16px 20px; border-radius: 6px; margin-bottom: 18px; }
              .content { padding: 0 4px; }
              .field { margin: 0 0 8px; }
              .label { font-weight: bold; }
              .message { margin-top: 14px; padding: 14px; border: 1px solid #e9ecef; border-radius: 6px; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">Nouvelle demande de renseignements</h2>
              </div>
              <div class="content">
                <p class="field"><span class="label">Nom :</span> ${escapeHtml(safeNom)}</p>
                <p class="field"><span class="label">Email :</span> ${escapeHtml(safeEmail)}</p>
                <p class="field"><span class="label">Téléphone :</span> ${escapeHtml(safeTelephone)}</p>
                <p class="field"><span class="label">Objet :</span> ${escapeHtml(safeSujet)}</p>
                <div class="message">${escapeHtml(safeMessage)}</div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: buildNewsletterText([
        'Nouvelle demande de renseignements',
        `Nom: ${safeNom}`,
        `Email: ${safeEmail}`,
        `Téléphone: ${safeTelephone}`,
        `Objet: ${safeSujet}`,
        `Message:\n${safeMessage}`
      ])
    };

    await sendMailWithLogging(mailOptions);

    return true;
  } catch (error) {
    safeLog(error);
    throw error;
  }
}

export function sendUnsubscribeEmail(email, url) {
  return sendMailWithLogging({ from: getBrandFromAddress(), to: email,
    subject: 'Votre lien de désinscription Emi’Pulse',
    text: `Pour confirmer votre désinscription : ${url}`,
    html: newsletterEmail({
      title: 'Gérer votre abonnement', preview: 'Votre lien personnel de désinscription Emi’Pulse.',
      paragraphs: ['Vous avez demandé à vous désabonner de la newsletter. Ouvrez le lien ci-dessous, puis confirmez votre choix sur le site.'],
      actionLabel: 'Me désabonner', actionUrl: url,
      note: 'Si vous n’avez pas fait cette demande, vous pouvez ignorer ce message. Votre abonnement reste inchangé.'
    })
  });
}
