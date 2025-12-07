import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import { sendNewsletterConfirmationEmail, sendNewsletterWelcomeEmail } from "../services/email.js";
import crypto from 'crypto';

export const showNewsletterForm = (req, res) => {
  res.render("newsletter", { 
    title: "Inscription à la newsletter", 
    user: req.user,
    errors: [],
    formData: {}
  });
};

export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Vérifier si l'email existe déjà
    const existing = await NewsletterSubscriber.findOne({ where: { email } });
    
    if (existing) {
      if (existing.confirmed) {
        return res.render("newsletter", { 
          title: "Inscription à la newsletter", 
          message: "Cet email est déjà inscrit à notre newsletter.", 
          user: req.user,
          errors: [],
          formData: { email }
        });
      } else {
        // Renvoyer l'email de confirmation
        await sendNewsletterConfirmationEmail(email, existing.confirmation_token);
        return res.render("newsletter", { 
          title: "Inscription à la newsletter", 
          message: "Un email de confirmation a été renvoyé à votre adresse. Veuillez vérifier votre boîte mail.", 
          user: req.user,
          errors: [],
          formData: {}
        });
      }
    }
    
    // Générer un token de confirmation
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    
    // Créer l'abonnement en attente de confirmation
    await NewsletterSubscriber.create({ 
      email,
      confirmed: false,
      confirmation_token: confirmationToken,
      user_id: req.user ? req.user.id : null
    });
    
    // Envoyer l'email de confirmation
    try {
      await sendNewsletterConfirmationEmail(email, confirmationToken);
      res.render("newsletter", { 
        title: "Inscription à la newsletter", 
        message: "Merci ! Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte mail et cliquer sur le lien pour confirmer votre inscription.", 
        user: req.user,
        errors: [],
        formData: {}
      });
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      res.render("newsletter", { 
        title: "Inscription à la newsletter", 
        message: "Inscription enregistrée, mais l'email de confirmation n'a pas pu être envoyé. Veuillez réessayer plus tard.", 
        user: req.user,
        errors: [],
        formData: {}
      });
    }
    
  } catch (error) {
    console.error('Erreur inscription newsletter:', error);
    res.render("newsletter", { 
      title: "Inscription à la newsletter", 
      message: "Erreur lors de l'inscription. Veuillez réessayer.", 
      user: req.user,
      errors: [],
      formData: { email }
    });
  }
};

export const confirmSubscription = async (req, res) => {
  const { token } = req.params;
  
  try {
    const subscriber = await NewsletterSubscriber.findOne({ 
      where: { confirmation_token: token } 
    });
    
    if (!subscriber) {
      return res.render("newsletter-confirm", {
        title: "Confirmation d'inscription",
        success: false,
        message: "Ce lien de confirmation est invalide ou a expiré.",
        user: req.user
      });
    }
    
    if (subscriber.confirmed) {
      return res.render("newsletter-confirm", {
        title: "Confirmation d'inscription",
        success: true,
        message: "Votre inscription est déjà confirmée !",
        user: req.user
      });
    }
    
    // Confirmer l'inscription
    subscriber.confirmed = true;
    subscriber.confirmed_at = new Date();
    subscriber.confirmation_token = null; // Invalider le token
    await subscriber.save();
    
    // Envoyer l'email de bienvenue
    try {
      await sendNewsletterWelcomeEmail(subscriber.email);
    } catch (emailError) {
      console.error('Erreur envoi email bienvenue:', emailError);
    }
    
    res.render("newsletter-confirm", {
      title: "Confirmation d'inscription",
      success: true,
      message: "Merci ! Votre inscription à la newsletter est confirmée. Vous allez recevoir nos prochains articles par email.",
      user: req.user
    });
    
  } catch (error) {
    console.error('Erreur confirmation newsletter:', error);
    res.status(500).render("500", { error: error.message });
  }
};

export const showUnsubscribeForm = async (req, res) => {
  const { email } = req.query;
  
  res.render("newsletter-unsubscribe", {
    title: "Se désabonner de la newsletter",
    email: email || '',
    user: req.user,
    errors: [],
    formData: { email: email || '' }
  });
};

export const unsubscribe = async (req, res) => {
  const { email } = req.body;
  
  try {
    const subscriber = await NewsletterSubscriber.findOne({ where: { email } });
    
    if (!subscriber) {
      return res.render("newsletter-unsubscribe", {
        title: "Se désabonner de la newsletter",
        message: "Cette adresse email n'est pas inscrite à notre newsletter.",
        email,
        user: req.user,
        errors: [],
        formData: { email }
      });
    }
    
    // Supprimer l'abonnement
    await subscriber.destroy();
    
    res.render("newsletter-unsubscribe", {
      title: "Désinscription confirmée",
      success: true,
      message: "Vous avez été désinscrit avec succès de notre newsletter. Nous sommes désolés de vous voir partir !",
      email: '',
      user: req.user,
      errors: [],
      formData: {}
    });
    
  } catch (error) {
    console.error('Erreur désinscription newsletter:', error);
    res.render("newsletter-unsubscribe", {
      title: "Se désabonner de la newsletter",
      message: "Erreur lors de la désinscription. Veuillez réessayer.",
      email,
      user: req.user,
      errors: [],
      formData: { email }
    });
  }
};

