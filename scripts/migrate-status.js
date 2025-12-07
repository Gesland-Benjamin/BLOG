#!/usr/bin/env node

/**
 * Script pour voir le statut des migrations
 * Usage: npm run migrate:status
 */

import { sequelize } from '../config/database.js';
import { ensureMigrationsTable, getExecutedMigrations } from '../migrations/migrationManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrationStatus() {
  try {
    console.log('\n📊 Statut des migrations\n');
    
    // Créer la table de migrations si nécessaire
    await ensureMigrationsTable();
    
    // Récupérer les migrations exécutées
    const executed = await getExecutedMigrations();
    const executedNames = executed.map(m => m.name);
    
    // Lire tous les fichiers de migration
    const migrationsDir = path.join(__dirname, '../migrations/structured');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│ Migration                        │ Statut           │');
    console.log('├─────────────────────────────────────────────────────┤');
    
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = await import(migrationPath);
      const migrationName = migration.name || file.replace('.js', '');
      
      const isExecuted = executedNames.includes(migrationName);
      const status = isExecuted ? '✅ Exécutée' : '⏳ En attente';
      const date = isExecuted 
        ? ` (${new Date(executed.find(m => m.name === migrationName).executed_at).toLocaleDateString('fr-FR')})`
        : '';
      
      console.log(`│ ${migrationName.padEnd(32)} │ ${status.padEnd(16)} │${date}`);
    }
    
    console.log('└─────────────────────────────────────────────────────┘');
    console.log(`\n📈 Total: ${files.length} migrations (${executed.length} exécutées, ${files.length - executed.length} en attente)\n`);
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

migrationStatus();
