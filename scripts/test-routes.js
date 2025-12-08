import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const tests = [
  // Routes publiques
  { method: 'GET', url: '/', name: 'Page d\'accueil' },
  { method: 'GET', url: '/article', name: 'Liste des articles' },
  { method: 'GET', url: '/search', name: 'Recherche' },
  { method: 'GET', url: '/sitemap.xml', name: 'Sitemap' },
  { method: 'GET', url: '/rss.xml', name: 'RSS Feed' },
  { method: 'GET', url: '/health', name: 'Health check' },
  
  // Routes auth (sans authentification)
  { method: 'GET', url: '/auth/login', name: 'Page de connexion' },
  { method: 'GET', url: '/register', name: 'Page d\'inscription' },
  
  // Routes newsletter
  { method: 'GET', url: '/newsletter', name: 'Page newsletter' },
  
  // Routes admin (devraient rediriger vers auth)
  { method: 'GET', url: '/admin/dashboard', name: 'Dashboard admin (redirection)' },
  { method: 'GET', url: '/admin/articles/new', name: 'Nouvel article (redirection)' },
];

async function testRoute(test) {
  try {
    const response = await fetch(`${BASE_URL}${test.url}`, {
      method: test.method,
      redirect: 'manual' // Ne pas suivre les redirections
    });
    
    const status = response.status;
    const isOk = status < 400 || status === 302; // 302 = redirection OK
    
    console.log(
      `${isOk ? '✅' : '❌'} [${status}] ${test.method} ${test.url} - ${test.name}`
    );
    
    return isOk;
  } catch (error) {
    console.log(`❌ [ERR] ${test.method} ${test.url} - ${test.name}`);
    console.log(`   Erreur: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🔍 Test des routes du site...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testRoute(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // Petit délai entre les tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log('='.repeat(50) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
