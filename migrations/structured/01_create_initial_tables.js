import { sequelize } from '../../config/database.js';
import { DataTypes } from 'sequelize';

export const name = '01_create_initial_tables';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('📦 Création des tables initiales...');
  
  // Table USER
  await queryInterface.createTable('USER', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom_prenom: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    mot_de_passe: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'visiteur'
    }
  });
  console.log('  ✅ Table USER créée');

  // Table categorie
  await queryInterface.createTable('categorie', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    }
  });
  console.log('  ✅ Table categorie créée');

  // Table article
  await queryInterface.createTable('article', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date_publication: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    auteur_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USER',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    categorie_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categorie',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  });
  console.log('  ✅ Table article créée');

  // Table commentaire
  await queryInterface.createTable('commentaire', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'article',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'USER',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    is_spam: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });
  console.log('  ✅ Table commentaire créée');

  // Table newsletter_subscriber
  await queryInterface.createTable('newsletter_subscriber', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'USER',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }
  });
  console.log('  ✅ Table newsletter_subscriber créée');

  console.log('✅ Migration 01 terminée');
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Rollback des tables initiales...');
  
  await queryInterface.dropTable('commentaire');
  await queryInterface.dropTable('article');
  await queryInterface.dropTable('newsletter_subscriber');
  await queryInterface.dropTable('categorie');
  await queryInterface.dropTable('USER');
  
  console.log('✅ Rollback 01 terminé');
}
