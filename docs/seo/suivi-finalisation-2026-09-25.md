# Finalisation SEO — 25 septembre 2026

## Périmètre et respect des données

Travail sur le code local. Aucune connexion directe à la base réelle, aucune migration réelle, aucun reset/seed, aucune édition ou suppression d’article, aucune modification des uploads existants et aucun déploiement. Les tests utilisent des modèles simulés ; les fichiers temporaires d’images créés par les tests sont isolés. Les pages À propos/auteur et le bloc biographique supprimés à la demande du propriétaire ne sont pas réintroduits.

## Corrections livrées

- Formulaire article : un seul `image_alt`, avec limite à 255 caractères. Régression couverte par rendu EJS et vrai décodage multipart en mémoire.
- Éditeur : trame insérée au curseur sans remplacement du texte, retours de rédaction, listes HTML à puces et numérotées, aperçu partagé avec le rendu public. L’auteur garde la main sur sa rédaction.
- Nouveaux uploads : nom descriptif dérivé du titre, suffixe unique conservé ; les anciens fichiers ne sont pas renommés.
- H1 ajouté aux écrans de connexion, inscription et récupération de mot de passe.
- Images de listes en chargement différé ; première image du carrousel prioritaire. Les images suivantes sont différées.
- Minification esbuild avec fichiers à empreinte de contenu, manifeste et repli vers les sources. Les anciens assets générés restent disponibles, sans commande de nettoyage. Les imports de l’éditeur sont regroupés.
- CSS administrateur et authentification chargés uniquement sur les pages concernées ; script carrousel émis uniquement pour un carrousel de plusieurs éléments.
- Cache long pour les assets à empreinte ; HTML privé/no-store conservé.
- Description de catégorie existante utilisée lorsqu’elle est renseignée, sinon meta description propre à la rubrique.
- Invitation à commenter ou s’abonner en fin d’article ; correction du lien de catégorie lorsqu’un article n’en a pas.
- Série « Bienvenue dans mon univers » reliant les dix articles existants via `config/article-series.js`. Lecture des articles publiés uniquement, sans modification de données.
- Table optionnelle de redirections de slugs dans `config/article-redirects.js`, vide par défaut. Le contrôleur vérifie l’existence/publication de la cible avant une 301. Conserver les slugs actuels ; ne pas les changer juste pour les raccourcir.
- `public/robots.txt` contient maintenant le sitemap du domaine confirmé, pour les hébergements qui servent le fichier avant Express. La route Express reste dynamique depuis APP_URL.
- Script `scripts/audit-public-seo.js` : contrôle HTTP public borné, explicite et en lecture seule ; aucun import de l’application ou de sa configuration de base.
- Guide éditorial et plan de questions/séries : `docs/seo/guide-editorial-emi.md`. Aucune publication ni réécriture automatique des textes.

## Contrôles sur https://emi-pulse.fr (avant déploiement de ces changements)

Le rapport HTTP détaillé est conservé localement et exclu de Git pour ne pas versionner de capture de données de production.

- 26 URLs du sitemap contrôlées, toutes en HTTP 200 et avec exactement un H1.
- HTTP redirige vers HTTPS en 301 ; `/article/35` redirige en 301 vers son slug.
- Une URL d’article inconnue renvoie bien 404.
- L’article 35 contient canonical HTTPS, BlogPosting, auteur réel et dates de publication/modification.
- Aucun lien d’article/archives cassé trouvé parmi les cibles publiques examinées ; 19 images locales contrôlées sans erreur HTTP. Ce contrôle ne couvre ni l’administration ni tous les liens externes.
- **Écart constaté en production : robots.txt ne déclare pas le sitemap.** Le fichier de secours corrigé doit être déployé pour résoudre cet écart.
- Pas de balise de validation Google sur l’accueil observé. Cela ne permet pas de conclure sur une éventuelle validation DNS.
- PageSpeed Insights a renvoyé un dépassement de quota API. Aucun résultat de Core Web Vitals n’est revendiqué.
- Aucun navigateur pilotable n’est disponible dans cette session : contrôle visuel mobile restant à faire.

## Validation locale

`npm run build` ne traite que les assets. Le groupe CSS/JS traité passe d’environ 228 ko à 160 ko (−30 %, avant compression HTTP). Ce n’est pas une mesure de chargement de page. La suite de 60 tests passe et couvre les routes existantes et les nouvelles régressions sans se connecter à une base réelle. Les contrôles de syntaxe des fichiers serveur modifiés et `git diff --check` passent également.

## Mise en ligne de cette livraison

1. Cette livraison ne nécessite **aucune nouvelle migration**. Ne pas lancer les commandes de création, seed, reset ou migration. Ne pas utiliser la procédure historique d’activation de migration pour ces changements.
2. Générer les assets avec `npm run build` avant de livrer, puis conserver `public/assets` et son manifeste avec les sources. Le script ne supprime pas les anciens assets.
3. Garder `APP_URL=https://emi-pulse.fr`. Au redémarrage éventuel, laisser `SEO_MIGRATION_ON_START=0` pour interdire la migration automatique. Ne pas démarrer une ancienne version ignorant les brouillons.
4. Déployer uniquement après la procédure habituelle du propriétaire. Aucun push ni redémarrage serveur n’a été effectué pendant ce travail.
5. Après déploiement, lancer `node scripts/audit-public-seo.js https://emi-pulse.fr` et vérifier robots.txt, formulaire article, rendu mobile et série.

## Google Search Console : opération extérieure au dépôt

L’état de validation est inconnu et aucun accès Google n’est disponible ici. La création de la propriété et l’envoi du sitemap ne peuvent pas être déduits du code.

1. Ouvrir https://search.google.com/search-console avec le compte du propriétaire et sélectionner la propriété existante si elle est présente.
2. Sinon, ajouter la propriété Domaine `emi-pulse.fr` et appliquer le TXT fourni par Google dans le DNS, puis valider. Alternative Préfixe d’URL : `https://emi-pulse.fr/`, balise HTML ; mettre le véritable token dans `GOOGLE_SITE_VERIFICATION` côté hébergeur, puis valider après rechargement.
3. Envoyer `https://emi-pulse.fr/sitemap.xml` dans « Sitemaps » et vérifier le résultat de traitement. [Instructions Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
4. Inspecter l’accueil et un article, puis consulter l’indexation et les Core Web Vitals. La disponibilité du sitemap ne prouve pas sa soumission.

Restent donc des opérations de compte/hébergement, la validation mobile/CWV et le travail éditorial d’Émilie. Le code seul ne peut pas rendre ces points terminés.
