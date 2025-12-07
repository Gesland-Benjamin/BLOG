import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.model.js';
import Article from './Article.model.js';

const Commentaire = sequelize.define('Commentaire', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(150), allowNull: true },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  statut: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  is_spam: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  article_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'commentaire',
  timestamps: false
});

// Relations
Commentaire.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Commentaire.belongsTo(Article, { foreignKey: 'article_id', as: 'article' });

export default Commentaire;