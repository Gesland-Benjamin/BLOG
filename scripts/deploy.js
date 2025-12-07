#!/usr/bin/env node
/**
 * Script de déploiement avec PM2
 * 
 * Usage:
 *   node scripts/deploy.js production
 *   node scripts/deploy.js staging
 *   node scripts/deploy.js development
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const environment = args[0] || 'development';

if (!['development', 'staging', 'production'].includes(environment)) {
  console.error('❌ Environnement invalide. Utilisez: development, staging, production');
  process.exit(1);
}

console.log(`\n🚀 Déploiement de l'application en environnement: ${environment.toUpperCase()}\n`);

try {
  // 1. Vérifier PM2
  console.log('✓ Vérification de PM2...');
  execSync('pm2 --version', { stdio: 'pipe' });
  
  // 2. Installer/mettre à jour les dépendances
  console.log('✓ Installation des dépendances...');
  execSync('npm install --production', { stdio: 'inherit' });
  
  // 3. Exécuter les migrations
  console.log('✓ Exécution des migrations...');
  execSync('npm run migrate', { stdio: 'inherit' });
  
  // 4. Arrêter les applications existantes
  console.log('✓ Arrêt des applications existantes...');
  try {
    execSync('pm2 delete all', { stdio: 'pipe' });
  } catch (e) {
    // Pas d'applications en cours
  }
  
  // 5. Démarrer avec PM2
  console.log(`✓ Démarrage de l'application avec PM2 (${environment})...`);
  execSync(`pm2 start ecosystem.config.js --env ${environment}`, { stdio: 'inherit' });
  
  // 6. Sauvegarder la configuration PM2
  console.log('✓ Sauvegarde de la configuration PM2...');
  execSync('pm2 save', { stdio: 'pipe' });
  
  // 7. Configurer le démarrage automatique
  if (environment === 'production') {
    console.log('✓ Configuration du démarrage automatique au reboot...');
    try {
      execSync('pm2 startup', { stdio: 'pipe' });
    } catch (e) {
      console.warn('⚠️  Impossible de configurer le startup (privilèges requis)');
    }
  }
  
  // 8. Afficher le statut
  console.log('\n📊 Statut des applications:');
  execSync('pm2 list', { stdio: 'inherit' });
  
  console.log(`\n✅ Déploiement réussi en ${environment}!`);
  console.log('\n💡 Commandes utiles:');
  console.log('   pm2 logs                 # Voir les logs');
  console.log('   pm2 monit                # Monitoring en temps réel');
  console.log('   npm run pm2:restart      # Redémarrer les applications');
  console.log('   npm run pm2:stop         # Arrêter les applications');
  
} catch (error) {
  console.error(`\n❌ Erreur de déploiement: ${error.message}`);
  process.exit(1);
}
