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

        // Récupère les 2 derniers articles des catégories Événements et Nouveautés (IDs fixes 18, 19) pour le carrousel
        const fetchByCatId = async (catId) => {
            const rows = await Article.findAll({
                where: { categorie_id: catId },
                include: [
                    { model: User, as: "auteur" },
                    { model: Categorie, as: "categorie" }
                ],
                order: [["date_publication", "DESC"]],
                limit: 2
            });
            return rows.map(a => ({
                id: a.id,
                titre: a.titre,
                extrait: (a.contenu || "").substring(0, 160),
                date_publication: a.date_publication,
                image: a.image,
                categorie: a.categorie ? a.categorie.nom : null,
                auteur: a.auteur ? a.auteur.nom_prenom : "Inconnu"
            }));
        };

        // Carrousel mix Événements (18) + Nouveautés (19)
        const eventsLatest = await fetchByCatId(18);
        const nouveautesLatest = await fetchByCatId(19);
        const mixedCarouselItems = [...eventsLatest, ...nouveautesLatest]
            .sort((a, b) => new Date(b.date_publication) - new Date(a.date_publication));

        // Sections dynamiques à gauche: top liké par catégorie
        const categories = await Categorie.findAll();
        const topLikedSectionsRaw = await Promise.all(categories.map(async (c) => {
            const a = await Article.findOne({
                where: { categorie_id: c.id },
                include: [
                    { model: User, as: "auteur" },
                    { model: Categorie, as: "categorie" }
                ],
                order: [["likes", "DESC"], ["date_publication", "DESC"]]
            });
            if (!a) return null;
            return {
                id: a.id,
                titre: a.titre,
                extrait: (a.contenu || "").substring(0, 160),
                date_publication: a.date_publication,
                image: a.image,
                categorie: a.categorie ? a.categorie.nom : c.nom,
                auteur: a.auteur ? a.auteur.nom_prenom : "Inconnu",
                likes: a.likes
            };
        }));
        const topLikedSections = topLikedSectionsRaw.filter(Boolean);

        res.render("index", {
            title: "Accueil",
            message:"Bienvenue sur le site de Mi Amor",
            user: req.user,
            recentPosts,
            featuredArticle,
            carouselItems: mixedCarouselItems,
            article: undefined,
            topLikedSections
        });
    } catch (error) {
        console.error("Erreur getHomePage:", error);
        res.render("index", {
            title: "Accueil",
            message:"Bienvenue sur le site de Mi Amor",
            user: req.user,
            recentPosts: [],
            featuredArticle: null,
            carouselItems: [],
            article: undefined,
            topLikedSections: []
        });
    }
};

const renderRenseignementsPage = (req, res, options = {}) => {
    res.render("renseignements", {
        title: "Demande de renseignements",
        pageDescription: "Contactez Mi Amor pour toute demande de renseignements, de devis ou de collaboration.",
        user: req.user,
        article: undefined,
        errors: [],
        formData: { nom: "", email: "", telephone: "", sujet: "", message: "" },
        message: res.locals.message,
        ...options
    });
};

const getRenseignementsPage = (req, res) => {
    renderRenseignementsPage(req, res);
};

const postRenseignements = (req, res) => {
    const {
        nom = "",
        email = "",
        telephone = "",
        sujet = "",
        message: contenuMessage = ""
    } = req.body || {};

    const formData = {
        nom: String(nom).trim(),
        email: String(email).trim(),
        telephone: String(telephone).trim(),
        sujet: String(sujet).trim(),
        message: String(contenuMessage).trim(),
    };

    const errors = [];

    if (!formData.nom) {
        errors.push("Le nom est obligatoire.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push("Une adresse email valide est requise.");
    }

    if (!formData.sujet) {
        errors.push("Merci de préciser l'objet de votre demande.");
    }

    if (!formData.message) {
        errors.push("Le message ne peut pas être vide.");
    }

    if (formData.message.length > 1200) {
        errors.push("Le message doit contenir moins de 1200 caractères.");
    }

    if (errors.length > 0) {
        return renderRenseignementsPage(req, res, { errors, formData, message: null });
    }

    req.session.message = "Merci pour votre demande, nous reviendrons vers vous rapidement.";
    return res.redirect("/renseignements");
};
    
export default { getHomePage, getRenseignementsPage, postRenseignements};