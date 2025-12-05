import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';

const Categorie = sequelize.define('Categorie', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(100), allowNull: false }
}, {
  tableName: 'categorie',
  timestamps: false
});

export default Categorie;