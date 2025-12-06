import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";

export const showNewsletterForm = (req, res) => {
  res.render("newsletter", { title: "Inscription à la newsletter", user: req.user } );
};

export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;
  try {
    await NewsletterSubscriber.create({ email });
    res.render("newsletter", { title: "Inscription à la newsletter", message: "Inscription réussie !", user: req.user});
  } catch (error) {
    res.render("newsletter", { title: "Inscription à la newsletter", message: "Erreur : cet email est déjà abonné ou invalide.", user: req.user});
  }
};

