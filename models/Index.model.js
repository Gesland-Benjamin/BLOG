import User from './User.model.js';
import Categorie from './Categorie.js';
import Article from './Article.js';
import Commentaire from './Commentaire.js';
import NewsletterSubscriber from './NewsletterSubscriber.js';

// Relations
User.hasMany(Article, { foreignKey: 'auteur_id', as: 'articles' });
User.hasMany(Commentaire, { foreignKey: 'user_id', as: 'commentaires' });
User.hasMany(NewsletterSubscriber, { foreignKey: 'user_id', as: 'newsletter' });

Categorie.hasMany(Article, { foreignKey: 'categorie_id', as: 'articles' });
Article.hasMany(Commentaire, { foreignKey: 'article_id', as: 'commentaires' });

export { User, Categorie, Article, Commentaire, NewsletterSubscriber };