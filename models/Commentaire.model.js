import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.model.js';
import Article from './Article.js';

const Commentaire = sequelize.define('Commentaire', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  article_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'commentaire',
  timestamps: false
});

// Relations
Commentaire.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Commentaire.belongsTo(Article, { foreignKey: 'article_id', as: 'article' });

export default Commentaire;