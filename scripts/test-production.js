#!/usr/bin/env node
/**
 * Script de test de configuration production
 * Vérifie tous les éléments de la configuration avant le déploiement
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const tests = [];
let passed = 0;
let failed = 0;

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
};

/**
 * Test helper
 */
async function test(name, fn) {
  try {
    await fn();
    log.success(name);
    passed++;
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    failed++;
  }
}

/**
 * Tests
 */
async function runTests() {
  console.log(`\n${colors.blue}🔍 Tests de Configuration Production${colors.reset}\n`);

  // 1. Vérifier .env
  await test('Fichier .env.production existe', async () => {
    if (!fs.existsSync('.env.production')) {
      throw new Error('.env.production non trouvé');
    }
  });

  await test('Variables env obligatoires sont définies', async () => {
    const env = fs.readFileSync('.env.production', 'utf8');
    const required = [
      'NODE_ENV=production',
      'PORT=',
      'APP_URL=',
      'DB_NAME=',
      'DB_USER=',
      'SESSION_SECRET=',
      'EMAIL_HOST=',
    ];
    
    for (const variable of required) {
      if (!env.includes(variable)) {
        throw new Error(`${variable} manquante`);
      }
    }
  });

  // 2. Vérifier PM2
  await test('PM2 est installé', async () => {
    execSync('pm2 --version', { stdio: 'pipe' });
  });

  await test('ecosystem.config.js existe', async () => {
    if (!fs.existsSync('ecosystem.config.js')) {
      throw new Error('ecosystem.config.js non trouvé');
    }
  });

  // 3. Vérifier la config de sécurité
  await test('middleware/security.js existe', async () => {
    if (!fs.existsSync('middleware/security.js')) {
      throw new Error('middleware/security.js non trouvé');
    }
  });

  await test('config/production.js existe', async () => {
    if (!fs.existsSync('config/production.js')) {
      throw new Error('config/production.js non trouvé');
    }
  });

  // 4. Vérifier les scripts
  await test('scripts/deploy.js existe', async () => {
    if (!fs.existsSync('scripts/deploy.js')) {
      throw new Error('scripts/deploy.js non trouvé');
    }
  });

  await test('scripts/ssl-setup.js existe', async () => {
    if (!fs.existsSync('scripts/ssl-setup.js')) {
      throw new Error('scripts/ssl-setup.js non trouvé');
    }
  });

  await test('scripts/monitor.js existe', async () => {
    if (!fs.existsSync('scripts/monitor.js')) {
      throw new Error('scripts/monitor.js non trouvé');
    }
  });

  // 5. Vérifier les dépendances
  const requiredDeps = ['pm2', 'helmet', 'compression', 'express-rate-limit', 'cors'];
  
  await test('Toutes les dépendances sont installées', async () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (!deps[dep]) {
        throw new Error(`${dep} non trouvé dans package.json`);
      }
    }
  });

  // 6. Vérifier les scripts npm
  await test('Scripts npm pour PM2 sont configurés', async () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts;
    const requiredScripts = [
      'pm2:dev',
      'pm2:staging',
      'pm2:production',
      'pm2:restart',
      'pm2:reload',
      'pm2:status',
      'pm2:logs',
    ];
    
    for (const script of requiredScripts) {
      if (!scripts[script]) {
        throw new Error(`Script npm '${script}' non trouvé`);
      }
    }
  });

  // 7. Vérifier la documentation
  await test('docs/production-deployment.md existe', async () => {
    if (!fs.existsSync('docs/production-deployment.md')) {
      throw new Error('docs/production-deployment.md non trouvé');
    }
  });

  await test('docs/nginx-production-config.md existe', async () => {
    if (!fs.existsSync('docs/nginx-production-config.md')) {
      throw new Error('docs/nginx-production-config.md non trouvé');
    }
  });

  // 8. Vérifier les migrations
  await test('Migrations existent', async () => {
    const migrationsDir = 'migrations';
    if (!fs.existsSync(migrationsDir)) {
      throw new Error('Dossier migrations non trouvé');
    }
    
    const files = fs.readdirSync(migrationsDir);
    if (files.length === 0) {
      throw new Error('Aucune migration trouvée');
    }
  });

  // 9. Vérifier les logs
  await test('Répertoire logs existe ou peut être créé', async () => {
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });

  // 10. Tester la connexion HTTP si le serveur est running
  await test('Endpoint /health est accessible (si serveur running)', async () => {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error('Health check failed');
      }
    } catch (error) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Serveur non accessible (pas en cours d\'exécution)');
      }
      throw error;
    }
  });

  // 11. Vérifier la config Nginx (si on l'installe)
  await test('Configuration Nginx documentée', async () => {
    const nginxConfig = fs.readFileSync('docs/nginx-production-config.md', 'utf8');
    if (!nginxConfig.includes('upstream')) {
      throw new Error('Configuration Nginx incomplète');
    }
  });

  // 12. Vérifier les secrets
  await test('Secrets sensibles ne sont pas en clair', async () => {
    const files = ['.env.production'];
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        // Vérifier que les secrets n'ont pas de valeurs de test
        if (content.includes('yourdomain.com') === false && 
            content.includes('your_') === false) {
          throw new Error(`${file} contient potentiellement des secrets réels`);
        }
      }
    }
  });

  // Résumé
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✓ Tests réussis: ${passed}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}✗ Tests échoués: ${failed}${colors.reset}`);
  }
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  // Recommandations
  console.log(`${colors.blue}📋 Checklist de déploiement:${colors.reset}`);
  console.log(`
  - [ ] Éditer .env.production avec vos vraies valeurs
  - [ ] Vérifier la connexion à la base de données
  - [ ] Configurer CORS_ORIGINS
  - [ ] Générer ou obtenir les certificats SSL
  - [ ] Configurer le reverse proxy Nginx
  - [ ] Vérifier les emails SMTP
  - [ ] Tester en staging avant production
  - [ ] Configurer les backups de base de données
  - [ ] Mettre en place le monitoring
  - [ ] Configurer les alertes
  `);

  return failed === 0;
}

// Exécuter les tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(colors.red, error, colors.reset);
    process.exit(1);
  });
