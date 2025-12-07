import Article from "../models/Article.model.js";
import User from "../models/User.model.js";
import Categorie from "../models/Categorie.model.js";

const getHomePage = async (req,res) => {
    try {
        const recentArticles = await Article.findAll({
            include: [
                { model: User, as: "auteur" },
                { model: Categorie, as: "categorie" }
            ],
            order: [["date_publication", "DESC"]],
            limit: 3
        });

        const recentPosts = recentArticles.map(a => ({
            id: a.id,
            titre: a.titre,
            extrait: (a.contenu || "").substring(0, 120),
            date_publication: a.date_publication,
            image: a.image,
            categorie: a.categorie ? a.categorie.nom : null,
            auteur: a.auteur ? a.auteur.nom_prenom : "Inconnu"
        }));

        // Récupère le dernier article pour la section hero
        const latestArticle = recentArticles.length > 0 ? recentArticles[0] : null;
        const featuredArticle = latestArticle ? {
            id: latestArticle.id,
            titre: latestArticle.titre,
            extrait: (latestArticle.contenu || "").substring(0, 200),
            date_publication: latestArticle.date_publication,
            image: latestArticle.image,
            categorie: latestArticle.categorie ? latestArticle.categorie.nom : null,
            auteur: latestArticle.auteur ? latestArticle.auteur.nom_prenom : "Inconnu"
        } : null;

        res.render("index", {
            title: "Accueil",
            message:"Bienvenue sur le site de Mi Amor",
            user: req.user,
            recentPosts,
            featuredArticle
        });
    } catch (error) {
        console.error("Erreur getHomePage:", error);
        res.render("index", {
            title: "Accueil",
            message:"Bienvenue sur le site de Mi Amor",
            user: req.user,
            recentPosts: [],
            featuredArticle: null
        });
    }
}
    
export default { getHomePage};