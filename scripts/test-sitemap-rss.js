// This file has been moved to .trash/scripts/
#!/usr/bin/env node

/**
 * Script de test pour sitemap.xml et flux RSS
 * Usage: npm run test:sitemap-rss
 */

const baseUrl = 'http://localhost:3000';

async function testSitemap() {
  console.log('\n' + '═'.repeat(70));
  console.log('🗺️  Test du Sitemap XML');
  console.log('═'.repeat(70) + '\n');

  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`);
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}`);
      return;
    }

    const contentType = response.headers.get('content-type');
    console.log(`📋 Content-Type: ${contentType}`);

    const xml = await response.text();
    console.log(`📊 Taille du sitemap: ${(xml.length / 1024).toFixed(2)} KB\n`);

    // Afficher un extrait
    console.log('📝 Aperçu du sitemap:\n');
    const lines = xml.split('\n').slice(0, 20);
    lines.forEach((line, i) => {
      console.log(`  ${line}`);
    });

    if (xml.split('\n').length > 20) {
      console.log(`  ...`);
      console.log(`  [${xml.split('\n').length} lignes au total]`);
    }

    // Compter les URLs
    const urlCount = (xml.match(/<url>/g) || []).length;
    console.log(`\n✅ Nombre d'URLs dans le sitemap: ${urlCount}`);

    // Valider la structure XML
    if (xml.includes('<?xml version="1.0"') && xml.includes('</urlset>')) {
      console.log('✅ Structure XML valide');
    } else {
      console.log('❌ Structure XML invalide');
    }

  } catch (error) {
    console.error(`❌ Erreur lors du test du sitemap:`, error.message);
  }
}

async function testRssFeed() {
  console.log('\n' + '═'.repeat(70));
  console.log('📡 Test du Flux RSS 2.0');
  console.log('═'.repeat(70) + '\n');

  try {
    const response = await fetch(`${baseUrl}/feed.rss`);
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}`);
      return;
    }

    const contentType = response.headers.get('content-type');
    console.log(`📋 Content-Type: ${contentType}`);

    const xml = await response.text();
    console.log(`📊 Taille du flux: ${(xml.length / 1024).toFixed(2)} KB\n`);

    // Afficher un extrait
    console.log('📝 Aperçu du flux RSS:\n');
    const lines = xml.split('\n').slice(0, 25);
    lines.forEach((line) => {
      console.log(`  ${line}`);
    });

    if (xml.split('\n').length > 25) {
      console.log(`  ...`);
      console.log(`  [${xml.split('\n').length} lignes au total]`);
    }

    // Compter les articles
    const itemCount = (xml.match(/<item>/g) || []).length;
    console.log(`\n✅ Nombre d'articles dans le flux: ${itemCount}`);

    // Valider la structure XML
    if (xml.includes('<?xml version="1.0"') && xml.includes('</rss>')) {
      console.log('✅ Structure XML valide');
    } else {
      console.log('❌ Structure XML invalide');
    }

  } catch (error) {
    console.error(`❌ Erreur lors du test du RSS:`, error.message);
  }
}

async function testAtomFeed() {
  console.log('\n' + '═'.repeat(70));
  console.log('📡 Test du Flux Atom 1.0');
  console.log('═'.repeat(70) + '\n');

  try {
    const response = await fetch(`${baseUrl}/feed.atom`);
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}`);
      return;
    }

    const contentType = response.headers.get('content-type');
    console.log(`📋 Content-Type: ${contentType}`);

    const xml = await response.text();
    console.log(`📊 Taille du flux: ${(xml.length / 1024).toFixed(2)} KB\n`);

    // Afficher un extrait
    console.log('📝 Aperçu du flux Atom:\n');
    const lines = xml.split('\n').slice(0, 25);
    lines.forEach((line) => {
      console.log(`  ${line}`);
    });

    if (xml.split('\n').length > 25) {
      console.log(`  ...`);
      console.log(`  [${xml.split('\n').length} lignes au total]`);
    }

    // Compter les articles
    const entryCount = (xml.match(/<entry>/g) || []).length;
    console.log(`\n✅ Nombre d'articles dans le flux: ${entryCount}`);

    // Valider la structure XML
    if (xml.includes('<?xml version="1.0"') && xml.includes('</feed>')) {
      console.log('✅ Structure XML valide');
    } else {
      console.log('❌ Structure XML invalide');
    }

  } catch (error) {
    console.error(`❌ Erreur lors du test du Atom:`, error.message);
  }
}

async function testRobotsTxt() {
  console.log('\n' + '═'.repeat(70));
  console.log('🤖 Test du fichier robots.txt');
  console.log('═'.repeat(70) + '\n');

  try {
    const response = await fetch(`${baseUrl}/robots.txt`);
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}`);
      return;
    }

    const content = await response.text();
    console.log(`📊 Taille du fichier: ${(content.length / 1024).toFixed(2)} KB\n`);

    console.log('📝 Contenu du robots.txt:\n');
    const lines = content.split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`  ${line}`);
      }
    });

    // Vérifier la présence du sitemap
    if (content.includes('Sitemap:')) {
      console.log(`\n✅ Sitemap déclaré dans robots.txt`);
    } else {
      console.log(`\n⚠️  Sitemap non déclaré dans robots.txt`);
    }

  } catch (error) {
    console.error(`❌ Erreur lors du test de robots.txt:`, error.message);
  }
}

async function runAllTests() {
  console.log('\n🧪 Tests Sitemap et Flux RSS/Atom');
  console.log('═'.repeat(70));

  // Vérifier que le serveur est en cours d'exécution
  try {
    const response = await fetch(baseUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`\n❌ Le serveur n'est pas accessible à ${baseUrl}`);
    console.error(`   Lancez: npm run dev\n`);
    process.exit(1);
  }

  await testSitemap();
  await testRssFeed();
  await testAtomFeed();
  await testRobotsTxt();

  console.log('\n' + '═'.repeat(70));
  console.log('📊 Résumé des Tests');
  console.log('═'.repeat(70));
  console.log(`
✅ Endpoints testés:
  • GET /sitemap.xml      (Sitemap XML pour SEO)
  • GET /feed.rss         (Flux RSS 2.0)
  • GET /feed.atom        (Flux Atom 1.0)
  • GET /robots.txt       (Configuration crawlers)

✅ URL disponibles:
  • http://localhost:3000/sitemap.xml
  • http://localhost:3000/feed.rss
  • http://localhost:3000/feed.xml (alias)
  • http://localhost:3000/feed.atom
  • http://localhost:3000/atom.xml (alias)
  • http://localhost:3000/robots.txt

✅ Utilité:
  • Sitemap: Aide Google à indexer les pages
  • RSS: Permet aux lecteurs de s'abonner aux articles
  • Atom: Format alternatif aux RSS
  • robots.txt: Guide pour les crawlers des moteurs de recherche

✅ Intégration SEO:
  • Ajouter dans Google Search Console
  • Soumettre le sitemap aux moteurs de recherche
  • Partager les flux avec les agrégateurs (Medium, Feedly, etc.)
  `);
}

runAllTests().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});
