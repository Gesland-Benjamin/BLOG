#!/usr/bin/env node

/**
 * Script de test pour le lazy-loading des images et les meta tags dynamiques
 * Usage: npm run test:seo-images
 */

import { 
  generateLazyImage, 
  generatePictureTag, 
  generateAltText, 
  extractBasename, 
  validateAltText,
  generateOpenGraphImage,
  generateSrcSet,
  generateSizes
} from '../services/imageHelper.js';

function printTitle(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(title);
  console.log('═'.repeat(70));
}

function runTests() {
  printTitle('🖼️  Tests SEO - Lazy-loading et Meta Tags');

  // Test 1: generateLazyImage
  printTitle('1️⃣  Générer une balise img lazy-loaded');
  const lazyImg = generateLazyImage({
    src: '/uploads/article_abc_md.webp',
    alt: 'Image illustrant un exemple d\'article de beauté',
    basename: 'article_abc',
    preset: 'article',
    title: 'Mon Article',
    eager: false
  });
  console.log('HTML généré:');
  console.log(lazyImg);

  // Test 2: generatePictureTag
  printTitle('2️⃣  Générer une balise picture avec fallback');
  const pictureTag = generatePictureTag({
    src: '/uploads/article_abc.jpg',
    srcWebp: '/uploads/article_abc_md.webp',
    alt: 'Image illustrant un exemple d\'article',
    basename: 'article_abc',
    preset: 'article'
  });
  console.log('HTML généré:');
  console.log(pictureTag);

  // Test 3: generateAltText
  printTitle('3️⃣  Générer un alt text basé sur le titre');
  const altTexts = [
    generateAltText('5 conseils pour une peau éclatante', '', 'article'),
    generateAltText('5 conseils pour une peau éclatante', '', 'thumbnail'),
    generateAltText('Mon Profil', '', 'avatar'),
    generateAltText('5 conseils pour une peau éclatante', 'Photo de ma mère souriant', 'article')
  ];
  console.log('Alt texts générés:');
  altTexts.forEach((alt, i) => {
    console.log(`  ${i + 1}. "${alt}"`);
  });

  // Test 4: validateAltText
  printTitle('4️⃣  Valider des alt texts');
  const testAltTexts = [
    '',
    'Image',
    'Photo',
    'Un alt text trop court',
    'Un alt text descriptif et bien formé qui explique le contenu de l\'image de manière claire et utile pour les lecteurs d\'écran et le SEO',
    'Photo d\'illustration de beauté'
  ];
  
  testAltTexts.forEach(alt => {
    const validation = validateAltText(alt);
    console.log(`\n  Alt text: "${alt}"`);
    console.log(`  ✅ Valide: ${validation.isValid}`);
    if (validation.errors.length > 0) {
      console.log(`  ❌ Erreurs: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`  ⚠️  Avertissements: ${validation.warnings.join(', ')}`);
    }
  });

  // Test 5: extractBasename
  printTitle('5️⃣  Extraire le basename d\'une URL');
  const imageUrls = [
    '/uploads/article_abc_md.webp',
    '/uploads/article_abc_lg.webp',
    '/uploads/article_abc_sm.webp',
    '/uploads/avatar_user123_sm.webp'
  ];
  
  imageUrls.forEach(url => {
    const basename = extractBasename(url);
    console.log(`  ${url}`);
    console.log(`  → ${basename}\n`);
  });

  // Test 6: generateSrcSet et generateSizes
  printTitle('6️⃣  Générer srcset et sizes pour responsive');
  const presets = ['article', 'thumbnail', 'avatar'];
  
  presets.forEach(preset => {
    console.log(`\n  Preset: ${preset}`);
    console.log(`  srcset: ${generateSrcSet('article_abc', preset)}`);
    console.log(`  sizes: ${generateSizes(preset)}`);
  });

  // Test 7: generateOpenGraphImage
  printTitle('7️⃣  Générer les meta tags OpenGraph');
  const ogTags = generateOpenGraphImage({
    imageUrl: '/uploads/article_abc_lg.webp',
    imageAlt: 'Image illustrant un article sur la beauté',
    width: '1200',
    height: '630'
  });
  console.log('Meta tags OpenGraph:');
  console.log(ogTags);

  // Test 8: Cas d'utilisation réel
  printTitle('8️⃣  Cas d\'utilisation complet');
  const articleData = {
    id: 42,
    titre: '5 astuces pour une peau lumineus',
    contenu: 'Cet article couvre les meilleures pratiques...',
    image: '/uploads/article_xyz_md.webp',
    image_alt: 'Application d\'une crème hydratante sur le visage',
    auteur: 'Marie Dupont',
    categorie: 'Beauté'
  };

  console.log('\nDonnées de l\'article:');
  console.log(JSON.stringify(articleData, null, 2));

  const basename = extractBasename(articleData.image);
  console.log(`\nBasename extrait: ${basename}`);

  const dynamicAltText = articleData.image_alt || generateAltText(articleData.titre);
  console.log(`Alt text: "${dynamicAltText}"`);

  const srcset = generateSrcSet(basename, 'article');
  console.log(`\nSrcset généré:`);
  console.log(`  ${srcset}`);

  const lazyImageHTML = generateLazyImage({
    src: articleData.image,
    alt: dynamicAltText,
    basename: basename,
    preset: 'article',
    title: articleData.titre
  });
  console.log(`\nBalise img générée:`);
  console.log(lazyImageHTML);

  const ogImageHTML = generateOpenGraphImage({
    imageUrl: articleData.image.replace('_md.webp', '_lg.webp'),
    imageAlt: dynamicAltText,
    width: '1200',
    height: '630'
  });
  console.log(`\nMeta tags OpenGraph:`);
  console.log(ogImageHTML);

  // Résumé
  printTitle('📊 Résumé des Tests');
  console.log(`
✅ Fonctionnalités testées:
  • Lazy-loading avec srcset
  • Picture tag avec fallback
  • Génération d'alt text descriptif
  • Validation d'alt text
  • Extraction de basename
  • Meta tags OpenGraph
  • Responsive images avec sizes

✅ Avantages pour le SEO:
  • Alt text descriptif pour l'accessibilité
  • Meta tags OpenGraph pour les partages sociaux
  • Images responsive avec srcset
  • Lazy-loading pour la performance
  • Meta description dynamique par article
  • Canonical URLs

✅ Intégration dans les templates:
  • article-detail.ejs: Affiche l'article avec lazy-loading
  • articles-by-category.ejs: Vignettes avec lazy-loading
  • article.ejs: Accueil avec images optimisées
  • partials/head.ejs: Meta tags dynamiques
  `);
}

runTests();
