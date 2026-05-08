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
        auth: user && pass ? { user, pass } : undefined,
      }
    : {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: user && pass ? { user, pass } : undefined,
      }
);

// Vérifier la connexion
if (user && pass) {
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️  Email service non disponible:', error.message);
    } else {
      console.log('✅ Email service configuré et prêt');
    }
  });
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export async function sendResetEmail(email, resetToken, resetUrl) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@miamor.com',
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Mi Amor',
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
                <h1>Mi Amor - Réinitialisation de mot de passe</h1>
              </div>
              
              <div class="content">
                <p>Bonjour,</p>
                
                <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous pour continuer :</p>
                
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                
                <p>Ou copiez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
                  ${resetUrl}
                </p>
                
                <div class="warning">
                  <strong>⚠️  Important :</strong> Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </div>
                
                <p>Cordialement,<br>L'équipe Mi Amor</p>
              </div>
              
              <div class="footer">
                <p>Cet email a été envoyé parce qu'une demande de réinitialisation de mot de passe a été faite sur le compte associé à cette adresse email.</p>
                <p>Si vous avez des questions, contactez-nous à support@miamor.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Bonjour,

Vous avez demandé une réinitialisation de mot de passe. Visitez ce lien pour continuer :

${resetUrl}

Ce lien expirera dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe Mi Amor
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de réinitialisation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi d\'email:', error);
    throw error;
  }
}

/**
 * Envoyer un email de confirmation de réinitialisation
 */
export async function sendConfirmationEmail(email, userName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@miamor.com',
      to: email,
      subject: 'Votre mot de passe a été réinitialisé - Mi Amor',
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
                
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/auth" class="button">Se connecter</a>
                
                <p>Si vous n'avez pas effectué cette action, veuillez contacter le support immédiatement.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Bonjour ${userName},

Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.

Si vous n'avez pas effectué cette action, veuillez contacter le support immédiatement.

Cordialement,
L'équipe Mi Amor
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi d\'email:', error);
    throw error;
  }
}

/**
 * Envoyer un email de confirmation d'inscription à la newsletter
 */
export async function sendNewsletterConfirmationEmail(email, confirmationToken) {
  try {
    const confirmUrl = `${process.env.APP_URL || 'http://localhost:3000'}/newsletter/confirm/${confirmationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@miamor.com',
      to: email,
      subject: 'Confirmez votre inscription à la newsletter - Mi Amor',
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
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; color: #0d6efd;">📧 Mi Amor Newsletter</h1>
              </div>
              
              <div class="content">
                <h2>Confirmez votre inscription</h2>
                
                <p>Merci de votre intérêt pour notre newsletter !</p>
                
                <p>Pour finaliser votre inscription et commencer à recevoir nos articles, veuillez cliquer sur le bouton ci-dessous :</p>
                
                <a href="${confirmUrl}" class="button">Confirmer mon inscription</a>
                
                <p>Ou copiez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; color: #666;">${confirmUrl}</p>
                
                <p><strong>Ce lien est valide pendant 24 heures.</strong></p>
                
                <p>Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email en toute sécurité.</p>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Mi Amor - Tous droits réservés</p>
                <p>Cet email a été envoyé à ${email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Confirmez votre inscription à la newsletter Mi Amor

Merci de votre intérêt pour notre newsletter !

Pour finaliser votre inscription et commencer à recevoir nos articles, veuillez cliquer sur ce lien :
${confirmUrl}

Ce lien est valide pendant 24 heures.

Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email en toute sécurité.

Cordialement,
L'équipe Emi-Pulse
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmation newsletter envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi d\'email de confirmation:', error);
    throw error;
  }
}

/**
 * Envoyer un email de bienvenue après confirmation
 */
export async function sendNewsletterWelcomeEmail(email) {
  try {
    const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@miamor.com',
      to: email,
      subject: 'Bienvenue dans la newsletter Mi Amor ! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0d6efd; color: white; padding: 30px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
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
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 Bienvenue chez Mi Amor !</h1>
              </div>
              
              <div class="content">
                <p>Félicitations ! Votre inscription à notre newsletter est maintenant confirmée.</p>
                
                <p>Vous allez désormais recevoir régulièrement nos meilleurs articles sur :</p>
                <ul>
                  <li>✨ La beauté et le bien-être</li>
                  <li>🥗 La nutrition et la santé</li>
                  <li>🌟 Le développement personnel</li>
                </ul>
                
                <p>Découvrez dès maintenant nos derniers articles :</p>
                <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="button">Visiter le blog</a>
                
                <p>Nous sommes ravis de vous compter parmi nos lecteurs !</p>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Mi Amor - Tous droits réservés</p>
                <p>Vous recevez cet email car vous êtes inscrit à notre newsletter.</p>
                <p><a href="${unsubscribeUrl}" style="color: #666;">Se désabonner</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Bienvenue chez Emi Pulse !

Félicitations ! Votre inscription à notre newsletter est maintenant confirmée.

Vous allez désormais recevoir régulièrement nos meilleurs articles.


Découvrez nos derniers articles sur : ${process.env.APP_URL || 'http://localhost:3000'}

Nous sommes ravis de vous compter parmi nos lecteurs !

---
Pour vous désabonner : ${unsubscribeUrl}

Cordialement,
L'équipe Mi Amor
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenue envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi d\'email de bienvenue:', error);
    throw error;
  }
}
