#!/usr/bin/env node

/**
 * Script de vérification de la configuration des variables d'environnement
 * Usage: node scripts/check-env.js
 */

import dotenv from 'dotenv';
import { sequelize } from '../config/database.js';

dotenv.config();

console.log('\n🔍 Vérification de la configuration...\n');

// Variables requises
const requiredVars = [
  { name: 'PORT', description: 'Port du serveur' },
  { name: 'DB_NAME', description: 'Nom de la base de données' },
  { name: 'DB_USER', description: 'Utilisateur de la base de données' },
  { name: 'DB_HOST', description: 'Hôte de la base de données' },
  { name: 'SESSION_SECRET', description: 'Secret pour les sessions' },
];

// Variables optionnelles
const optionalVars = [
  { name: 'EMAIL_USER', description: 'Email pour l\'envoi de mails' },
  { name: 'EMAIL_PASSWORD', description: 'Mot de passe email' },
  { name: 'NODE_ENV', description: 'Environnement (development/production)' },
];

let hasErrors = false;

console.log('📋 Variables requises:');
requiredVars.forEach(({ name, description }) => {
  const value = process.env[name];
  if (value) {
    // Masquer les secrets
    const display = name.includes('SECRET') || name.includes('PASSWORD') 
      ? '***' + value.slice(-4) 
      : value;
    console.log(`  ✅ ${name}: ${display} (${description})`);
  } else {
    console.log(`  ❌ ${name}: MANQUANT (${description})`);
    hasErrors = true;
  }
});

console.log('\n📋 Variables optionnelles:');
optionalVars.forEach(({ name, description }) => {
  const value = process.env[name];
  if (value) {
    const display = name.includes('PASSWORD') 
      ? '***' + value.slice(-4) 
      : value;
    console.log(`  ✅ ${name}: ${display} (${description})`);
  } else {
    console.log(`  ⚠️  ${name}: Non configuré (${description})`);
  }
});

// Test de connexion à la base de données
console.log('\n🔌 Test de connexion à la base de données...');
try {
  await sequelize.authenticate();
  console.log('  ✅ Connexion à la base de données réussie');
  await sequelize.close();
} catch (error) {
  console.log('  ❌ Erreur de connexion à la base de données:', error.message);
  hasErrors = true;
}

// Vérification de la force du secret de session
console.log('\n🔒 Vérification de la sécurité...');
const sessionSecret = process.env.SESSION_SECRET;
if (sessionSecret) {
  if (sessionSecret.length < 32) {
    console.log('  ⚠️  SESSION_SECRET trop court (minimum 32 caractères recommandé)');
    console.log(`     Actuel: ${sessionSecret.length} caractères`);
  } else {
    console.log(`  ✅ SESSION_SECRET: ${sessionSecret.length} caractères`);
  }
  
  // Vérifier si c'est un secret par défaut
  const defaultSecrets = [
    'unSecretParDefautPourDev',
    'CHANGEZ_CE_SECRET_PAR_UN_VRAI_SECRET_ALEATOIRE'
  ];
  
  if (defaultSecrets.includes(sessionSecret)) {
    console.log('  ⚠️  Vous utilisez un secret par défaut ! Changez-le en production !');
  }
}

// Environnement
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`\n🌍 Environnement: ${nodeEnv}`);

if (nodeEnv === 'production') {
  console.log('\n⚠️  MODE PRODUCTION - Vérifications supplémentaires:');
  
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 64) {
    console.log('  ❌ En production, SESSION_SECRET devrait faire au moins 64 caractères');
    hasErrors = true;
  }
  
  if (!process.env.DB_PASSWORD) {
    console.log('  ❌ La base de données devrait avoir un mot de passe en production');
    hasErrors = true;
  }
}

console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ Configuration incomplète ou incorrecte');
  console.log('💡 Consultez docs/configuration-env.md pour plus d\'informations');
  process.exit(1);
} else {
  console.log('✅ Configuration OK !');
  console.log('🚀 Vous pouvez démarrer l\'application');
  process.exit(0);
}
