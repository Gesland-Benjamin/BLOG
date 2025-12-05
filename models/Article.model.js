import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';
import User from './User.model.js';
import Categorie from './Categorie.model.js';

const Article = sequelize.define('Article', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titre: { type: DataTypes.STRING(255), allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  date_publication: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  auteur_id: { type: DataTypes.INTEGER, allowNull: false },
  categorie_id: { type: DataTypes.INTEGER, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'article',
  timestamps: false
});

// Relations
Article.belongsTo(User, { foreignKey: 'auteur_id', as: 'auteur' });
Article.belongsTo(Categorie, { foreignKey: 'categorie_id', as: 'categorie' });

export default Article;