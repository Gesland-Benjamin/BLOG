import { DataTypes } from 'sequelize';
import { sequelize }from '../config/database.js';
import User from './User.model.js';

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  date_inscription: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  confirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  confirmation_token: { type: DataTypes.STRING(64), allowNull: true, unique: true },
  confirmed_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'newsletter_subscriber',
  timestamps: false
});

// Relation optionnelle
NewsletterSubscriber.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default NewsletterSubscriber;