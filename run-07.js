import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import { ensureMigrationsTable, isMigrationExecuted, recordMigration } from './migrations/migrationManager.js';
import { up } from './migrations/07.add-article-image-alt.js';

dotenv.config();

async function runMigration() {
  try {
    // Assurer que la table de migrations existe
    await ensureMigrationsTable();
    
    const migrationName = '07.add-article-image-alt';
    
    // Vérifier si la migration a déjà été exécutée
    const executed = await isMigrationExecuted(migrationName);
    
    if (executed) {
      console.log(`Migration ${migrationName} déjà exécutée`);
      process.exit(0);
    }
    
    // Exécuter la migration
    console.log(`Exécution de la migration ${migrationName}...`);
    await up();
    
    // Enregistrer la migration
    await recordMigration(migrationName);
    console.log(`Migration ${migrationName} exécutée avec succès`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la migration:', error);
    process.exit(1);
  }
}

runMigration();
