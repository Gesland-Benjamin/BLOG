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

    // Vider les tables existantes (ordre important pour respecter les contraintes FK)
    await Commentaire.destroy({ where: {}, force: true });
    await Article.destroy({ where: {}, force: true });
    await NewsletterSubscriber.destroy({ where: {}, force: true });
    await Categorie.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    console.log("🗑️  Tables vidées");

    // 1. Créer les utilisateurs
    const adminPassword = await argon2.hash("Admin123!");
    const visitorPassword = await argon2.hash("Visiteur123!");

    const admin = await User.create({
      nom_prenom: "Émilie Delbe",
      email: "admin@miamor.com",
      mot_de_passe: adminPassword,
      role: "admin"
    });

    const visitor1 = await User.create({
      nom_prenom: "Marie Dupont",
      email: "marie.dupont@example.com",
      mot_de_passe: visitorPassword,
      role: "visiteur"
    });

    const visitor2 = await User.create({
      nom_prenom: "Sophie Martin",
      email: "sophie.martin@example.com",
      mot_de_passe: visitorPassword,
      role: "visiteur"
    });

    console.log("✅ Utilisateurs créés (admin: admin@miamor.com / Admin123!)");

    // 2. Créer les catégories
    const beaute = await Categorie.create({ nom: "Beauté" });
    const nutrition = await Categorie.create({ nom: "Nutrition" });
    const devPerso = await Categorie.create({ nom: "Développement personnels" });

    console.log("✅ Catégories créées");

    // 3. Créer des articles de démo
    const articles = [
      {
        titre: "Les secrets d'une peau éclatante",
        contenu: "Une peau éclatante commence par une routine de soin adaptée. Il est essentiel de nettoyer votre peau matin et soir avec des produits doux qui respectent son équilibre naturel. L'hydratation est également cruciale : choisissez une crème adaptée à votre type de peau. N'oubliez pas la protection solaire, même en hiver ! Un SPF quotidien prévient le vieillissement prématuré et les taches pigmentaires. Enfin, une alimentation riche en antioxydants, une bonne hydratation et un sommeil réparateur sont vos meilleurs alliés pour une peau radieuse.",
        categorie_id: beaute.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        likes: 12
      },
      {
        titre: "Ma routine beauté du matin",
        contenu: "Chaque matin, je commence par nettoyer mon visage à l'eau tiède avec un nettoyant doux. J'applique ensuite un sérum vitaminé pour booster l'éclat, suivi d'une crème hydratante avec SPF 30. Le contour des yeux est important : quelques tapotements légers suffisent. Une touche de blush et un gloss naturel, et je suis prête ! Cette routine ne prend que 10 minutes mais fait toute la différence pour commencer la journée du bon pied.",
        categorie_id: beaute.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        likes: 8
      },
      {
        titre: "Les bienfaits du maquillage naturel",
        contenu: "Le maquillage naturel met en valeur votre beauté sans la masquer. L'objectif est de sublimer vos traits plutôt que de les transformer. Utilisez une BB crème légère au lieu d'un fond de teint couvrant, un mascara pour ouvrir le regard, et une touche de couleur sur les lèvres. Ce type de maquillage convient à toutes les occasions et laisse respirer votre peau. De plus, il est rapide à appliquer et facile à entretenir tout au long de la journée.",
        categorie_id: beaute.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        likes: 15
      },
      {
        titre: "L'importance d'une alimentation équilibrée",
        contenu: "Notre corps est ce que nous mangeons. Une alimentation équilibrée fournit tous les nutriments essentiels : protéines pour les muscles, glucides pour l'énergie, lipides pour les hormones, vitamines et minéraux pour le bon fonctionnement de l'organisme. Privilégiez les aliments frais et de saison, limitez les produits transformés et écoutez les signaux de votre corps. N'oubliez pas de boire suffisamment d'eau ! Une assiette colorée est souvent le signe d'un repas nutritif et varié.",
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        likes: 20
      },
      {
        titre: "Mes smoothies préférés pour l'énergie",
        contenu: "Les smoothies sont parfaits pour un boost d'énergie naturel ! Mon préféré : banane, épinards frais, lait d'amande, beurre de cacahuète et une touche de miel. Ce mélange vous apporte des glucides, des protéines, des fibres et des vitamines. Pour une version plus fruitée, essayez mangue, orange, gingembre frais et graines de chia. Préparez-les le matin ou emportez-les au travail dans une gourde isotherme. C'est délicieux, rapide et tellement meilleur que les en-cas industriels !",
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        likes: 18
      },
      {
        titre: "Comment organiser ses repas de la semaine",
        contenu: "La planification des repas change la vie ! Chaque dimanche, je prends 30 minutes pour établir mon menu de la semaine. Je fais une liste de courses en fonction et je prépare quelques bases : céréales cuites, légumes découpés, sauces maison. Le batch cooking permet de gagner un temps précieux en semaine. J'alterne les sources de protéines (viande, poisson, légumineuses) et je m'assure d'avoir toujours des légumes variés. Cette organisation réduit le stress, limite le gaspillage et favorise une alimentation plus saine.",
        categorie_id: nutrition.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        likes: 25
      },
      {
        titre: "La confiance en soi : un travail quotidien",
        contenu: "La confiance en soi ne se construit pas du jour au lendemain. C'est un processus qui demande de la patience et de la bienveillance envers soi-même. Célébrez vos petites victoires, acceptez vos imperfections et sortez régulièrement de votre zone de confort. Entourez-vous de personnes positives qui vous tirent vers le haut. Pratiquez l'auto-compassion : parlez-vous comme vous parleriez à votre meilleur ami. Rappelez-vous que personne n'est parfait et que vos différences font votre force.",
        categorie_id: devPerso.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        likes: 22
      },
      {
        titre: "Mes rituels matinaux pour bien commencer la journée",
        contenu: "Un bon matin conditionne toute la journée. Je me réveille 30 minutes plus tôt pour éviter de me précipiter. Je commence par 10 minutes de méditation ou d'étirements doux. Ensuite, un petit-déjeuner équilibré sans écrans. Je note mes trois priorités du jour dans mon journal. Cette routine me permet d'être plus calme, concentrée et productive. Les matins où je la saute, je sens vraiment la différence ! Trouvez ce qui vous convient et tenez-vous-y au moins 21 jours pour que ça devienne une habitude.",
        categorie_id: devPerso.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        likes: 16
      },
      {
        titre: "L'art de dire non sans culpabiliser",
        contenu: "Dire non est essentiel pour préserver son énergie et ses priorités. Ce n'est pas de l'égoïsme, c'est du respect de soi. Avant d'accepter une demande, demandez-vous : est-ce aligné avec mes valeurs et mes objectifs ? Ai-je vraiment le temps et l'envie ? Vous pouvez refuser avec bienveillance : 'Merci de penser à moi, mais je ne pourrai pas cette fois'. Pas besoin de se justifier longuement. Les personnes qui vous respectent comprendront. Dire non aux autres, c'est dire oui à soi-même.",
        categorie_id: devPerso.id,
        auteur_id: admin.id,
        date_publication: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        likes: 30
      }
    ];

    const createdArticles = await Article.bulkCreate(articles);
    console.log("✅ Articles créés");

    // 4. Créer des commentaires
    await Commentaire.create({
      article_id: createdArticles[0].id,
      user_id: visitor1.id,
      nom: visitor1.nom_prenom,
      contenu: "Merci pour ces conseils ! J'ai commencé à suivre cette routine et je vois déjà une différence.",
      statut: "approved",
      is_spam: false,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    await Commentaire.create({
      article_id: createdArticles[0].id,
      user_id: visitor2.id,
      nom: visitor2.nom_prenom,
      contenu: "Très intéressant ! Quelle crème hydratante recommandez-vous pour les peaux sensibles ?",
      statut: "approved",
      is_spam: false,
      date: new Date(Date.now() - 12 * 60 * 60 * 1000)
    });

    await Commentaire.create({
      article_id: createdArticles[3].id,
      user_id: null,
      nom: "Julie L.",
      contenu: "Article très complet, merci !",
      statut: "pending",
      is_spam: false,
      date: new Date()
    });

    console.log("✅ Commentaires créés");

    // 5. Créer des abonnés newsletter
    await NewsletterSubscriber.create({
      email: visitor1.email,
      user_id: visitor1.id
    });

    await NewsletterSubscriber.create({
      email: "jean.durand@example.com",
      user_id: null
    });

    console.log("✅ Abonnés newsletter créés");

    console.log("\n🎉 Seeding terminé avec succès !");
    console.log("\n📝 Credentials admin:");
    console.log("   Email: admin@miamor.com");
    console.log("   Password: Admin123!");
    console.log("\n📝 Credentials visiteur:");
    console.log("   Email: marie.dupont@example.com");
    console.log("   Password: Visiteur123!");

  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
