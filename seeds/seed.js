import argon2 from "argon2";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";
import Article from "../models/Article.model.js";
import Commentaire from "../models/Commentaire.model.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import { sequelize } from "../config/database.js";

async function seedDatabase() {
  try {
    console.log("🌱 Démarrage du seeding...");

    // Vider les tables existantes
    await Commentaire.destroy({ where: {}, force: true });
    await Article.destroy({ where: {}, force: true });
    await NewsletterSubscriber.destroy({ where: {}, force: true });
    await Categorie.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    console.log("🗑️  Tables vidées");

    // 1. Créer l'admin
    const adminPassword = await argon2.hash("KJarakoCHA62*");

    const admin = await User.create({
      nom_prenom: "Émilie Delbe",
      email: "contact@emi-pulse.fr",
      mot_de_passe: adminPassword,
      role: "admin"
    });

    console.log("✅ Admin créé");

  

  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
