import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';

/**
 * Système de gestion des migrations
 * Permet de tracker les migrations exécutées
 */

// Créer la table de migrations si elle n'existe pas
export async function ensureMigrationsTable() {
  const queryInterface = sequelize.getQueryInterface();
  
  const tables = await queryInterface.showAllTables();
  
  if (!tables.includes('migrations')) {
    await queryInterface.createTable('migrations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      executed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('✅ Table migrations créée');
  }
}

// Vérifier si une migration a été exécutée
export async function isMigrationExecuted(name) {
  const [results] = await sequelize.query(
    'SELECT * FROM migrations WHERE name = ?',
    { replacements: [name] }
  );
  return results.length > 0;
}

// Enregistrer une migration comme exécutée
export async function recordMigration(name) {
  await sequelize.query(
    'INSERT INTO migrations (name, executed_at) VALUES (?, NOW())',
    { replacements: [name] }
  );
}

// Supprimer l'enregistrement d'une migration
export async function removeMigrationRecord(name) {
  await sequelize.query(
    'DELETE FROM migrations WHERE name = ?',
    { replacements: [name] }
  );
}

// Obtenir toutes les migrations exécutées
export async function getExecutedMigrations() {
  const [results] = await sequelize.query(
    'SELECT name, executed_at FROM migrations ORDER BY id ASC'
  );
  return results;
}
