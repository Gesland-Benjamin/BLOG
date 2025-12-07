#!/usr/bin/env node

/**
 * Script de migration - Exécute toutes les migrations en attente
 * Usage: npm run migrate
 */

import { sequelize } from '../config/database.js';
import { ensureMigrationsTable, isMigrationExecuted, recordMigration, getExecutedMigrations } from '../migrations/migrationManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('\n🚀 Démarrage des migrations...\n');
    
    // Créer la table de migrations si nécessaire
    await ensureMigrationsTable();
    
    // Récupérer les migrations déjà exécutées
    const executed = await getExecutedMigrations();
    console.log(`📊 ${executed.length} migration(s) déjà exécutée(s)\n`);
    
    // Lire les fichiers de migration
    const migrationsDir = path.join(__dirname, '../migrations/structured');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    let migrationCount = 0;
    
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = await import(migrationPath);
      
      const migrationName = migration.name || file.replace('.js', '');
      
      // Vérifier si déjà exécutée
      if (await isMigrationExecuted(migrationName)) {
        console.log(`⏭️  ${migrationName} - déjà exécutée`);
        continue;
      }
      
      // Exécuter la migration
      console.log(`⚙️  ${migrationName} - en cours...`);
      
      try {
        await migration.up();
        await recordMigration(migrationName);
        migrationCount++;
        console.log(`✅ ${migrationName} - terminée\n`);
      } catch (error) {
        console.error(`❌ ${migrationName} - ERREUR:`, error.message);
        console.error('\n⚠️  Migration interrompue\n');
        throw error;
      }
    }
    
    if (migrationCount === 0) {
      console.log('✨ Aucune nouvelle migration à exécuter\n');
    } else {
      console.log(`\n✅ ${migrationCount} migration(s) exécutée(s) avec succès!\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors des migrations:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

runMigrations();
