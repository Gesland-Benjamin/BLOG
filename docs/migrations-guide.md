# Système de Migrations Structurées

## Vue d'ensemble

Le système de migrations permet de gérer l'évolution du schéma de la base de données de manière structurée, versionnée et réversible.

## Architecture

### Composants

1. **Migration Manager** (`migrations/migrationManager.js`)
   - Gère la table `migrations` qui suit les migrations exécutées
   - Fonctions principales :
     - `ensureMigrationsTable()` - Crée la table de suivi
     - `isMigrationExecuted(name)` - Vérifie si une migration a été exécutée
     - `recordMigration(name)` - Enregistre une migration exécutée
     - `removeMigrationRecord(name)` - Supprime un enregistrement (rollback)
     - `getExecutedMigrations()` - Liste toutes les migrations exécutées

2. **Fichiers de Migration** (`migrations/structured/`)
   - Chaque migration est un fichier JavaScript avec :
     - `name` : Nom unique de la migration
     - `up()` : Fonction pour appliquer la migration
     - `down()` : Fonction pour annuler la migration

3. **Scripts NPM**
   - `npm run migrate` - Exécute toutes les migrations en attente
   - `npm run migrate:rollback` - Annule la dernière migration
   - `npm run migrate:status` - Affiche le statut de toutes les migrations

## Structure d'une Migration

```javascript
export const name = "nom_unique_de_la_migration";

export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  // Code pour appliquer la migration
  await queryInterface.addColumn('nom_table', 'nom_colonne', {
    type: DataTypes.STRING,
    allowNull: true
  });
}

export async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  // Code pour annuler la migration
  await queryInterface.removeColumn('nom_table', 'nom_colonne');
}
```

## Conventions de Nommage

- Les fichiers de migration doivent être nommés avec un préfixe numérique pour l'ordre :
  - `01_create_initial_tables.js`
  - `02_add_article_likes.js`
  - `03_add_password_reset.js`
  - etc.

- Le nom exporté dans la migration doit être descriptif :
  - `create_initial_tables`
  - `add_article_likes`
  - `add_password_reset`

## Utilisation

### Créer une Nouvelle Migration

1. Créer un nouveau fichier dans `migrations/structured/` :

```bash
touch migrations/structured/05_add_nouvelle_fonctionnalite.js
```

2. Implémenter les fonctions `up()` et `down()` :

```javascript
import { DataTypes } from 'sequelize';

export const name = "add_nouvelle_fonctionnalite";

export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.addColumn('article', 'vue_count', {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  });
}

export async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.removeColumn('article', 'vue_count');
}
```

### Exécuter les Migrations

```bash
# Voir le statut actuel
npm run migrate:status

# Exécuter toutes les migrations en attente
npm run migrate

# Annuler la dernière migration
npm run migrate:rollback

# Annuler les 3 dernières migrations
npm run migrate:rollback 3
```

## Opérations Courantes

### Ajouter une Colonne

```javascript
export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.addColumn('nom_table', 'nom_colonne', {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null
  });
}

export async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.removeColumn('nom_table', 'nom_colonne');
}
```

### Créer une Table

```javascript
export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.createTable('nouvelle_table', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
}

export async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.dropTable('nouvelle_table');
}
```

### Modifier une Colonne

```javascript
export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.changeColumn('nom_table', 'nom_colonne', {
    type: DataTypes.TEXT,
    allowNull: false
  });
}

export async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.changeColumn('nom_table', 'nom_colonne', {
    type: DataTypes.STRING(255),
    allowNull: true
  });
}
```

### Ajouter un Index

```javascript
export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.addIndex('article', ['auteur_id'], {
    name: 'idx_article_auteur'
  });
}

export async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.removeIndex('article', 'idx_article_auteur');
}
```

### Ajouter une Contrainte de Clé Étrangère

```javascript
export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.addConstraint('commentaire', {
    fields: ['article_id'],
    type: 'foreign key',
    name: 'fk_commentaire_article',
    references: {
      table: 'article',
      field: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
}

export async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  
  await queryInterface.removeConstraint('commentaire', 'fk_commentaire_article');
}
```

## Table de Suivi des Migrations

La table `migrations` est créée automatiquement et contient :

- `id` : Identifiant unique (auto-incrémenté)
- `name` : Nom de la migration (unique)
- `executed_at` : Date et heure d'exécution

```sql
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migrations Existantes

| Fichier | Nom | Description |
|---------|-----|-------------|
| `01_create_initial_tables.js` | `create_initial_tables` | Création des tables initiales (USER, categorie, article, commentaire, newsletter_subscriber) |
| `02_add_article_likes.js` | `add_article_likes` | Ajout de la colonne `likes` à la table `article` |
| `03_add_password_reset.js` | `add_password_reset` | Ajout des colonnes `reset_token` et `reset_token_expiry` à la table `USER` |
| `04_add_newsletter_confirmation.js` | `add_newsletter_confirmation` | Ajout des colonnes de confirmation à la table `newsletter_subscriber` |

## Bonnes Pratiques

1. **Toujours créer une fonction `down()`**
   - Permet de revenir en arrière en cas de problème
   - Facilite les tests et le développement

2. **Une migration = une responsabilité**
   - Ne pas mélanger plusieurs changements non liés
   - Facilite le suivi et le rollback sélectif

3. **Tester les migrations**
   - Exécuter `up()` puis `down()` pour vérifier la réversibilité
   - Vérifier l'état de la base après chaque opération

4. **Ne jamais modifier une migration déjà exécutée en production**
   - Créer une nouvelle migration pour corriger
   - Préserve l'historique et la traçabilité

5. **Utiliser des transactions implicites**
   - Les migrations utilisent automatiquement des transactions
   - En cas d'erreur, tout est annulé

6. **Commenter les migrations complexes**
   - Expliquer le pourquoi du changement
   - Documenter les dépendances

## Workflow de Développement

1. **Développement local**
   ```bash
   # Créer une nouvelle migration
   touch migrations/structured/05_ma_migration.js
   
   # Implémenter up() et down()
   # ...
   
   # Tester
   npm run migrate
   npm run migrate:status
   npm run migrate:rollback
   npm run migrate
   ```

2. **Déploiement**
   ```bash
   # Sur le serveur de production
   git pull
   npm install
   npm run migrate
   ```

3. **En cas de problème**
   ```bash
   # Rollback de la dernière migration
   npm run migrate:rollback
   
   # Correction du code
   # ...
   
   # Réexécution
   npm run migrate
   ```

## Dépannage

### Erreur : Migration déjà exécutée

Si une migration a été partiellement exécutée :

1. Vérifier l'état de la base de données
2. Supprimer manuellement l'enregistrement dans la table `migrations` :
   ```sql
   DELETE FROM migrations WHERE name = 'nom_migration';
   ```
3. Corriger la migration
4. Réexécuter

### Erreur : Table migrations inexistante

Le script `migrate.js` crée automatiquement la table. Si nécessaire :

```javascript
await ensureMigrationsTable();
```

### Ordre d'exécution incorrect

Les migrations sont triées par nom de fichier. S'assurer que les préfixes numériques sont corrects (01, 02, 03, etc.).

## Ressources

- Documentation Sequelize QueryInterface : https://sequelize.org/docs/v6/other-topics/query-interface/
- DataTypes Sequelize : https://sequelize.org/docs/v6/core-concepts/model-basics/#data-types

## Conclusion

Ce système de migrations offre :
- ✅ Versionnage du schéma de base de données
- ✅ Réversibilité des changements
- ✅ Suivi de l'historique
- ✅ Facilité de déploiement
- ✅ Travail en équipe simplifié
