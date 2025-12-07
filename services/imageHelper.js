import path from 'path';

/**
 * Helper pour optimiser les balises img avec lazy-loading et srcset
 * Gère les alt text, placeholder, et versioning des images
 */

/**
 * Génère un attribut srcset pour responsive images
 * @param {string} basename - Nom de base du fichier (sans extension)
 * @param {string} preset - Type de preset (article, thumbnail, avatar)
 * @returns {string} Attribut srcset
 */
export function generateSrcSet(basename, preset = 'article') {
  const srcsets = {
    article: `
      /uploads/${basename}_sm.webp 300w,
      /uploads/${basename}_md.webp 600w,
      /uploads/${basename}_lg.webp 1200w
    `.trim(),
    thumbnail: `/uploads/${basename}_sm.webp`,
    avatar: `
      /uploads/${basename}_sm.webp 150w,
      /uploads/${basename}_xs.webp 50w
    `.trim()
  };

  return srcsets[preset] || srcsets.article;
}

/**
 * Génère l'attribut sizes pour responsive images
 * @param {string} preset - Type de preset
 * @returns {string} Attribut sizes
 */
export function generateSizes(preset = 'article') {
  const sizes = {
    article: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 100vw',
    thumbnail: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    avatar: '(max-width: 768px) 60px, 80px'
  };

  return sizes[preset] || sizes.article;
}

/**
 * Génère un placeholder blurred en base64
 * Utile pour le LQIP (Low Quality Image Placeholder)
 * @returns {string} Data URL du placeholder
 */
export function getBlurredPlaceholder() {
  // Petit PNG blurred gris 1x1 pixel en base64
  // C'est plus petit et plus rapide que de générer une image
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"%3E%3Crect fill="%23f0f0f0" width="1200" height="630"/%3E%3C/svg%3E';
}

/**
 * Génère une balise img optimisée avec lazy-loading
 * @param {Object} options - Options
 * @param {string} options.src - Source de l'image (version par défaut)
 * @param {string} options.alt - Texte alternatif (requis pour SEO)
 * @param {string} options.basename - Nom de base pour srcset
 * @param {string} options.preset - Type de preset
 * @param {string} options.title - Titre de l'image (optionnel)
 * @param {string} options.className - Classes CSS (optionnel)
 * @param {boolean} options.eager - Charger immédiatement (optionnel)
 * @returns {string} Balise img HTML optimisée
 */
export function generateLazyImage(options) {
  const {
    src,
    alt,
    basename,
    preset = 'article',
    title = '',
    className = 'img-fluid',
    eager = false,
    width,
    height
  } = options;

  // Valider que alt est fourni (important pour SEO et a11y)
  if (!alt || alt.trim() === '') {
    console.warn('⚠️  Attention: alt text manquant pour:', src);
  }

  const srcset = basename ? generateSrcSet(basename, preset) : '';
  const sizes = basename ? generateSizes(preset) : '';
  const loading = eager ? 'eager' : 'lazy';
  const blurredPlaceholder = getBlurredPlaceholder();

  let imgTag = `<img 
    src="${src}"
    alt="${alt}"
    loading="${loading}"
    class="${className}"
  `;

  if (srcset) {
    imgTag += `\n    srcset="${srcset}"`;
  }

  if (sizes) {
    imgTag += `\n    sizes="${sizes}"`;
  }

  if (title) {
    imgTag += `\n    title="${title}"`;
  }

  if (width) {
    imgTag += `\n    width="${width}"`;
  }

  if (height) {
    imgTag += `\n    height="${height}"`;
  }

  // Ajouter le placeholder blurred pour progressive loading
  imgTag += `\n    style="background-image: url('${blurredPlaceholder}'); background-size: cover; background-position: center;"`;
  imgTag += '\n  />';

  return imgTag;
}

/**
 * Génère une balise picture avec fallback pour anciens navigateurs
 * @param {Object} options - Options
 * @param {string} options.src - Source JPEG fallback
 * @param {string} options.srcWebp - Source WebP
 * @param {string} options.alt - Texte alternatif
 * @param {string} options.basename - Nom de base
 * @param {string} options.preset - Type de preset
 * @param {string} options.className - Classes CSS
 * @param {boolean} options.eager - Charger immédiatement
 * @returns {string} Balise picture HTML
 */
export function generatePictureTag(options) {
  const {
    src,
    srcWebp,
    alt,
    basename,
    preset = 'article',
    className = 'img-fluid',
    eager = false,
    title = '',
    width,
    height
  } = options;

  if (!alt || alt.trim() === '') {
    console.warn('⚠️  Attention: alt text manquant pour picture tag');
  }

  const srcset = basename ? generateSrcSet(basename, preset) : '';
  const sizes = basename ? generateSizes(preset) : '';
  const loading = eager ? 'eager' : 'lazy';
  const blurredPlaceholder = getBlurredPlaceholder();

  let pictureTag = '<picture>\n';
  
  // Source WebP
  if (srcWebp) {
    pictureTag += `  <source srcset="${srcWebp}"${srcset ? ` srcset="${srcset}"` : ''} type="image/webp"${sizes ? ` sizes="${sizes}"` : ''}>\n`;
  }
  
  // Source JPEG fallback
  pictureTag += `  <source srcset="${src}" type="image/jpeg"${sizes ? ` sizes="${sizes}"` : ''}>\n`;
  
  // Fallback img
  pictureTag += `  <img 
    src="${src}"
    alt="${alt}"
    loading="${loading}"
    class="${className}"`;

  if (title) {
    pictureTag += `\n    title="${title}"`;
  }

  if (width) {
    pictureTag += `\n    width="${width}"`;
  }

  if (height) {
    pictureTag += `\n    height="${height}"`;
  }

  pictureTag += `\n    style="background-image: url('${blurredPlaceholder}'); background-size: cover; background-position: center;"`;
  pictureTag += '\n  />\n</picture>';

  return pictureTag;
}

/**
 * Génère un alt text descriptif pour une image
 * Basé sur le titre et le contexte
 * @param {string} articleTitle - Titre de l'article
 * @param {string} customAlt - Alt text personnalisé (optionnel)
 * @param {string} context - Contexte (article, thumbnail, hero)
 * @returns {string} Alt text optimisé
 */
export function generateAltText(articleTitle, customAlt = '', context = 'article') {
  if (customAlt && customAlt.trim() !== '') {
    return customAlt;
  }

  // Générer un alt text descriptif
  const contextPrefix = {
    article: 'Image illustrant',
    thumbnail: 'Vignette de',
    hero: 'Image bannière pour',
    featured: 'Image principale de'
  };

  const prefix = contextPrefix[context] || contextPrefix.article;
  return `${prefix} "${articleTitle}"`;
}

/**
 * Extrait le basename d'une URL d'image
 * @param {string} imageUrl - URL complète de l'image
 * @returns {string} Basename (sans extension)
 */
export function extractBasename(imageUrl) {
  if (!imageUrl) return '';
  
  const filename = imageUrl.split('/').pop();
  // Enlever le suffixe de taille (_sm, _md, _lg, _xs)
  return filename.replace(/_[a-z]{2}\.webp$/, '').replace(/\.[^/.]+$/, '');
}

/**
 * Valide un alt text
 * @param {string} alt - Alt text à valider
 * @returns {Object} { isValid, errors, warnings }
 */
export function validateAltText(alt) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!alt || alt.trim() === '') {
    result.isValid = false;
    result.errors.push('Alt text vide ou manquant');
  }

  if (alt && alt.length < 10) {
    result.warnings.push('Alt text court - considérez une description plus détaillée');
  }

  if (alt && alt.length > 125) {
    result.warnings.push('Alt text trop long - idéalement < 125 caractères');
  }

  if (alt && /image|photo|picture/i.test(alt)) {
    result.warnings.push('Évitez de répéter "image" ou "photo" dans l\'alt text');
  }

  return result;
}

/**
 * Génère les meta tags OpenGraph pour une image
 * @param {Object} options - Options
 * @param {string} options.imageUrl - URL de l'image
 * @param {string} options.imageAlt - Alt text de l'image
 * @param {string} options.width - Largeur (optionnel)
 * @param {string} options.height - Hauteur (optionnel)
 * @returns {string} Meta tags HTML
 */
export function generateOpenGraphImage(options) {
  const { imageUrl, imageAlt, width, height } = options;

  let tags = `<meta property="og:image" content="${imageUrl}">\n`;
  
  if (imageAlt) {
    tags += `<meta property="og:image:alt" content="${imageAlt}">\n`;
  }

  if (width) {
    tags += `<meta property="og:image:width" content="${width}">\n`;
  }

  if (height) {
    tags += `<meta property="og:image:height" content="${height}">\n`;
  }

  // Type d'image
  if (imageUrl.includes('.webp')) {
    tags += `<meta property="og:image:type" content="image/webp">`;
  } else if (imageUrl.includes('.png')) {
    tags += `<meta property="og:image:type" content="image/png">`;
  } else {
    tags += `<meta property="og:image:type" content="image/jpeg">`;
  }

  return tags;
}

/**
 * Crée un objet image optimisé pour les templates
 * @param {Object} article - Objet article
 * @returns {Object} Image optimisée avec toutes les infos
 */
export function createOptimizedImage(article) {
  if (!article.image) {
    return null;
  }

  const basename = extractBasename(article.image);
  const altText = generateAltText(article.titre, article.image_alt_text, 'article');
  const imageUrl = article.image.includes('http') ? article.image : `${article.image}`;

  return {
    url: imageUrl,
    basename: basename,
    alt: altText,
    title: article.titre,
    srcset: generateSrcSet(basename),
    sizes: generateSizes(),
    placeholder: getBlurredPlaceholder(),
    // Helpers pour les templates
    lazyImg: generateLazyImage({
      src: imageUrl,
      alt: altText,
      basename: basename,
      title: article.titre
    }),
    pictureTag: generatePictureTag({
      src: imageUrl,
      srcWebp: imageUrl,
      alt: altText,
      basename: basename,
      title: article.titre
    })
  };
}
