#!/usr/bin/env node
/**
 * Gestion des certificats SSL
 * 
 * Usage:
 *   node scripts/ssl-setup.js generate    # Générer un certificat auto-signé
 *   node scripts/ssl-setup.js verify      # Vérifier les certificats
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const command = process.argv[2] || 'verify';
const certDir = './certs';
const keyFile = path.join(certDir, 'private-key.pem');
const certFile = path.join(certDir, 'certificate.pem');

// Créer le dossier des certificats s'il n'existe pas
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

console.log('🔐 Gestion des certificats SSL\n');

if (command === 'generate') {
  console.log('Génération d\'un certificat auto-signé...\n');
  
  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    console.log('⚠️  Les certificats existent déjà. Suppression...');
    fs.unlinkSync(keyFile);
    fs.unlinkSync(certFile);
  }
  
  try {
    // Générer une clé privée et un certificat auto-signé
    const cmd = `openssl req -x509 -newkey rsa:4096 -keyout "${keyFile}" -out "${certFile}" -days 365 -nodes -subj "/C=FR/ST=State/L=City/O=Organization/CN=localhost"`;
    
    execSync(cmd, { stdio: 'inherit' });
    
    console.log('\n✅ Certificat généré avec succès!');
    console.log(`   Clé privée: ${keyFile}`);
    console.log(`   Certificat: ${certFile}`);
    console.log('\n📝 Variables d\'environnement à ajouter au .env:');
    console.log(`   SSL_KEY_PATH=${keyFile}`);
    console.log(`   SSL_CERT_PATH=${certFile}`);
    console.log(`   HTTPS_ENABLED=true`);
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    console.log('\n💡 Vérifiez que openssl est installé:');
    console.log('   macOS: brew install openssl');
    console.log('   Ubuntu/Debian: sudo apt install openssl');
    process.exit(1);
  }

} else if (command === 'verify') {
  console.log('Vérification des certificats...\n');
  
  if (!fs.existsSync(keyFile)) {
    console.log('❌ Clé privée non trouvée:', keyFile);
  } else {
    console.log('✅ Clé privée trouvée:', keyFile);
  }
  
  if (!fs.existsSync(certFile)) {
    console.log('❌ Certificat non trouvé:', certFile);
  } else {
    console.log('✅ Certificat trouvé:', certFile);
    
    try {
      const info = execSync(`openssl x509 -text -noout -in "${certFile}"`, { encoding: 'utf-8' });
      const validFrom = info.match(/Not Before: (.+)/);
      const validUntil = info.match(/Not After : (.+)/);
      
      if (validFrom) console.log(`   Valide depuis: ${validFrom[1]}`);
      if (validUntil) console.log(`   Valide jusqu\'à: ${validUntil[1]}`);
    } catch (e) {
      console.error('Impossible de lire les informations du certificat');
    }
  }
  
  console.log('\n💡 Pour générer de nouveaux certificats:');
  console.log('   node scripts/ssl-setup.js generate');
  
  console.log('\n📝 Pour utiliser les certificats:');
  console.log('   Variables .env: SSL_KEY_PATH et SSL_CERT_PATH');
  console.log('   Utiliser avec un reverse proxy (Nginx, HAProxy)');
  console.log('   Ou avec: https://certbot.eff.org/ (Let\'s Encrypt)');

} else {
  console.log('Commande inconnue:', command);
  console.log('\nCommandes disponibles:');
  console.log('   generate    Générer un certificat auto-signé');
  console.log('   verify      Vérifier les certificats existants');
  process.exit(1);
}
