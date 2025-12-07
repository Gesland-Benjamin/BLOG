// Middleware de validation avec Joi
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retourne toutes les erreurs, pas seulement la première
      stripUnknown: true  // Supprime les champs non définis dans le schéma
    });

    if (error) {
      // Extraction des messages d'erreur
      const errors = error.details.map(detail => detail.message);
      
      // Stockage des erreurs dans req pour les rendre disponibles
      req.validationErrors = errors;
      
      // Si c'est une requête AJAX, retourner JSON
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          errors: errors
        });
      }
      
      // Sinon, rediriger avec les erreurs en session
      req.session.errors = errors;
      req.session.formData = req.body; // Sauvegarder les données du formulaire
      return res.redirect('back');
    }

    // Remplacer req.body avec les valeurs validées et nettoyées
    req.body = value;
    next();
  };
};

// Middleware pour extraire les erreurs de session et les passer aux vues
export const getFlashErrors = (req, res, next) => {
  res.locals.errors = (req.session && req.session.errors) ? req.session.errors : [];
  res.locals.formData = (req.session && req.session.formData) ? req.session.formData : {};
  
  // Nettoyer les erreurs après lecture
  if (req.session) {
    delete req.session.errors;
    delete req.session.formData;
  }
  
  next();
};
