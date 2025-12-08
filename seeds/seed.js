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
    const adminPassword = await argon2.hash("Admin123!");

    const admin = await User.create({
      nom_prenom: "Émilie Delbe",
      email: "admin@miamor.com",
      mot_de_passe: adminPassword,
      role: "admin"
    });

    console.log("✅ Admin créé");

    // 2. Créer les catégories
    const beaute = await Categorie.create({ nom: "Beauté" });
    const nutrition = await Categorie.create({ nom: "Nutrition" });
    const developpement = await Categorie.create({ nom: "Développement Personnels" });

    console.log("✅ Catégories créées");

    // 3. Créer les articles Beauté (8 articles)
    const beauteArticles = await Article.bulkCreate([
      {
        titre: "Les secrets d'une peau éclatante",
        contenu: `<p>Découvrez comment obtenir une peau éclatante et radieuse grâce à des techniques éprouvées.</p><h3>Nettoyage quotidien</h3><p>Le nettoyage est la première étape pour une belle peau. Utilisez un nettoyant doux adapté à votre type de peau.</p><h3>Hydratation</h3><p>L'hydratation est essentielle pour maintenir l'élasticité et la luminosité de votre peau.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Femme avec peau éclatante",
        likes: 15
      },
      {
        titre: "Routines beauté matinales",
        contenu: `<p>Établissez une routine beauté matinale qui prépare votre peau pour la journée.</p><h3>Étape 1 : Nettoyage</h3><p>Commencez par nettoyer votre peau avec de l'eau tiède.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Routine beauté matinale",
        likes: 22
      },
      {
        titre: "Masques faciaux : guide complet",
        contenu: `<p>Apprenez à choisir et utiliser les bons masques faciaux pour votre peau.</p><h3>Masques hydratants</h3><p>Parfaits pour les peaux sèches.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Masque facial",
        likes: 18
      },
      {
        titre: "Soins des lèvres",
        contenu: `<p>Les lèvres nécessitent une attention particulière pour rester douces.</p><h3>Exfoliation</h3><p>Éliminez les peaux mortes régulièrement.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Soins lèvres",
        likes: 12
      },
      {
        titre: "Contour des yeux",
        contenu: `<p>Le contour des yeux est une zone délicate qui mérite une attention spéciale.</p><h3>Crèmes spécialisées</h3><p>Investissez dans une bonne crème contour.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Contour yeux",
        likes: 16
      },
      {
        titre: "Traitement de l'acné",
        contenu: `<p>Comprendre et traiter l'acné pour une peau saine.</p><h3>Traitements efficaces</h3><p>Différentes solutions existent pour l'acné.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Traitement acné",
        likes: 24
      },
      {
        titre: "Produits bio recommandés",
        contenu: `<p>Découvrez les meilleurs produits de beauté naturels.</p><h3>Avantages</h3><p>Sans produits chimiques agressifs.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Produits bio",
        likes: 19
      },
      {
        titre: "Routine cheveux",
        contenu: `<p>Des cheveux sains commencent par une bonne routine.</p><h3>Shampoing</h3><p>Choisissez un shampoing adapté à votre type.</p>`,
        categorie_id: beaute.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Cheveux sains",
        likes: 21
      }
    ]);

    console.log("✅ Articles Beauté créés (8)");

    // 4. Créer les articles Nutrition (8 articles)
    const nutritionArticles = await Article.bulkCreate([
      {
        titre: "L'importance du petit-déjeuner",
        contenu: `<p>Le petit-déjeuner est le repas le plus important de la journée.</p><h3>Bénéfices</h3><p>Augmente la concentration et l'énergie.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Petit-déjeuner sain",
        likes: 28
      },
      {
        titre: "Régimes populaires",
        contenu: `<p>Découvrez les régimes les plus populaires.</p><h3>Régime méditerranéen</h3><p>Riche en fruits et légumes.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Régimes",
        likes: 32
      },
      {
        titre: "Nutrition et sport",
        contenu: `<p>Optimisez vos performances avec une nutrition adaptée.</p><h3>Avant l'entraînement</h3><p>Mangez 1-2 heures avant.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Nutrition sport",
        likes: 25
      },
      {
        titre: "Superaliments",
        contenu: `<p>Intégrez les superaliments dans votre alimentation.</p><h3>Baies</h3><p>Riches en antioxydants.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Superaliments",
        likes: 30
      },
      {
        titre: "Hydratation : boire de l'eau",
        contenu: `<p>L'hydratation est essentielle pour la santé.</p><h3>Quantité recommandée</h3><p>8 verres par jour environ.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Hydratation",
        likes: 17
      },
      {
        titre: "Collations saines",
        contenu: `<p>Découvrez des collations délicieuses.</p><h3>Fruits</h3><p>Pommes, bananes, baies.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Collations",
        likes: 20
      },
      {
        titre: "Cuisson saine",
        contenu: `<p>Apprenez les meilleures méthodes de cuisson.</p><h3>Vapeur</h3><p>Préserve les vitamines.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Cuisson saine",
        likes: 19
      },
      {
        titre: "Régime végétalien",
        contenu: `<p>Comment obtenir tous les nutriments en tant que végétalien.</p><h3>Protéines</h3><p>Légumineuses et tofu.</p>`,
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Végétalien",
        likes: 23
      }
    ]);

    console.log("✅ Articles Nutrition créés (8)");

    // 5. Créer les articles Développement Personnel (8 articles)
    const devArticles = await Article.bulkCreate([
      {
        titre: "Objectifs SMART",
        contenu: `<p>Apprenez à définir des objectifs réalistes.</p><h3>Spécifique</h3><p>Définissez clairement ce que vous voulez.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Objectifs",
        likes: 35
      },
      {
        titre: "Gestion du temps",
        contenu: `<p>Maîtrisez votre temps pour être plus productif.</p><h3>Technique Pomodoro</h3><p>Travaillez 25 minutes, puis prenez une pause.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Gestion temps",
        likes: 40
      },
      {
        titre: "Confiance en soi",
        contenu: `<p>Développez une confiance en vous durable.</p><h3>Reconnaître vos forces</h3><p>Identifiez ce que vous faites bien.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Confiance",
        likes: 38
      },
      {
        titre: "Méditation",
        contenu: `<p>Trouvez la paix intérieure grâce à la méditation.</p><h3>Bénéfices</h3><p>Réduit le stress et améliore la concentration.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Méditation",
        likes: 33
      },
      {
        titre: "Créer des habitudes",
        contenu: `<p>Construisez des habitudes positives.</p><h3>Le cycle</h3><p>Signal → Routine → Récompense.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Habitudes",
        likes: 37
      },
      {
        titre: "Résilience",
        contenu: `<p>Apprenez à vous relever après les difficultés.</p><h3>Accepter</h3><p>Le changement est inévitable.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Résilience",
        likes: 29
      },
      {
        titre: "Apprendre à apprendre",
        contenu: `<p>Améliorez votre capacité à apprendre.</p><h3>Apprentissage actif</h3><p>Engagez-vous avec le matériel.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Apprentissage",
        likes: 26
      },
      {
        titre: "Communication",
        contenu: `<p>Apprenez à communiquer efficacement.</p><h3>Assertivité</h3><p>Exprimez-vous respectueusement.</p>`,
        categorie_id: developpement.id,
        auteur_id: admin.id,
        image: "/uploads/707833b1-374b-48e5-b9a6-2575b26279a8.webp",
        image_alt: "Communication",
        likes: 31
      }
    ]);

    console.log("✅ Articles Développement Personnel créés (8)");

    // 6. Créer les abonnés newsletter
    await NewsletterSubscriber.bulkCreate([
      { email: "subscriber1@example.com", confirmed: true, confirmed_at: new Date() },
      { email: "subscriber2@example.com", confirmed: true, confirmed_at: new Date() },
      { email: "subscriber3@example.com", confirmed: false },
      { email: "subscriber4@example.com", confirmed: true, confirmed_at: new Date() },
      { email: "subscriber5@example.com", confirmed: true, confirmed_at: new Date() }
    ]);

    console.log("✅ Abonnés newsletter créés");

    // 7. Créer les commentaires
    await Commentaire.bulkCreate([
      {
        article_id: beauteArticles[0].id,
        nom: "Marie Dupont",
        contenu: "Article très utile ! J'ai déjà commencé à appliquer ces conseils.",
        statut: "approved"
      },
      {
        article_id: beauteArticles[0].id,
        nom: "Jean Martin",
        contenu: "Merci pour ces recommandations pratiques et faciles à suivre.",
        statut: "approved"
      },
      {
        article_id: beauteArticles[1].id,
        nom: "Luc Bernard",
        contenu: "Ma peau s'est transformée en quelques semaines !",
        statut: "approved"
      },
      {
        article_id: nutritionArticles[0].id,
        nom: "Sophie Bernard",
        contenu: "Le petit-déjeuner est vraiment important ! J'ai remarqué une grosse différence.",
        statut: "approved"
      },
      {
        article_id: nutritionArticles[1].id,
        nom: "Thomas Lefevre",
        contenu: "Très bon guide des régimes, je vais essayer le méditerranéen.",
        statut: "approved"
      },
      {
        article_id: devArticles[0].id,
        nom: "Pierre Lefevre",
        contenu: "Les objectifs SMART m'ont vraiment aidé.",
        statut: "approved"
      },
      {
        article_id: devArticles[1].id,
        nom: "Isabelle Garcia",
        contenu: "La technique Pomodoro change vraiment ma productivité !",
        statut: "approved"
      },
      {
        article_id: devArticles[2].id,
        nom: "Antoine Moreau",
        contenu: "Enfin quelqu'un qui parle de confiance en soi de façon pratique.",
        statut: "approved"
      }
    ]);

    console.log("✅ Commentaires créés");

    console.log("\n✅ 🎉 SEED COMPLÉTÉ AVEC SUCCÈS !");
    console.log("\n📊 Résumé:");
    console.log(`   ✓ 3 catégories`);
    console.log(`   ✓ 8 articles Beauté`);
    console.log(`   ✓ 8 articles Nutrition`);
    console.log(`   ✓ 8 articles Développement Personnel`);
    console.log(`   ✓ Total: 24 articles avec images`);
    console.log(`   ✓ 5 abonnés newsletter`);
    console.log(`   ✓ 8 commentaires approuvés`);
    console.log("\n🔐 Identifiants admin:");
    console.log("   Email: admin@miamor.com");
    console.log("   Mot de passe: Admin123!");

  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
