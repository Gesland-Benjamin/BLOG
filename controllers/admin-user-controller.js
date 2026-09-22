import User from '../models/User.model.js';
import Article from '../models/Article.model.js';
import Commentaire from '../models/Commentaire.model.js';
import ArticleLike from '../models/ArticleLike.model.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.model.js';
import sequelize from '../config/database.js';

export async function deleteUser(req, res, next) {
  const userId = Number(req.params.id);
  if (!Number.isSafeInteger(userId) || userId < 1 || req.user.id === userId) {
    return res.status(400).send('Suppression non autorisée.');
  }
  try {
    const result = await sequelize.transaction(async transaction => {
      // Ordre commun aux suppressions concurrentes : protéger le dernier admin.
      const admins = await User.findAll({ where: { role: 'admin' }, order: [['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
      const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user) return 'Utilisateur introuvable.';
      if (user.role === 'admin' && admins.length <= 1) return 'Impossible de supprimer le dernier administrateur.';
      if (await Article.count({ where: { userId }, transaction })) return 'Ce compte possède des articles. Réattribuez-les avant de supprimer le compte.';
      // Préserver les contenus et abonnements au lieu de les effacer en cascade.
      await Commentaire.update({ userId: null }, { where: { userId }, transaction });
      await ArticleLike.update({ userId: null }, { where: { userId }, transaction });
      await NewsletterSubscriber.update({ user_id: null }, { where: { user_id: userId }, transaction });
      await user.destroy({ transaction });
      return 'Compte supprimé. Ses contenus ont été conservés.';
    });
    req.session.message = { type: 'info', text: result };
    return res.redirect('/admin/dashboard');
  } catch (error) { next(error); }
}
