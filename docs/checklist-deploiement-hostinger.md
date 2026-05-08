# Checklist de déploiement Hostinger

Cette checklist est pensée pour un redéploiement du site sur Hostinger en gardant une base propre, un front cohérent et des points de contrôle simples.

## 1. Avant de toucher au code

- [ ] Faire une sauvegarde de la base de données.
- [ ] Sauvegarder `public/uploads` et toute image ajoutée à la main.
- [ ] Vérifier que les identifiants admin et les comptes de test fonctionnent encore.
- [ ] Noter le domaine final, le sous-domaine éventuel et l'environnement Hostinger utilisé.

## 2. Refonte des cartes articles

- [ ] Harmoniser la carte article de la home dans [views/index.ejs](../views/index.ejs#L47).
- [ ] Harmoniser la carte d'archive dans [views/article.ejs](../views/article.ejs#L41).
- [ ] Réduire les écarts entre les pages listant des articles dans `views/articles-by-category.ejs`, `views/articles-by-month.ejs` et `views/search-articles.ejs`.
- [ ] Déplacer un maximum de styles communs dans [public/css/3-components.css](../public/css/3-components.css#L261).
- [ ] Ajuster les styles responsive dans [public/css/7-pages-home.css](../public/css/7-pages-home.css#L144).
- [ ] Vérifier que les images gardent un ratio stable sur desktop et mobile.
- [ ] Vérifier que les extraits n'écrasent pas les boutons et les métadonnées.

## 3. Refonte de la vue détail article

- [ ] Repenser le bloc principal dans [views/article-detail.ejs](../views/article-detail.ejs#L8).
- [ ] Régler la largeur de lecture, les marges et la hiérarchie titre / meta / contenu dans [public/css/8-pages-article.css](../public/css/8-pages-article.css#L74).
- [ ] Garder le média principal bien visible au-dessus du contenu.
- [ ] Vérifier le bloc vidéo, les commentaires, le bouton like et les actions admin.
- [ ] Contrôler le comportement mobile de la page détail.

## 4. Étapes techniques avant production

- [ ] Vérifier que [config/database.js](../config/database.js#L8) pointe vers les bonnes variables d'environnement.
- [ ] Vérifier que [index.js](../index.js#L1) charge les sessions et les cookies correctement.
- [ ] Vérifier que `NODE_ENV=production` est bien défini sur le serveur.
- [ ] Vérifier que `.env.production` contient la bonne base, le bon secret et le bon domaine.
- [ ] Vérifier les paramètres du profil production dans [ecosystem.config.cjs](../ecosystem.config.cjs#L77).
- [ ] Vérifier les règles de sécurité et CORS dans [config/production.js](../config/production.js#L14).

## 5. Ce qu'il faut modifier selon le type de changement

### Si tu changes uniquement le design

- [ ] Modifier les vues : `views/index.ejs`, `views/article.ejs`, `views/article-detail.ejs`.
- [ ] Modifier les styles : `public/css/3-components.css`, `public/css/7-pages-home.css`, `public/css/8-pages-article.css`.
- [ ] Tester les pages en navigation normale et en mobile.

### Si tu changes les données envoyées aux vues

- [ ] Modifier [controllers/article-controller.js](../controllers/article-controller.js#L14).
- [ ] Vérifier les routes [routes/article.js](../routes/article.js#L10).
- [ ] Ajuster les champs transmis aux templates si le HTML dépend d'un nouveau champ.

### Si tu changes la structure serveur ou les sessions

- [ ] Modifier `index.js`.
- [ ] Modifier `config/database.js` si la connexion DB change.
- [ ] Préparer `.env.production` avant de pousser sur Hostinger.
- [ ] Vérifier que le cookie de session n'est pas bloqué par le protocole utilisé.

## 6. Déploiement Hostinger VPS

- [ ] Pousser le code sur le dépôt distant.
- [ ] Se connecter en SSH sur le VPS Hostinger.
- [ ] Récupérer le code avec `git pull`.
- [ ] Installer les dépendances avec `npm ci` ou `npm install`.
- [ ] Lancer `npm run check:env`.
- [ ] Lancer `npm run db:create` uniquement si le schéma doit être recréé.
- [ ] Lancer `npm run db:seed` uniquement pour un peuplement initial ou de test.
- [ ] Démarrer l'application avec `npm run pm2:production` ou le service d'exploitation choisi.
- [ ] S'assurer que le processus redémarre automatiquement au reboot.

## 7. Vérification finale après déploiement

- [ ] La page d'accueil s'ouvre sans erreur.
- [ ] Les cartes articles s'affichent proprement.
- [ ] La page détail article s'affiche correctement.
- [ ] Le CSS est chargé et les images s'affichent.
- [ ] La connexion utilisateur fonctionne.
- [ ] Le bouton admin apparaît uniquement quand la session admin est active.
- [ ] Le dashboard admin est accessible avec le compte de test.
- [ ] Les logs du serveur ne montrent pas d'erreur de session ou de base de données.

## 8. Rollback simple si souci

- [ ] Revenir au commit précédent.
- [ ] Restaurer la base si une migration a cassé le schéma.
- [ ] Vider les sessions si le cookie a été impacté.
- [ ] Recharger PM2 ou redémarrer le service.
