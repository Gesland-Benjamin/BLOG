import { equalSecret, fingerprint } from '../utils/security.js';

export function loadSessionUser(User) {
  return async (req, res, next) => {
    req.user = null;
    res.locals.user = null;
    const saved = req.session?.user;
    if (!saved) return next();
    try {
      const user = await User.scope('withPassword').findByPk(saved.id);
      const expired = !req.session.lastActive || Date.now() - req.session.lastActive > 30 * 60 * 1000;
      if (!user || expired || !equalSecret(req.session.authVersion, fingerprint(`${user.password}\0${user.role}`))) {
        // Les anciennes sessions sans empreinte seront reconnectées après livraison.
        return req.session.regenerate(error => {
          if (error) return next(error);
          next();
        });
      }
      req.session.lastActive = Date.now();
      req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      req.session.user = req.user;
      res.locals.user = req.user;
      next();
    } catch (error) { next(error); }
  };
}
