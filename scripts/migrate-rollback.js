#!/usr/bin/env node

/**
 * Script de rollback - Annule la dernière migration
 * Usage: npm run migrate:rollback [nombre]
 */

import { sequelize } from '../config/database.js';
import { ensureMigrationsTable, removeMigrationRecord, getExecutedMigrations } from '../migrations/migrationManager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function rollbackMigrations() {
  try {
    const steps = parseInt(process.argv[2]) || 1;
    
    console.log(`\n🔄 Rollback de ${steps} migration(s)...\n`);
    
    // Créer la table de migrations si nécessaire
    await ensureMigrationsTable();
    
    // Récupérer les migrations exécutées
    const executed = await getExecutedMigrations();
    
    if (executed.length === 0) {
      console.log('ℹ️  Aucune migration à annuler\n');
      return;
    }
    
    console.log(`📊 ${executed.length} migration(s) exécutée(s)\n`);
    
    // Prendre les N dernières migrations
    const toRollback = executed.slice(-steps).reverse();
    
    for (const migration of toRollback) {
      const migrationName = migration.name;
      console.log(`⚙️  ${migrationName} - rollback en cours...`);
      
      try {
        // Charger le fichier de migration
        const migrationsDir = path.join(__dirname, '../migrations/structured');
        const migrationFile = migrationName.replace(/_/g, '_') + '.js';
        const migrationPath = path.join(migrationsDir, migrationFile);
        
        const migrationModule = await import(migrationPath);
        
        // Exécuter le rollback
        if (migrationModule.down) {
          await migrationModule.down();
          await removeMigrationRecord(migrationName);
          console.log(`✅ ${migrationName} - rollback terminé\n`);
        } else {
          console.log(`⚠️  ${migrationName} - pas de fonction down()\n`);
        }
      } catch (error) {
        console.error(`❌ ${migrationName} - ERREUR:`, error.message);
        console.error('\n⚠️  Rollback interrompu\n');
        throw error;
      }
    }
    
    console.log(`\n✅ Rollback de ${toRollback.length} migration(s) terminé!\n`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors du rollback:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

rollbackMigrations();
