import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM || user;
  const to = process.env.SMTP_TEST_TO || user;

  console.log('=== SMTP TEST — configuration lue ===');
  console.log('HOST:', host);
  console.log('PORT:', port);
  console.log('USER:', user);
  console.log('FROM:', from);
  console.log('TO:', to);

  if (!user || !pass) {
    console.error('❌ EMAIL_USER ou EMAIL_PASSWORD manquant. Définis tes variables d\'environnement.');
    process.exit(2);
  }

  const transporter = nodemailer.createTransport(
    host
      ? {
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        }
      : {
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: { user, pass },
        }
  );

  try {
    console.log('🔎 Vérification du transporteur (transporter.verify())...');
    await transporter.verify();
    console.log('✅ Vérification OK — le serveur SMTP accepte la connexion.');
  } catch (err) {
    console.error('❌ Échec de la vérification SMTP :', err && err.message ? err.message : err);
    if (err && err.response) console.error('response:', err.response);
    if (err && err.code) console.error('code:', err.code);
    // Ne pas exit immédiatement — on tente quand même d'envoyer un email de test
  }

  const mailOptions = {
    from: from,
    to: to,
    subject: 'Test SMTP — Mi Amor',
    text: 'Test d\'envoi SMTP effectué depuis scripts/smtp-test.js',
  };

  try {
    console.log(`✉️ Envoi d'un email de test à ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé — info:', info);
    process.exit(0);
  } catch (err) {
    console.error('❌ Échec lors de l\'envoi du mail de test :', err && err.message ? err.message : err);
    if (err && err.response) console.error('response:', err.response);
    if (err && err.code) console.error('code:', err.code);
    process.exit(3);
  }
}

run();
