// Aucun accès DB et aucune réinjection de mots de passe dans les vues.
export const validateRequest = (schema, options = {}) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (!error) { req.body = value; return next(); }
  const errors = error.details.map(d => ['password', 'password_confirm'].includes(d.path[0]) ? 'Le mot de passe doit respecter les critères et sa confirmation doit être identique.' : d.message);
  if (req.xhr || req.headers.accept?.includes('application/json') || options.api) return res.status(400).json({ success: false, errors });
  if (options.view) {
    const formData = {};
    for (const key of ['name', 'nom', 'email', 'telephone', 'sujet', 'message']) {
      if (typeof req.body?.[key] === 'string') formData[key] = req.body[key];
    }
    return res.status(400).render(options.view, {
      title: 'Vérifiez le formulaire', errors, formData, message: null,
      error: errors.join(' '), devToken: null,
      ...(options.view === 'reset-password' ? { token: req.params.token, isValid: true } : {})
    });
  }
  // Les formulaires admin gardent la saisie dans le navigateur (retour), sans fuite.
  return res.status(400).send('Formulaire invalide. Vérifiez les champs puis réessayez.');
};
export const getFlashErrors = (req, res, next) => {
  res.locals.errors = req.session?.errors || [];
  res.locals.formData = req.session?.formData || {};
  if (req.session) { delete req.session.errors; delete req.session.formData; }
  next();
};
