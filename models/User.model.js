import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom_prenom: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  mot_de_passe: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('visiteur', 'admin'), allowNull: false, defaultValue: 'visiteur' }
}, {
  tableName: 'USER',
  timestamps: false
});

export default User;