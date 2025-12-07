# Sécurité - Rôles et Middleware

## Améliorations de sécurité implémentées

### 1. Middleware d'authentification et d'autorisation (`middleware/auth.js`)

#### `isAuthenticated(req, res, next)`
- Vérifie qu'un utilisateur est connecté
- Redirige vers la page de connexion avec message si non authentifié
- Sauvegarde l'URL de destination pour redirection après connexion

#### `isAdmin(req, res, next)`
- Vérifie d'abord l'authentification
- Vérifie ensuite le rôle admin de l'utilisateur
- Redirige vers `/auth` si non authentifié
- Affiche une page 403 personnalisée si l'utilisateur n'est pas admin

#### `isAuthorOrAdmin(req, res, next)`
- Permet l'accès aux administrateurs
- Permet l'accès au propriétaire de la ressource
- Utile pour les routes où un utilisateur peut modifier ses propres données

### 2. Rate Limiting (`middleware/rateLimit.js`)

Protection contre les abus et attaques par force brute :

#### `loginRateLimit`
- **Limite** : 5 tentatives par 15 minutes
- **Usage** : Connexion (`POST /auth`)
- **Protection** : Attaques par force brute sur les mots de passe

#### `formRateLimit`
- **Limite** : 5 soumissions par minute
- **Usage** : Inscription, newsletter, reset password
- **Protection** : Spam de formulaires

#### `commentRateLimit`
- **Limite** : 3 commentaires par 5 minutes
- **Usage** : Ajout de commentaires
- **Protection** : Spam de commentaires

#### `likeRateLimit`
- **Limite** : 20 likes par minute
- **Usage** : Likes d'articles
- **Protection** : Manipulation des likes

#### `strictRateLimit`
- **Limite** : 10 requêtes par 15 minutes
- **Usage** : Actions admin critiques (création/modification/suppression)
- **Protection** : Abus des fonctionnalités admin

### 3. Routes protégées

#### Routes admin (toutes protégées par `isAdmin`)
- `/admin/dashboard` - Tableau de bord
- `/admin/articles/*` - Gestion des articles
- `/admin/categories/*` - Gestion des catégories
- `/admin/commentaires/*` - Modération des commentaires
- `/admin/medias/*` - Gestion des médias

#### Routes avec rate limiting
- `POST /auth` - Connexion (loginRateLimit)
- `POST /auth/register` - Inscription (formRateLimit)
- `POST /auth/forgot` - Mot de passe oublié (formRateLimit)
- `POST /auth/reset/:token` - Réinitialisation (formRateLimit)
- `POST /newsletter/subscribe` - Newsletter (formRateLimit)
- `POST /article/:id/like` - Liker un article (likeRateLimit)
- `POST /article/:id/comment` - Commenter (commentRateLimit)
- Actions admin CREATE/UPDATE/DELETE (strictRateLimit)

### 4. Page d'erreur 403

Page personnalisée pour les accès refusés (`views/403.ejs`) :
- Message clair d'accès refusé
- Bouton de retour à l'accueil
- Option de connexion pour les utilisateurs non authentifiés

## Bonnes pratiques implémentées

1. **Séparation des préoccupations** : Middleware dédiés pour chaque type de vérification
2. **Messages d'erreur informatifs** : Sans divulguer d'informations sensibles
3. **Rate limiting en mémoire** : Simple et efficace pour une petite application
4. **Protection en profondeur** : Plusieurs couches de sécurité (auth + rate limiting + validation)
5. **Gestion des sessions** : Vérification côté serveur pour éviter la manipulation

## Recommandations pour la production

1. **Rate limiting avec Redis** : Pour une meilleure scalabilité et persistance
2. **Logs de sécurité** : Enregistrer les tentatives d'accès non autorisées
3. **Variables d'environnement** : Externaliser les limites de rate limiting
4. **Helmet.js** : Ajouter des headers de sécurité HTTP
5. **Sessions sécurisées** : Utiliser un store de sessions persistant (Redis, PostgreSQL)
6. **HTTPS** : Obligatoire en production
7. **Rotation des secrets** : Changer régulièrement le secret de session
