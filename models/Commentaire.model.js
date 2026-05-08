import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Commentaire = sequelize.define("Commentaire", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  statut: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },

  is_spam: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  is_admin_reply: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  nom: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.name;
    }
  },

  contenu: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.content;
    }
  },

  date_publication: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.createdAt || this.created_at || null;
    }
  },

  date: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.createdAt || this.created_at || null;
    }
  },

  auteur: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.user?.nom_prenom || this.user?.name || this.name || null;
    }
  },

}, {
  tableName: "comments",

  // 🔥 ALIGNEMENT TOTAL SNAKE_CASE DB
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",

  underscored: true
});

export default Commentaire;