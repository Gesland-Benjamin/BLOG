#!/usr/bin/env node
/**
 * Script de monitoring de l'application
 * 
 * Usage:
 *   node scripts/monitor.js       # Dashboard en temps réel
 *   node scripts/monitor.js logs  # Afficher les logs
 *   node scripts/monitor.js health # Vérifier la santé de l'app
 */

import { execSync } from 'child_process';
import fetch from 'node-fetch';

const command = process.argv[2] || 'dashboard';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

console.log('📊 Monitoring de l\'application\n');

if (command === 'dashboard') {
  console.log('Lancement du dashboard PM2...\n');
  try {
    execSync('pm2 monit', { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  }

} else if (command === 'logs') {
  console.log('Affichage des logs...\n');
  try {
    execSync('pm2 logs', { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  }

} else if (command === 'health') {
  console.log(`Vérification de la santé de l'application (${appUrl})...\n`);
  
  try {
    const response = await fetch(`${appUrl}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Application en bonne santé\n');
      console.log('Détails:');
      console.log(`  Status: ${data.status}`);
      console.log(`  Environment: ${data.environment}`);
      console.log(`  Port: ${data.port}`);
      console.log(`  Uptime: ${Math.floor(data.uptime)}s`);
      console.log(`  Timestamp: ${data.timestamp}`);
    } else {
      console.log(`❌ Application en erreur (${response.status})`);
      console.log(data);
    }
  } catch (error) {
    console.error(`❌ Impossible de joindre l'application: ${error.message}`);
    console.log(`\n💡 Assurez-vous que l'application est en cours d'exécution:`);
    console.log(`   npm run pm2:${process.env.NODE_ENV || 'dev'}`);
    process.exit(1);
  }

} else if (command === 'status') {
  console.log('Statut des processus PM2...\n');
  try {
    execSync('pm2 list', { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  }

} else if (command === 'stats') {
  console.log('Statistiques PM2...\n');
  try {
    const output = execSync('pm2 info all', { encoding: 'utf-8' });
    console.log(output);
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  }

} else {
  console.log('Commande inconnue:', command);
  console.log('\nCommandes disponibles:');
  console.log('   dashboard   Dashboard en temps réel (défaut)');
  console.log('   logs        Afficher les logs');
  console.log('   health      Vérifier la santé de l\'application');
  console.log('   status      Voir le statut des processus');
  console.log('   stats       Voir les statistiques détaillées');
  process.exit(1);
}
