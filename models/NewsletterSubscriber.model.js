// models/NewsletterSubscriber.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Import de User (attention aux dépendances circulaires)
import User from './User.model.js';

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
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
    defaultValue: DataTypes.NOW,
    field: 'date_inscription'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id'
  },
  confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  confirmation_token: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  created_at: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.date_inscription;
    }
  }
}, {
  tableName: 'newsletter_subscribers',
  freezeTableName: true,
  underscored: false,
  timestamps: false
});

// Association
NewsletterSubscriber.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

export default NewsletterSubscriber;