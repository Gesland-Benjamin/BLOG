import argon2 from "argon2";
import { sequelize } from "../config/database.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";
import Article from "../models/Article.model.js";
import Commentaire from "../models/Commentaire.model.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";

async function seedDatabase() {
  try {
    console.log("🌱 Démarrage du seeding...");

    // 🔹 Vider les tables existantes (dans l'ordre pour respecter les FK)
    await Commentaire.destroy({ where: {}, force: true });
    await Article.destroy({ where: {}, force: true });
    await NewsletterSubscriber.destroy({ where: {}, force: true });
    await Categorie.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    console.log("🗑️  Tables vidées");

    // 🔹 1. Créer l'admin
    const adminPassword = await argon2.hash("KJarakoCHA62*");
    const admin = await User.create({
      name: "Émilie Delbe",
      email: "contact@emi-pulse.fr",
      password: adminPassword,
      role: "admin",
    });
    console.log("✅ Admin créé");

    // 🔹 2. Créer quelques catégories
    const categories = await Categorie.bulkCreate([
      { name: "Technologie", description: "Articles sur la tech et l'innovation" },
      { name: "Lifestyle", description: "Bien-être, voyage et conseils" },
      { name: "Actualités", description: "Dernières nouvelles et événements" },
    ]);
    console.log("✅ Catégories créées");

    // 🔹 3. Créer quelques articles
    const articles = await Article.bulkCreate([
      {
        title: "Bienvenue sur notre blog",
        content: "Ceci est le premier article de démonstration.",
        image: null,
        likes: 0,
        userId: admin.id,
        categorieId: categories[0].id,
      },
      {
        title: "Astuce Lifestyle",
        content: "Quelques conseils pour améliorer votre quotidien.",
        image: null,
        likes: 0,
        userId: admin.id,
        categorieId: categories[1].id,
      },
    ]);
    console.log("✅ Articles créés");

    // 🔹 4. Créer un commentaire de test
    await Commentaire.create({
      content: "Super article !",
      userId: admin.id,
      articleId: articles[0].id,
      statut: "approved",
      is_admin_reply: true,
    });
    console.log("✅ Commentaire créé");

    // 🔹 5. Créer un abonné newsletter
    await NewsletterSubscriber.create({
      email: "abonne@example.com",
      user_id: admin.id,
      confirmed: true,
      confirmed_at: new Date(),
    });
    console.log("✅ Abonné newsletter créé");

    console.log("🌱 Seed terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
  } finally {
    await sequelize.close(); // ferme proprement la connexion
    process.exit(0);
  }
}

seedDatabase();