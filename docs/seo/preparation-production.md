# Préparation production — aucun déploiement autorisé

Audit du 25 septembre 2026. Ce document remplace les anciennes consignes de migration pour la livraison actuelle.

## Conclusion

Tests et build : validés. Déploiement avec garantie « aucune modification de la base » : **non validé en l’état**.

Aucun push, commit, redémarrage, changement hPanel, import SQL, migration, seed ou reset n’a été exécuté pendant cette préparation. Aucun accès à la base réelle ni nouvelle requête vers le blog public n’a été effectué pendant cette préparation.

## Hébergement confirmé par le propriétaire

- Domaine : `https://emi-pulse.fr`.
- Hostinger, application Node.js / Express, dépôt `BLOG`.
- Branche déployée : `dev` ; racine : `./` ; Node : `22.x`.
- Dernier déploiement indiqué : 25 septembre 2026 à 13:09 ; commit `dfe13ddd` (« refactor style newsletter »).
- Paramètres de compilation/sortie : personnalisés. Les commandes exactes restent à confirmer dans hPanel.
- **Valeur serveur confirmée par le propriétaire : `SEO_MIGRATION_ON_START=1`. La migration automatique reste donc autorisée si le contrôle détecte un schéma incomplet.**
- Le projet documente un redéploiement automatique au push. Traiter **tout push vers dev comme un déploiement potentiel**.

Ce n’est pas la procédure VPS/SSH/PM2 du vieux README. Ne pas utiliser `npm run deploy:production` ni les commandes PM2 pour cette application Hostinger managée.

## Vérifications réalisées localement

- `npm test` : **60 tests réussis, zéro échec**. Modèles et bases simulés, test HTTP sur loopback. Les tests d’images ne manipulent que leurs propres fichiers temporaires.
- `NODE_ENV=production npm run build` : réussi sous Node 22.19.0 / npm 10.9.3, avec les dépendances locales déjà installées.
- Assets traités : 228 441 → 160 070 octets, soit environ −30 % avant compression HTTP.
- 16 entrées de manifeste contrôlées : fichiers présents, empreintes SHA-256 correctes.
- `git diff --check` : aucun problème.
- Pas de test de démarrage de l’application avec la base réelle. Pas de validation d’une installation neuve sur Linux/Hostinger.

Le build importe seulement esbuild, fs, crypto et path. Il ne charge ni `.env`, ni modèles, ni Sequelize, ni `index.js`. Il conserve les anciens assets. Aucun hook npm racine `preinstall`, `postinstall`, `prepare`, `prebuild`, `postbuild` ou `prestart` n’est configuré. Les dépendances argon2, esbuild, fsevents et sharp ont des scripts d’installation de paquets ; ce ne sont pas des migrations applicatives.

## Risques d’écriture réellement présents

### 1. Migration conditionnelle au démarrage

`npm start` appelle `node index.js`, puis `prepareSeoDeployment(sequelize)`.

- Schéma prêt : contrôle seulement (colonnes, index, slugs manquants).
- Schéma incomplet + `SEO_MIGRATION_ON_START=1` : exécution de la migration 13, avec ajouts de colonnes/index et remplissage de slugs.
- Schéma incomplet + variable absente/0 : refus de démarrage.

**`SEO_MIGRATION_ON_START=0` est nécessaire pour exclure cette migration, mais ne bloque pas les écritures normales de l’application.** Le chemin de migration existe toujours dans le code ; il n’a pas été supprimé pendant cet audit.

Le script `scripts/deploy.js` n’appelle pas directement de migration, mais il démarre `index.js` via PM2 : il ne peut donc pas garantir à lui seul un démarrage sans migration. Son message « sans opération de schéma » est insuffisant.

### 2. Sessions en base

`index.js` initialise `connect-session-sequelize`, avec `checkExpirationInterval: 15 * 60 * 1000`.

- Le constructeur démarre une minuterie supprimant les sessions expirées.
- Une visite HTML peut créer/modifier une session : le middleware CSRF renseigne `req.session.csrfToken`, même pour un visiteur anonyme.
- Les connexions, formulaires, likes, commentaires et actions administrateur peuvent aussi écrire dans leurs tables respectives.

Même un contrôle HTTP avec GET ne garantit donc pas une base inchangée. Le précédent audit public était sans édition de contenu ni accès SQL direct, mais ne garantissait pas l’absence d’effets sur les sessions. Aucun contrôle HTTP du blog n’a été relancé dans cette préparation stricte.

**Si « totalement intacte » inclut toutes les lignes de toutes les tables, y compris les sessions, l’application actuelle ne satisfait pas cette contrainte une fois démarrée.** Il faudrait préparer un fonctionnement réellement en lecture seule, ou convenir explicitement d’un périmètre limité à la préservation du schéma et des contenus. Aucune de ces interprétations n’est imposée au propriétaire ; le démarrage reste bloqué sous la contrainte actuelle.

### 3. Commande de statut trompeuse

`npm run migrate:status` appelle `ensureMigrationsTable()`, qui peut créer la table `migrations`. Ce n’est **pas** un contrôle strictement en lecture seule.

## État Git avant ajout de ce document

Branche locale `dev`, suivie par `origin/dev`. Aucun changement indexé. 26 fichiers suivis modifiés et 28 nouveaux fichiers, dont 19 fichiers dans `public/assets` (16 actifs, manifeste et deux anciennes variantes conservées).

Les changements concernent le SEO, l’éditeur, les images, la minification, les tests et la documentation. `package.json` et `package-lock.json` ajoutent esbuild en dépendance de développement.

Aucun changement en attente dans `BDD/`, `migrations/`, `models/`, `recreate_all_tables.sql`, `config/database.js` ou `services/seoDeployment.js`. Les fichiers SQL ouverts dans l’IDE ne sont pas exécutés par le build.

`.env`, les uploads et les logs sont exclus de Git. Ne pas utiliser `git add -f`. Ce document et les avertissements documentaires ajoutés pendant cette préparation s’ajoutent à cet inventaire.

## Commandes locales autorisées pour préparer, sans déployer

Depuis `/Users/ben/Developer/BLOG-fresh` :

```sh
git status --short
npm test
NODE_ENV=production npm run build
git diff --check
git diff --stat
git ls-files --others --exclude-standard
```

Elles ont déjà été vérifiées ici. Ne pas lancer `npm start`, `npm run dev`, `node index.js` ou une commande PM2 pour « tester le build » : cela démarre une application reliée à sa base configurée.

Si une installation locale neuve devient nécessaire, `npm ci --include=dev` installe les dépendances et remplace `node_modules`. Aucun script applicatif de base n’est appelé par le package racine. Ne pas utiliser `--omit=dev` avant le build, car esbuild est une dépendance de développement. Cette installation neuve n’a pas été exécutée pendant l’audit.

## Procédure Hostinger préparée — à ne pas lancer maintenant

1. Consulter les paramètres hPanel sans enregistrer ni cliquer sur Redéployer. Confirmer les commandes personnalisées d’installation/build/démarrage. La variable de migration est actuellement à 1 : préparer son passage à 0 avant la future mise en ligne, sans provoquer de redéploiement non autorisé. Les boutons d’application des réglages peuvent proposer un redéploiement.
2. Lever le blocage « aucune écriture » décrit ci-dessus avant toute mise en ligne. Avec l’exigence actuelle, ne pas continuer jusqu’au démarrage.
3. Avant une future autorisation : conserver une sauvegarde existante vérifiée de la base et des uploads. Ne pas importer/restaurer de SQL pendant cette livraison. Confirmer la persistance de `STATIC_DIR` : Hostinger crée un nouveau dossier de build à chaque déploiement, et `public/uploads` est hors Git. Ne pas remplacer un chemin persistant par un répertoire vide.
4. Réglages de compilation proposés pour cette livraison, à comparer aux réglages réels : Express, Node 22.x, racine `./`, installation `npm ci --include=dev`, build `npm run build`. Le projet doit rester une application Express complète ; ne pas remplacer sa racine par `public/assets` et ne pas inventer un dossier `dist`.
5. La commande de démarrage du projet est `npm start` (ou `node index.js` si Hostinger utilise le point d’entrée). **Cette étape accède à la base et entraîne les risques décrits ; elle n’est pas autorisée ici.** Conserver `APP_URL=https://emi-pulse.fr`, `NODE_ENV=production`, les variables DB/session/SMTP/uploads existantes et le port géré par Hostinger. `SEO_MIGRATION_ON_START=0` doit être effectif avant le démarrage.
6. Préparer le commit local seulement après relecture. Commandes proposées, non exécutées :

   ```sh
   git add README.md config/multer.js config/article-redirects.js config/article-series.js controllers/article-controller.js index.js package.json package-lock.json public/css/8-pages-article.css public/css/9-pages-admin.css public/js/article-content.js public/js/article-editor.js public/robots.txt public/assets tests/security.test.js tests/seo.test.js tests/article-editor-tools.test.js utils/seo.js utils/assets.js views docs/seo scripts/audit-public-seo.js scripts/build-assets.js
   git diff --cached --check
   git diff --cached --stat
   git diff --cached --name-only
   git commit -m "Finalise SEO et prepare le deploiement Hostinger"
   ```

   Les chemins de répertoires doivent être relus si d’autres fichiers sont ajoutés entre-temps. Aucun fichier `.env`, upload ou SQL ne doit apparaître dans ce commit.
7. **Après autorisation explicite, résolution des blocages et confirmation des réglages seulement**, la commande exacte de publication pour la branche confirmée est :

   ```sh
   git push origin dev
   ```

   Elle peut déclencher immédiatement installation, build et démarrage sur Hostinger. Ne pas faire un push « pour sauvegarder » en attendant l’autorisation. Si l’autodéploiement est désactivé, utiliser ensuite le déploiement hPanel du commit approuvé, uniquement après autorisation ; ne pas provoquer deux redéploiements.
8. Examiner les journaux sans lancer de correctif de base. Si le schéma est déclaré incomplet : arrêter l’opération et examiner la situation ; ne jamais mettre la variable à 1 pour forcer le démarrage.
9. Contrôles HTTP fonctionnels seulement lorsque les écritures de sessions ont été explicitement prises en compte dans la décision de déploiement. Le script `node scripts/audit-public-seo.js https://emi-pulse.fr` n’écrit pas de SQL, mais ses GET peuvent entraîner des écritures de sessions côté serveur.
10. En cas d’échec, ne pas lancer de rollback SQL. Un retour applicatif nécessite aussi une autorisation et une version compatible avec les brouillons ; il peut redémarrer l’application et ses traitements de sessions.

## Commandes susceptibles de toucher à la base — exclues de cette préparation

| Commande/action | Effet ou risque |
| --- | --- |
| `npm run db:create` | Création de tables / script historique à exclure. |
| `npm run db:seed` | Insertion de données. |
| `npm run db:reset` | Recréation et seed ; potentiellement destructif. |
| `npm run migrate` | Exécution de migrations. |
| `npm run migrate:rollback` | Modification inverse du schéma/données. |
| `npm run migrate:status` | Peut créer la table de suivi. |
| `node scripts/migrate-seo.js --apply` | Colonnes/index/backfill SEO. |
| `node config/createAdmin.js`, scripts de seeds ou migrations | Écritures de compte/données/schéma. |
| Exécution/import des fichiers SQL, dont `recreate_all_tables.sql`, `BDD/MPD/mpd.sql`, `BDD/deploy_production.sql` | Création/modification/suppression selon le script ; tous exclus. |
| `npm start`, `npm run dev`, `node index.js` | Connexion réelle, migration conditionnelle, sessions, routes d’écriture. |
| `npm run deploy:production`, scripts de déploiement et commandes PM2 start/restart/reload | Démarrage indirect de l’application et mêmes risques. |
| `git push origin dev`, Redéployer ou application de réglages hPanel | Peuvent provoquer ce démarrage automatiquement. |
| Visites et tests HTTP des pages HTML | Peuvent créer/toucher des sessions même sans POST. |

`npm run check:env` contacte la base pour l’authentification : non nécessaire, non exécuté. Le script historique `test:production` cible un environnement VPS/.env.production/PM2 et peut appeler une URL locale ; il n’est pas le build de production et n’a pas été utilisé.

## Références de l’hébergeur consultées

- [Réglages et redéploiement Node.js](https://www.hostinger.com/support/how-to-redeploy-a-node-js-application/).
- [Hébergement Node.js, intégration GitHub et dossiers de build](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).
