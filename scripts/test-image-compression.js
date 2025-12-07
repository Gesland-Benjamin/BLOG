#!/usr/bin/env node

/**
 * Script de test pour la compression et redimensionnement d'images
 * Usage: npm run test:image-compression
 * ou: node scripts/test-image-compression.js
 */

import { 
  processImage, 
  compressImage, 
  getImageMetadata,
  isValidImage,
  deleteProcessedImages,
  imagePresets 
} from '../services/image.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer une image de test (100x100 PNG)
async function createTestImage() {
  const testDir = path.join(__dirname, '../public/uploads/test');
  await fs.mkdir(testDir, { recursive: true });
  
  // Créer un PNG simple pour le test
  const imagePath = path.join(testDir, 'test-image.png');
  
  // Copier depuis internet ou créer une image de test
  // Pour ce test, on va supposer une image existe déjà
  console.log('✅ Répertoire de test créé\n');
  return imagePath;
}

async function runTests() {
  console.log('🖼️  Tests de compression d\'images avec Sharp\n');
  console.log('═'.repeat(60));
  
  const testDir = path.join(__dirname, '../public/uploads/test');
  
  try {
    // Créer le répertoire de test
    await fs.mkdir(testDir, { recursive: true });
    
    // Test 1: Afficher les présets disponibles
    console.log('\n1️⃣  Présets d\'images disponibles:\n');
    Object.entries(imagePresets).forEach(([name, config]) => {
      console.log(`  📦 ${name}`);
      console.log(`     Qualité: ${config.quality}`);
      console.log(`     Format: ${config.format}`);
      console.log(`     Tailles:`);
      config.sizes.forEach(size => {
        console.log(`       • ${size.width}x${size.height} (${size.suffix})`);
      });
    });
    
    // Test 2: Créer une image SVG simple pour tester
    console.log('\n\n2️⃣  Création d\'une image de test...\n');
    
    const testImagePath = path.join(testDir, 'test-input.png');
    
    // Créer une image PNG simple avec sharp
    const sharp = (await import('sharp')).default;
    
    await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .png()
    .toFile(testImagePath);
    
    const stats = await fs.stat(testImagePath);
    console.log(`  ✅ Image de test créée: ${testImagePath}`);
    console.log(`  📊 Taille: ${(stats.size / 1024).toFixed(2)} KB\n`);
    
    // Test 3: Obtenir les métadonnées
    console.log('\n3️⃣  Métadonnées de l\'image:\n');
    try {
      const metadata = await getImageMetadata(testImagePath);
      console.log(`  📋 Format: ${metadata.format}`);
      console.log(`  📏 Dimensions: ${metadata.width}x${metadata.height}px`);
      console.log(`  💾 Taille: ${(metadata.size / 1024).toFixed(2)} KB`);
      console.log(`  🎨 Colorspace: ${metadata.colorspace || 'N/A'}`);
      console.log(`  👁️  Alpha channel: ${metadata.hasAlpha ? 'Oui' : 'Non'}`);
    } catch (error) {
      console.log(`  ⚠️  ${error.message}`);
    }
    
    // Test 4: Valider l'image
    console.log('\n\n4️⃣  Validation de l\'image:\n');
    const isValid = await isValidImage(testImagePath);
    console.log(`  ✅ Image valide: ${isValid ? 'OUI' : 'NON'}`);
    
    // Test 5: Traiter l'image avec preset
    console.log('\n\n5️⃣  Traitement avec preset "article":\n');
    try {
      const result = await processImage(
        testImagePath,
        testDir,
        'test-article',
        'article'
      );
      
      console.log(`  📊 Statistiques:`);
      console.log(`     Taille originale: ${(result.stats.originalSize / 1024).toFixed(2)} KB`);
      console.log(`     Taille compressée: ${(result.stats.totalCompressed / 1024).toFixed(2)} KB`);
      console.log(`     Compression totale: ${result.stats.compressionRatio}%\n`);
      
      console.log(`  📦 Fichiers générés:`);
      result.processed.forEach(file => {
        console.log(`     ${file.size}:`);
        console.log(`       • Nom: ${file.filename}`);
        console.log(`       • Taille: ${(file.bytes / 1024).toFixed(2)} KB`);
        console.log(`       • Compression: ${file.compression}`);
      });
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
    }
    
    // Test 6: Compression personnalisée
    console.log('\n\n6️⃣  Compression personnalisée:\n');
    try {
      const customPath = path.join(testDir, 'test-custom.webp');
      const customResult = await compressImage(
        testImagePath,
        customPath,
        {
          width: 800,
          height: 600,
          quality: 75,
          format: 'webp'
        }
      );
      
      console.log(`  📊 Résultat:`);
      console.log(`     Format: ${customResult.format}`);
      console.log(`     Qualité: ${customResult.quality}`);
      console.log(`     Taille originale: ${(customResult.originalSize / 1024).toFixed(2)} KB`);
      console.log(`     Taille compressée: ${(customResult.compressedSize / 1024).toFixed(2)} KB`);
      console.log(`     Compression: ${customResult.compression}`);
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
    }
    
    // Test 7: Suppression des images traitées
    console.log('\n\n7️⃣  Suppression des fichiers:\n');
    try {
      const deleted = await deleteProcessedImages(testDir, 'test-article');
      console.log(`  ✅ ${deleted.length} fichier(s) supprimé(s):`);
      deleted.forEach(file => console.log(`     • ${file}`));
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
    }
    
    // Nettoyage
    console.log('\n\n8️⃣  Nettoyage des fichiers de test:\n');
    try {
      const allFiles = await fs.readdir(testDir);
      for (const file of allFiles) {
        const filePath = path.join(testDir, file);
        await fs.unlink(filePath);
      }
      await fs.rmdir(testDir);
      console.log(`  ✅ Répertoire de test supprimé\n`);
    } catch (error) {
      console.log(`  ⚠️  ${error.message}\n`);
    }
    
    console.log('═'.repeat(60));
    console.log('\n✅ Tous les tests sont terminés!\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exitCode = 1;
  }
}

runTests();
