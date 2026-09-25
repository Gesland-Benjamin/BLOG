import { Article, User } from '../models/index.js';
import { getPaginationParams, createPaginationData } from '../utils/pagination.js';
export async function getAuthor(req, res, next) {
  try {
    const where = process.env.EMI_AUTHOR_ID ? { id: process.env.EMI_AUTHOR_ID }
      : process.env.EMI_AUTHOR_EMAIL ? { email: process.env.EMI_AUTHOR_EMAIL } : null;
    const author = where ? await User.findOne({ where, attributes: ['id', 'name'] }) : null;
    const { page, limit, offset } = getPaginationParams(req.query.page, 9);
    const { rows, count } = author ? await Article.findAndCountAll({
      where: { userId: author.id }, order: [['created_at', 'DESC']], limit, offset
    }) : { rows: [], count: 0 };
    if (page > 1 && offset >= count) return res.status(404).render('404', { seo: { ...res.locals.seo, noindex: true } });
    res.render('author', { author, articles: rows,
      seo: { ...res.locals.seo, title: author?.name || 'Émilie', noindex: !author },
      pagination: createPaginationData(count, page, limit, '/auteur/emilie'),
      baseUrl: '/auteur/emilie' });
  } catch (error) { next(error); }
}
