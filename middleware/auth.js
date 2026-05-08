// middleware/auth.js

// Middleware pour vérifier qu'un utilisateur est authentifié
export function isAuthenticated(req, res, next) {
  

  if (req.session && req.session.user) {
    console.log("[AUTH CHECK] Authenticated, proceeding...");
    return next();
  }

 
  req.session.message = { 
    type: 'error', 
    text: 'Vous devez être connecté pour accéder à cette page' 
  };
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth');
}

// Middleware pour vérifier qu'un utilisateur est admin
export function isAdmin(req, res, next) {
  

  if (!req.session || !req.session.user) {
    
    req.session.message = { 
      type: 'error', 
      text: 'Vous devez être connecté pour accéder à cette page' 
    };
    return res.redirect('/auth');
  }

  if (req.session.user.role?.toLowerCase() === 'admin') {
   
    return next();
  }


  res.status(403).render('403', { 
    message: 'Accès refusé. Cette page est réservée aux administrateurs.' 
  });
}

// Middleware pour vérifier qu'un utilisateur est l'auteur ou admin
export function isAuthorOrAdmin(req, res, next) {
  

  if (!req.session || !req.session.user) {
    console.log("[AUTHOR/ADMIN CHECK] Not authenticated, redirecting to /auth");
    req.session.message = { 
      type: 'error', 
      text: 'Vous devez être connecté pour accéder à cette page' 
    };
    return res.redirect('/auth');
  }

  const userId = req.session.user.id;
  const userRole = req.session.user.role;
  const resourceOwnerId = req.params.userId || req.body.userId;

  if (userRole?.toLowerCase() === 'admin') {
    
    return next();
  }

  if (resourceOwnerId && parseInt(userId) === parseInt(resourceOwnerId)) {
    
    return next();
  }

  
  res.status(403).render('403', { 
    message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' 
  });
}