# Blog Node.js - Guide de déploiement et de refonte

Ce projet est un site Express / Sequelize avec une interface EJS et du CSS découpé par pages. Ce document sert de guide pratique pour un redéploiement sur Hostinger et pour savoir exactement où intervenir si tu veux retravailler les cartes articles et la page détail.

## Objectif

1. Déployer proprement sur Hostinger.
2. Garder les variables d'environnement cohérentes entre local et production.
3. Savoir quels fichiers modifier quand tu touches au design des articles.
4. Limiter les changements au strict nécessaire lors d'un redeploiement.

## Checklist rapide

Avant de redeployer, valide ces points :

1. Les variables `.env` ou `.env.production` sont correctes pour l'environnement cible.
2. La base de données répond et les migrations / seeds ont déjà été joués si nécessaire.
3. Les vues article et les feuilles CSS ont été vérifiées en local.
4. Les images et uploads utiles sont présents dans `public/uploads`.
5. Le serveur démarre avec la bonne valeur de `NODE_ENV`.
6. Les cookies de session sont compatibles avec le protocole utilisé en production.
7. Les pages `/`, `/article`, `/article/:id`, `/auth` et `/admin/dashboard` sont testées après déploiement.

## Fichiers à retoucher pour les cartes et la page détail

Le plus important pour une refonte visuelle propre se trouve ici :

| Fichier | Rôle | Quand le modifier |
| --- | --- | --- |
| [views/index.ejs](views/index.ejs#L47) | Cartes articles de la page d'accueil | Quand tu veux réorganiser les blocs de mise en avant, l'extrait, l'image ou les boutons |
| [views/article.ejs](views/article.ejs#L10) | Liste des articles et cartes d'archive | Quand tu veux harmoniser les cards de catégories / archives |
| [views/article-detail.ejs](views/article-detail.ejs#L8) | Vue détail d'un article | Quand tu veux améliorer la hiérarchie visuelle, le bloc image, le texte et les actions |
| [public/css/7-pages-home.css](public/css/7-pages-home.css#L144) | Styles des cards d'accueil | Quand tu veux changer les proportions, l'espacement, les hover, le responsive |
| [public/css/8-pages-article.css](public/css/8-pages-article.css#L74) | Styles de la vue article et détail | Quand tu veux refaire les cartes article, le layout détail, les commentaires, les boutons |
| [public/css/3-components.css](public/css/3-components.css#L261) | Composants partagés d'archive et d'actions | Quand tu veux mutualiser les styles de cards et éviter les doublons |
| [controllers/article-controller.js](controllers/article-controller.js#L14) | Données envoyées aux vues article | Quand tu changes le contenu affiché dans les cards, les métadonnées ou la structure de détail |
| [routes/article.js](routes/article.js#L10) | Routes de la section article | Quand tu ajoutes une nouvelle vue, un nouvel onglet ou une route plus propre |

### Ce que je te conseille pour la refonte visuelle

1. Unifier toutes les cards avec une même grille, une même hauteur d'image et un même bloc metadata.
2. Mettre les informations secondaires au même endroit partout : auteur, catégorie, date.
3. Raccourcir les extraits sur la home et dans les listes, puis garder plus de contenu sur la page détail.
4. Donner à la page détail une largeur fixe lisible, avec une colonne unique et des blocs bien séparés.
5. Déplacer les styles réutilisables dans `public/css/3-components.css`, puis garder les spécificités de page dans `7-pages-home.css` et `8-pages-article.css`.

## Fichiers à retoucher pour le déploiement Hostinger

| Fichier | Rôle | Ce qu'il faut vérifier |
| --- | --- | --- |
| [config/database.js](config/database.js#L8) | Chargement de l'environnement et connexion MySQL | Les variables `DB_*` doivent pointer vers la base Hostinger ou vers ta base distante |
| [index.js](index.js#L1) | Bootstrap Express, sessions et assets statiques | `NODE_ENV`, le store de session, et le paramètre `secure` du cookie |
| [ecosystem.config.cjs](ecosystem.config.cjs#L77) | Profils PM2 | Le bloc production doit viser les bonnes variables et le bon point d'entrée |
| [.env](.env) | Configuration locale | À garder pour le développement local seulement |
| `.env.production` | Configuration production | À remplir avec les vraies variables Hostinger avant le déploiement |
| [config/production.js](config/production.js#L14) | Réglages production / sécurité | HTTPS, CORS et secrets doivent correspondre au domaine final |
| [scripts/check-env.js](scripts/check-env.js#L18) | Validation des variables | Lance-le avant chaque mise en prod |

## Procédure recommandée pour Hostinger VPS

### 1. Préparer le code

1. Fais tes changements de vue et de CSS en local.
2. Vérifie que l'accueil, la liste d'articles et la page détail s'affichent bien.
3. Lance les vérifications de variables d'environnement et les tests de production si disponibles.

### 2. Préparer la configuration

1. Renseigne les variables de production dans `.env.production`.
2. Vérifie la base de données, l'email et le secret de session.
3. Si tu utilises un proxy HTTPS externe, laisse Node derrière HTTP et gère le SSL au niveau du proxy.

### 3. Déployer

1. Envoie le code sur Hostinger via git, SSH ou SFTP.
2. Installe les dépendances avec `npm ci` ou `npm install`.
3. Joue la création / migration de base seulement si le schéma a changé.
4. Démarre l'app avec PM2 ou le service d'hébergement.

### 4. Contrôler après déploiement

1. Ouvre `/` et vérifie les cards articles.
2. Ouvre `/article` et vérifie la liste des articles.
3. Ouvre une page détail et vérifie image, texte, commentaires et boutons.
4. Ouvre `/auth` et teste la connexion.
5. Ouvre `/admin/dashboard` avec un compte admin.
6. Vérifie que les CSS chargent sans erreur.

## Commandes utiles

```bash
npm run check:env
npm run db:create
npm run db:seed
npm run test:production
npm run pm2:production
```

## Zones de code à modifier selon le besoin

### Si tu veux juste refaire le design

Modifie d'abord les vues et les CSS :

- `views/index.ejs`
- `views/article.ejs`
- `views/article-detail.ejs`
- `public/css/3-components.css`
- `public/css/7-pages-home.css`
- `public/css/8-pages-article.css`

### Si tu changes les données affichées dans les cards

Modifie ensuite le contrôleur et, si besoin, les routes :

- `controllers/article-controller.js`
- `routes/article.js`

### Si tu changes la configuration de serveur

Modifie plutôt :

- `index.js`
- `config/database.js`
- `.env.production`
- `ecosystem.config.cjs`
- `config/production.js`

## Règle simple avant chaque redeploiement

Si tu n'as touché qu'au rendu visuel, envoie seulement les vues et le CSS.
Si tu as touché au contenu des articles, ajoute le contrôleur.
Si tu as touché à la base, relance les scripts de création / seed et teste les routes critiques.
