import { validateAltText, generateAltText } from '../services/imageHelper.js';

/**
 * Middleware pour valider et enrichir les alt text des images
 * Avertit si un alt text est manquant ou trop court
 */
export function validateImageAlt(req, res, next) {
  // Récupérer l'image_alt du formulaire
  const { image_alt } = req.body;
  const { titre } = req.body;

  // Si une image est uploadée sans alt text, générer un par défaut
  if (req.processedImage && !image_alt) {
    // Générer un alt text basé sur le titre
    req.body.image_alt = generateAltText(titre || 'Article', '', 'article');
    console.log('Alt text généré automatiquement:', req.body.image_alt);
  }

  // Si un alt text est fourni, le valider
  if (image_alt) {
    const validation = validateAltText(image_alt);
    
    if (!validation.isValid) {
      console.warn('❌ Alt text invalide:', validation.errors);
      req.altTextErrors = validation.errors;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  Avertissements alt text:', validation.warnings);
      req.altTextWarnings = validation.warnings;
    }

    // Ajouter le résultat de la validation à la requête
    req.altTextValidation = validation;
  }

  next();
}

/**
 * Middleware pour logger les images sans alt text (utile pour l'audit SEO)
 */
export function logMissingAltText(req, res, next) {
  const originalRender = res.render.bind(res);

  res.render = function(view, options = {}) {
    // Vérifier dans les articles si le alt text est présent
    if (view === 'article-detail' && options.article) {
      const article = options.article;
      if (article.image && !article.image_alt) {
        console.warn(`⚠️  SEO: Article ${article.id} (${article.titre}) n'a pas de alt text`);
      }
    }

    if (view === 'article' && options.articlesParCategorie) {
      Object.values(options.articlesParCategorie).forEach(article => {
        if (article && article.image && !article.image_alt) {
          console.warn(`⚠️  SEO: Article ${article.id} (${article.titre}) n'a pas de alt text`);
        }
      });
    }

    return originalRender(view, options);
  };

  next();
}

/**
 * Middleware pour ajouter les images à un cache de validation
 * Utile pour un audit SEO
 */
export function auditImageAltTexts(req, res, next) {
  // Initialiser le cache si nécessaire
  if (!req.app.locals.imageSeoAudit) {
    req.app.locals.imageSeoAudit = {
      articlesWithImages: 0,
      articlesWithoutAlt: 0,
      articlesWithGoodAlt: 0
    };
  }

  const originalRender = res.render.bind(res);

  res.render = function(view, options = {}) {
    const audit = req.app.locals.imageSeoAudit;

    // Auditer les articles
    if (options.article) {
      const { article } = options;
      if (article.image) {
        audit.articlesWithImages++;
        if (!article.image_alt || article.image_alt.trim() === '') {
          audit.articlesWithoutAlt++;
        } else {
          const validation = validateAltText(article.image_alt);
          if (validation.isValid && validation.warnings.length === 0) {
            audit.articlesWithGoodAlt++;
          }
        }
      }
    }

    return originalRender(view, options);
  };

  next();
}

/**
 * Route pour afficher le statut SEO des images
 * GET /admin/seo/images
 */
export function createSeoAuditRoute(app) {
  app.get('/admin/seo/images', (req, res) => {
    const audit = req.app.locals.imageSeoAudit || {
      articlesWithImages: 0,
      articlesWithoutAlt: 0,
      articlesWithGoodAlt: 0
    };

    const totalAudited = audit.articlesWithImages;
    const coverage = totalAudited > 0 
      ? ((audit.articlesWithGoodAlt / totalAudited) * 100).toFixed(1)
      : 0;

    res.json({
      message: 'Audit SEO des images',
      audit: {
        total: totalAudited,
        withoutAlt: audit.articlesWithoutAlt,
        withGoodAlt: audit.articlesWithGoodAlt,
        coverage: `${coverage}%`
      }
    });
  });
}
