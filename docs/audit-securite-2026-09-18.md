# Audit de sécurité — Emi’Pulse

Rapport du 18 septembre 2026. Code examiné : commit `c3a8130` et fichiers présents dans le projet. Observations HTTP réalisées le 17 septembre 2026, vers 18:10 UTC. Aucun correctif applicatif n’a été appliqué dans cet audit.

## Conclusion

**Le site nécessite des corrections prioritaires avant de pouvoir être considéré suffisamment durci.** Le problème le plus urgent combine l’absence de vérification CSRF et une réécriture des méthodes HTTP qui accepte les requêtes GET. Un administrateur connecté peut ainsi être amené à déclencher une action destructive par navigation vers une URL préparée.

Autres priorités : arrêter la journalisation des mots de passe, éliminer les identifiants par défaut, protéger toutes les routes d’inscription et de contact, corriger la limitation des connexions et révoquer les sessions devenues invalides.

Ce rapport n’est ni une garantie d’absence de faille, ni une certification, ni un test d’intrusion exhaustif de l’hébergement. Les vulnérabilités des dépendances n’ont pas pu être vérifiées auprès du registre npm, faute d’autorisation explicite de transmission de leurs métadonnées.

## Périmètre et méthode

Examen de l’entrée Express, routes montées, middlewares, contrôleurs, modèles, validation, vues EJS, services d’email et d’images, configuration, scripts de déploiement et inventaire Git. Lecture de quatre réponses publiques : HTTP `/`, HTTPS `/`, `/auth` et `/admin/dashboard`, sans compte connecté.

Cinq vérifications isolées ont exécuté de petits extraits du code avec objets fictifs : réécriture des méthodes, rate limiting, garde administrateur, clôture de transaction et génération HTML OpenGraph. Aucun modèle réel ni connexion à la base n’a été chargé pour ces tests.

Aucun POST, PUT ou DELETE envoyé au site ; aucune création de compte, récupération de mot de passe, inscription newsletter ou émission d’email ; aucun upload, scan de charge ou essai de mot de passe. Aucun script de migration, seed, reset ou déploiement exécuté. Les seules écritures sont les fichiers locaux de travail et ce rapport. Les lectures publiques ordinaires peuvent créer des sessions anonymes selon le fonctionnement actuel du site.

**Niveaux :** P0 = à traiter immédiatement ; P1 = prochaine livraison de sécurité ; P2 = durcissement planifié. Ils reflètent l’impact et les conditions observées, pas un score CVSS calculé.

## Tableau des priorités

| ID | Priorité | Constat | Niveau de preuve |
|---|---|---|---|
| S01 | P0 | CSRF absent + GET transformable en action destructive | Code et test isolé |
| S02 | P0 | Mots de passe et liens sensibles journalisés | Code ; exposition effective des logs non établie |
| S03 | P0 si utilisés, sinon P1 | Identifiants admin codés en dur et secret de session de secours | Code ; configuration réelle inconnue |
| S04 | P1 | Contournement de limitation par routes alternatives et casse des emails | Code et test isolé |
| S05 | P1 | Sessions non révoquées après suppression/changement de mot de passe | Code et test isolé |
| S06 | P1 | Récupération de compte incohérente et insuffisamment durcie | Code ; parcours réel non exercé |
| S07 | P1 | En-têtes de protection incomplets | Code et réponses publiques |
| S08 | P1 | Transactions laissées ouvertes dans la suppression d’utilisateur | Test avec transaction fictive |
| S09 | P1 | Désinscription newsletter sans preuve de possession | Code |
| S10 | P1/P2 | Encodage HTML/JavaScript insuffisant dans certains contextes | Code ; test inerte OpenGraph |
| S11 | P1 | Originaux d’upload dans un dossier public, nettoyage incomplet | Code ; emplacement production inconnu |
| S12 | P2 | Validation, modération et consommation de ressources à renforcer | Code |
| S13 | P2 | Configuration et déploiement fragiles | Code et inventaire Git |
| S14 | À compléter | Dépendances, système, base, sauvegardes, DNS | Accès ou autorisation supplémentaires nécessaires |

## S01 — CSRF et réécriture des méthodes : priorité immédiate

**Sources :** `index.js:117`, `index.js:156`, `routes/admin-article-router.js`, `routes/admin-categorie-router.js`, `routes/admin-comment-router.js`, `routes/admin-user-router.js`.

Le serveur génère `csrfToken` et plusieurs formulaires transmettent `_csrf`, mais aucun middleware monté ne compare le jeton reçu à celui de la session. Le paquet installé `csurf` n’est pas utilisé. La présence d’un champ caché n’apporte donc aucune vérification.

Le middleware lit `_method` depuis la query string ou le corps, puis remplace `req.method` sans vérifier la méthode initiale ni appliquer une liste autorisée. Le test local confirme qu’un GET devient DELETE. Les routes de suppression administrateur lisent l’identifiant dans le chemin et sont donc atteignables par ce mécanisme. La session admin reste nécessaire : ce n’est pas un accès administrateur anonyme.

`SameSite=Lax` réduit certaines attaques, mais permet l’envoi du cookie lors d’une navigation principale GET provenant d’un autre site. Il ne neutralise donc pas cette combinaison. Aucune suppression réelle n’a été tentée.

**Corrections :** refuser toute réécriture de GET/HEAD ; autoriser uniquement POST vers PUT/DELETE si cette compatibilité est conservée ; refuser les types non textuels et valeurs inattendues ; vérifier un jeton lié à la session avant chaque mutation, après résolution contrôlée de la méthode et avant les traitements coûteux. Pour les uploads, coordonner lecture multipart, contrôle CSRF et nettoyage : un jeton supprimé par `stripUnknown` ou lu après traitement des images ne suffit pas. Passer la déconnexion en POST protégé. Ajouter Origin/Fetch Metadata en défense complémentaire.

**Validation :** sur une base de test jetable, GET et HEAD restent sans effet quelles que soient les queries ; jeton absent, invalide ou issu d’une autre session → 403 et zéro mutation ; formulaires et likes légitimes continuent à fonctionner.

Référence : [OWASP — prévention CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## S02 — Secrets dans les journaux

**Sources :** `controllers/auth-controller.js:42`, `index.js:148`, `middleware/rateLimit.js`, `services/email.js`.

L’inscription journalise `req.body` avant traitement : `password` et `password_confirm` y figurent. Le journal global écrit l’URL complète, incluant les tokens dans `/auth/reset/:token` et `/newsletter/confirm/:token`. Le limiteur répète également certaines URL. Des fichiers de logs sont suivis dans Git.

La lecture ciblée des logs actuels n’a pas retrouvé les motifs de mots de passe ou tokens recherchés ; cela ne prouve pas leur absence dans les anciens logs, les services d’hébergement ou l’historique Git. Aucun secret réel n’est reproduit ici.

**Corrections :** supprimer les logs de corps de requêtes d’authentification ; journaliser le nom logique des routes en masquant tokens, cookies, mots de passe et données personnelles ; désactiver le debug SMTP en production ; restreindre l’accès et la durée de rétention. Examiner les journaux de production ; si une exposition est confirmée, révoquer les secrets concernés et organiser la réinitialisation des mots de passe affectés. Retirer les logs du suivi Git, puis traiter l’historique dans une opération distincte et revue.

**Validation :** des valeurs sentinelles de mot de passe et token, sur environnement isolé, ne doivent jamais apparaître dans les sorties applicatives, proxy ou collecte centralisée.

## S03 — Secrets de secours et comptes administrateur prévisibles

**Sources :** `index.js:100`, `config/createAdmin.js:12`, `seeds/seed.js:23`, `test-login.js:23`.

Un secret de session fixe est utilisé si `SESSION_SECRET` manque. Les scripts de création/seed admin contiennent des mots de passe littéraux ; le test de login en contient également un. Leur utilisation actuelle en production n’a pas été vérifiée. Un secret de signature connu ne permet pas à lui seul de choisir arbitrairement une session serveur existante, mais dégrade une protection essentielle.

**Corrections :** refuser le démarrage production sans secret aléatoire suffisamment robuste, stocké dans les variables sécurisées de l’hébergeur. Retirer les mots de passe littéraux et les comptes de démonstration du processus de livraison ; créer l’administrateur par invitation ou secret temporaire unique. Si l’un de ces mots de passe a servi réellement, le changer et invalider les sessions associées. Activer MFA pour les administrateurs et pour les comptes hébergeur/Git/email.

**Validation :** environnement production sans secret → arrêt explicite ; aucun credential de compte actif dans le dépôt ; ancien credential inutilisable après rotation.

## S04 — Protection antibot incomplète

**Sources :** `routes/index.js:21`, `routes/index.js:22`, `routes/auth.js`, `middleware/rateLimit.js:3`, `middleware/rateLimit.js:91`, `ecosystem.config.cjs`.

`POST /auth/register` a un limiteur, mais `POST /register` appelle directement le même contrôleur. Le formulaire de contact `/renseignements` n’a pas de limitation applicative : un attaquant peut multiplier les emails vers votre boîte. Aucun essai d’envoi n’a été effectué.

Le login compte par email brut, alors que l’authentification normalise ensuite cet email. Le test confirme que changer sa casse permet d’obtenir un nouveau compteur après blocage. Des adresses différentes évitent également toute limite globale par IP. Le compteur par compte seul peut permettre de bloquer délibérément un utilisateur.

Tous les limiteurs partagent une même Map, sans séparation logique de leurs clés. Les compteurs peuvent interférer entre actions. Ils restent locaux à chaque processus alors que la configuration PM2 prévoit plusieurs workers ; le redémarrage les efface.

**Corrections :** unifier les routes d’inscription ; appliquer une limitation aux deux alias, au contact, à la récupération et aux renvois newsletter ; combiner IP/sous-réseau et compte normalisé, avec seuils et délais progressifs ; utiliser un stockage partagé si plusieurs workers ; séparer les clés par action ; borner les compteurs en mémoire ; ajouter quotas d’email et protection antibot graduelle. Vérifier la chaîne des proxies avant de faire confiance à l’IP transmise.

**Validation :** mêmes plafonds pour emails équivalents et routes équivalentes ; compteurs cohérents entre workers ; limitation par IP avec emails variés ; pas de blocage indu entre like et connexion.

## S05 — Autorisations périmées dans les sessions

**Sources :** `middleware/auth.js:isAdmin`, `index.js:128`, `controllers/auth-controller.js:184`, `controllers/password-reset-controller.js:162`, `controllers/admin-user-controller.js`.

Le rôle et l’identité sont copiés dans la session à la connexion. Les requêtes suivantes font confiance à cette copie, sans vérifier que le compte existe encore ou possède toujours le rôle. La suppression d’un compte et la réinitialisation du mot de passe n’invalident pas ses autres sessions. Un compte admin supprimé peut conserver ses droits jusqu’à expiration de sa session.

**Corrections :** relire l’utilisateur et son statut avant les opérations sensibles ; stocker essentiellement son identifiant et une version de session ; invalider toutes ses sessions après suppression, changement de mot de passe ou de rôle ; prévoir déconnexion globale, durée d’inactivité et réauthentification des opérations critiques.

**Validation :** compte désactivé/supprimé/rétrogradé → session existante immédiatement refusée ; anciennes sessions invalides après récupération de compte. La régénération actuelle de session au login est une bonne protection à conserver.

## S06 — Récupération de compte à remettre en cohérence

**Sources :** `controllers/password-reset-controller.js:45`, `:55`, `:61`, `:93`, `:149`, `models/User.model.js`, `migrations/05.add-password-reset.js`.

Le contrôleur manipule `reset_token` et `reset_token_expiry`, absents du modèle Sequelize `User`. La migration historique vise en plus `USER`, alors que le modèle utilise `users`. Le parcours de récupération ne peut pas être considéré validé : les mises à jour des attributs inconnus ne sont pas fiables et le schéma réel n’a pas été inspecté.

Le code prévoit de stocker le token en clair, utilise des messages distincts selon l’existence du compte, et construit l’URL depuis `Host` si `APP_URL` manque. Ce dernier point présente un risque conditionnel d’empoisonnement du lien si le frontal accepte un Host non prévu. Lecture puis consommation du token ne sont pas atomiques.

**Corrections :** aligner le modèle et une migration additive avec le schéma réellement déployé ; stocker seulement le hash du token ; conserver expiration et usage unique, consommé atomiquement ; URL HTTPS canonique obligatoire, indépendante du Host reçu ; réponse générique identique avec délais maîtrisés ; révocation des sessions après succès. Ne jamais recréer les tables pour ce correctif.

**Validation :** tester demande, expiration, invalidité et double consommation simultanée sur environnement isolé ; vérifier que le token brut ne se trouve ni en base ni dans les logs ; lien toujours sur le domaine officiel.

Référence : [OWASP — récupération de mot de passe](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## S07 — Protections HTTP présentes dans un fichier mais non branchées

**Sources :** `index.js`, `middleware/security.js`, `config/production.js`. Les utilitaires Helmet/HSTS de sécurité ne sont pas montés dans l’application examinée.

Observations publiques :

| Contrôle | Résultat observé |
|---|---|
| HTTP `/` | Redirection 301 vers HTTPS |
| HTTPS | Réponse obtenue avec vérification TLS normale de curl |
| Cookie `sid` | `Secure`, `HttpOnly`, `SameSite=Lax` présents |
| `/admin/dashboard` sans session | 302 vers `/auth` |
| CSP | Seulement `upgrade-insecure-requests` |
| HSTS | Non présent dans les réponses observées |
| `X-Content-Type-Options`, `X-Frame-Options` | Non présents |
| `Referrer-Policy`, `Permissions-Policy` | Non présents |
| `/auth` : `Cache-Control` | Non présent |
| `/admin/dashboard` : `Cache-Control` | `no-cache, no-store, must-revalidate, max-age=0` |
| `X-Powered-By` | `Express` exposé |

La directive CSP actuelle ne restreint pas l’exécution de scripts ni l’intégration du site dans une iframe. La protection contre le clickjacking est donc insuffisante sur les pages observées. L’absence d’en-tête Referrer-Policy ne signifie pas que tous les navigateurs transmettent toutes les URL ; leur valeur par défaut intervient.

**Corrections :** brancher Helmet avant les routes et les fichiers statiques ; retirer `X-Powered-By` ; ajouter `nosniff`, politique de référent et `frame-ancestors` ; configurer HSTS après validation HTTPS des domaines concernés. Déployer la CSP d’abord en Report-Only, externaliser les scripts/handlers inline ou utiliser des nonces ; autoriser précisément les ressources nécessaires, notamment polices et vidéos. Mettre `no-store` sur auth, reset et pages personnalisées/admin.

**Attention :** ne pas brancher aveuglément `addSecurityHeaders` : sa branche générale définit `public, max-age=3600, s-maxage=3600` alors que les pages contiennent des informations de session et des jetons CSRF. Cela pourrait créer un risque de cache partagé. Vérifier frontal et application ensemble.

**Validation :** en-têtes sur succès, erreurs et ressources ; connexion, formulaires, vidéos et thème fonctionnels sous CSP ; impossibilité d’embarquer l’administration depuis une autre origine.

## S08 — Épuisement du pool de connexions par transaction abandonnée

**Source :** `controllers/admin-user-controller.js:8`.

Une transaction est ouverte avant validation ; plusieurs retours anticipés ne font ni commit ni rollback : identifiant invalide, auto-suppression, utilisateur absent, dernier admin. Le test sur transaction fictive confirme le chemin « identifiant invalide ». La route est réservée à l’administrateur, mais S01 peut accroître son exposition.

**Corrections :** valider ce qui peut l’être avant l’ouverture ; utiliser une transaction gérée avec résultat contrôlé et clôture garantie ; verrouiller si nécessaire le contrôle du dernier admin pour éviter les courses concurrentes. Ne pas simplement retourner une réponse HTTP au milieu d’une transaction ouverte.

**Validation :** tous les chemins libèrent la connexion ; répétitions sur base de test ne réduisent pas le pool ; deux suppressions concurrentes ne contournent pas la conservation d’un administrateur.

## S09 — Désinscription newsletter sans authentification du demandeur

**Source :** `controllers/newsletter-controller.js:184`.

La connaissance d’une adresse suffit pour supprimer son abonnement. Le message « Email non trouvé » permet aussi de distinguer certaines adresses inscrites. Le double opt-in à l’inscription est présent et constitue un point positif ; il ne protège pas la désinscription.

**Corrections :** utiliser un token opaque propre à l’abonnement ou un lien signé à périmètre limité, sans imposer la connexion ; réponses génériques ; renvois plafonnés par adresse et IP ; tokens de confirmation avec expiration et conservation minimale des demandes non confirmées.

**Validation :** email seul → aucune suppression ; token d’un autre abonné → refus ; lien valide → désinscription simple et idempotente. Aucun abonnement réel supprimé lors de l’audit.

## S10 — Encodage des sorties et contenus externes

Plusieurs cas doivent être distingués ; aucune XSS anonyme persistante n’a été démontrée sur le site réel.

1. **Nom de catégorie dans `onclick`**, `views/admin-categories.ejs:49` : `<%=` encode pour HTML, mais les entités sont décodées avant interprétation du JavaScript du handler. Une apostrophe dans le nom peut casser le code ; une valeur construite à cet effet peut y injecter du JavaScript. Écriture actuellement réservée à l’administrateur. Remplacer par `data-*` et un listener externe, sans construire du JavaScript avec les données.
2. **Helpers HTML**, `services/imageHelper.js:generateOpenGraphImage`, `views/partials/head.ejs:15`, `controllers/article-controller.js:buildContentHtml` : des valeurs sont interpolées dans des attributs puis rendues par `<%-`. Le test avec marqueur inerte confirme l’absence d’encodage dans OpenGraph. Les chemins d’image créés par le contrôleur sont générés côté serveur ; `image_alt` n’est pas actuellement exposé comme champ du modèle Article. L’exploitabilité publique de cette voie n’est donc pas établie. Encoder systématiquement les attributs, préférer les vues EJS échappées et valider les chemins.
3. **Email de contact**, `services/email.js:409-445` : les variables dites « safe » sont seulement trimées avant interpolation HTML. Un visiteur peut injecter du contenu HTML trompeur dans les messages reçus par l’équipe. Cela ne prouve pas l’exécution de scripts dans le client mail. Encoder les valeurs utilisateur dans le HTML ; garder une alternative texte.
4. **CSV newsletter**, `controllers/admin-newsletter-controller.js:exportSubscribersCSV` : guillemets non doublés, aucune neutralisation des formules. Un nom fourni par un utilisateur peut altérer la structure ou être interprété par un tableur si associé à un abonnement exporté. Employer une sérialisation CSV correcte et neutraliser les préfixes de formule selon le format cible. Tester guillemets, retours ligne, `=`, `+`, `-`, `@`, tabulations.
5. **Vidéos**, `utils/videoHelper.js` : détection par sous-chaîne plutôt que hostname/protocole exacts. Une URL contenant le nom d’un fournisseur peut être traitée comme iframe sans provenir de celui-ci. Analyser avec `URL`, limiter à HTTPS et aux domaines exacts, valider les IDs puis reconstruire l’URL ; restreindre `frame-src` et les permissions iframe.

Les textes d’articles sont échappés avant génération de paragraphes et les commentaires sont généralement rendus avec `<%=` : à conserver. Ne pas remplacer globalement ces sorties par du HTML brut.

Référence : [OWASP — encodage selon le contexte](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

## S11 — Uploads, originaux et ressources

**Sources :** `utils/uploadPaths.js:7`, `index.js:84`, `config/multer.js`, `services/image.js:processImage`, `:isValidImage`.

Le répertoire temporaire par défaut est `public/uploads/tmp`, servi par les fichiers statiques. Les originaux ne sont pas supprimés après traitement réussi et plusieurs erreurs laissent également des fichiers. Ils peuvent donc rester publiquement adressables si leur nom est connu ; l’absence de listing limite la découverte mais ne rend pas le dossier privé. La configuration réelle de `TEMP_DIR` n’a pas été obtenue.

Le MIME provient du client. Sharp vérifie réellement le format et réencode en WebP, ce qui est positif, mais `isValidImage` autorise SVG alors que le filtre MIME ne le prévoit pas. Un SVG déclaré comme PNG peut franchir cette incohérence si le décodeur l’accepte. L’original ne doit jamais devenir un contenu actif public ; le type de réponse et le navigateur influencent ce risque.

**Corrections :** stockage temporaire hors racine publique, aléatoire robuste, permissions minimales ; suppression en `finally` des originaux et nettoyage des variantes orphelines après erreur de validation ; liste de formats cohérente ; limites explicites de pixels, dimensions, frames, champs, parties multipart et concurrence. Sharp a des limites par défaut, mais elles ne remplacent pas des plafonds adaptés au site. Servir uniquement les variantes réencodées avec type précis et `nosniff`.

**Validation :** fichiers invalides, MIME mensonger, trop volumineux et dimensions excessives refusés ; aucun original conservé/publié après succès ou échec ; aucun chemin arbitraire accessible.

Référence : [OWASP — uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## S12 — Validation et disponibilité

- `middleware/validate.js` affiche `new-article` pour toute validation HTML en erreur, même login/newsletter/commentaire. Cela ne donne pas les droits admin, mais révèle une interface inadaptée et ne constitue pas une gestion sûre des données saisies. Prévoir une vue par formulaire ; ne jamais réinjecter les mots de passe dans `formData`.
- Le commentaire de la route annonce modération, mais `controllers/article-controller.js:postComment` approuve tout utilisateur connecté. L’inscription ne vérifie pas la possession d’email : un compte jetable peut publier directement. Confirmer la politique voulue ; sinon modérer tous les comptes non approuvés et vérifier l’email.
- La recherche n’a pas de limite de longueur applicative ni de limite de fréquence ; `%terme%` sur le contenu peut coûter cher. `utils/pagination.js` n’impose pas de maximum raisonnable aux offsets. Borner les entrées, mesurer les requêtes, indexer/repenser la recherche et limiter les usages abusifs. Aucun test de charge effectué.
- Chaque visite initialise un token CSRF en session, même anonyme ; un trafic automatisé peut gonfler la table des sessions. Créer les sessions seulement quand nécessaires, contrôler leur expiration et limiter le trafic au frontal.
- Les likes font « recherche puis création puis incrément » sans transaction d’ensemble ; contraintes uniques réellement déployées à vérifier. Prévoir unicité adaptée et mise à jour atomique. Ne pas traiter une IP comme une identité forte ; fixer une durée de conservation.

## S13 — Configuration, dépôt et exploitation

`config/database.js` charge `.env` avec `override: true`, ce qui peut remplacer les variables de l’hébergeur. Cela peut notamment modifier `NODE_ENV` et donc les options de cookies/erreurs. Faire primer les variables de production, valider strictement la configuration au démarrage, unifier `APP_URL`/`SITE_URL` et fixer les domaines autorisés.

L’inventaire Git contient **4 776 fichiers sous `node_modules/`**, malgré `.gitignore`. Cela nuit à la reproductibilité et peut livrer des fichiers divergents du lockfile. Le premier essai de prévisualisation précédent avait rencontré une dépendance locale incomplète ; l’audit ne conclut pas que la production partage ce défaut. Retirer les dépendances du suivi dans une opération dédiée et utiliser une installation reproductible depuis un lockfile revu.

`middleware/security.js`, certaines protections et routes média existent mais ne sont pas toutes montées. Un fichier présent ou un paquet installé ne prouve pas qu’une protection fonctionne. Centraliser l’initialisation et tester les routes réellement accessibles. Le nettoyage média non monté ne compte pas comme faille publique active ; avant activation, vérifier aussi `image_inline` pour ne pas supprimer des images encore utilisées.

`migrations/01.create-tables.js` utilise `sync({ force: true })` et les scripts npm proposent des resets. Le script de déploiement lance des migrations automatiquement et des commandes PM2 globales. Séparer bootstrap de démonstration et production ; interdire les resets en production ; revue des migrations, sauvegarde/restauration testée, compte DB de migration distinct. `sessionStore.sync()` au démarrage est à remplacer à terme par une migration contrôlée afin de limiter les droits du compte applicatif ; ce sync n’est pas présenté ici comme un reset destructeur.

Aucune de ces commandes n’a été exécutée pendant l’audit.

## S14 — Vérifications non terminées et limites

**Dépendances.** Versions du lockfile relevées : Express 5.1.0, Multer 2.0.2, Nodemailer 7.0.11, Sequelize 6.37.7, Sharp 0.34.5, csurf 1.11.0, Helmet 8.1.0, Joi 18.0.1, express-session 1.18.2, connect-session-sequelize 7.1.7, Argon2 0.44.0. Une version seule ne permet pas de déclarer une vulnérabilité exploitable.

`npm audit --omit=dev --json` n’a pas abouti : réseau bloqué initialement, puis revue automatique refusant l’envoi des noms/versions au registre officiel sans accord explicite. Ne pas interpréter cela comme « zéro vulnérabilité ». L’accord demandé reste nécessaire ; aucun autre service n’a été utilisé pour contourner ce refus. Après autorisation : audit production et développement, analyse des chemins réellement atteignables, mises à jour ciblées et tests. Pas de `npm audit fix --force` automatique.

**Hébergement et base.** Non inspectés : variables secrètes réelles, droits SQL, TLS SQL si accès distant, version Node de production, patchs OS, exposition réseau de MySQL/Node, configuration exacte des proxies/CDN, comptes Hostinger/SSH, sauvegardes et restaurations, supervision, rétention des journaux, accès au dépôt. Vérifier MFA, moindre privilège, ports non publics, suppression des services inutiles, HTTPS/TLS et limites de trafic au frontal.

**Emails et données personnelles.** SPF/DKIM/DMARC, protection du compte SMTP, chiffrement obligatoire du transport SMTP, quotas et réputation d’envoi restent à vérifier. Définir durée de conservation des emails, IP, sessions, commentaires et logs, procédure de suppression/export, accès aux sauvegardes et sous-traitants. Ce rapport n’est pas une validation juridique RGPD.

**Tests complémentaires.** Pas de tests authentifiés sur production, pas de revue exhaustive de l’historique Git, pas de scan de tous les chemins sensibles, pas de démonstration XSS active, pas de charge ni de test TLS complet. Planifier ces contrôles sur une préproduction et des données fictives.

## Points positifs à préserver

- Argon2 utilisé pour les mots de passe ; mot de passe exclu du scope User par défaut.
- Régénération de l’identifiant de session à la connexion.
- Cookie réellement observé avec Secure, HttpOnly et SameSite=Lax.
- Vérification admin sur les routes d’administration montées ; redirection anonyme confirmée sur le dashboard.
- Inscription imposant le rôle `visiteur`, sans reprendre un rôle fourni par le client.
- ORM Sequelize et filtres structurés : aucune injection SQL directe confirmée dans les parcours examinés ; les `literal` repérés pour le tri sont constants.
- Validation Joi sur plusieurs formulaires, limite upload de 5 Mo, contrôle par décodeur et génération WebP.
- Confirmation newsletter aléatoire et textes généralement échappés ; XML des flux encodé.

## Ordre de mise en œuvre recommandé

1. **Lot urgent :** S01, arrêt des logs de secrets, vérification/rotation des mots de passe admin par défaut et validation obligatoire du secret de session. Tester d’abord sur données fictives.
2. **Lot comptes et disponibilité :** unification des routes, limiteurs, révocation des sessions, récupération de compte, transactions toujours clôturées et désinscriptions authentifiées.
3. **Lot navigateur et fichiers :** en-têtes/CSP, encodages contextuels, CSV, URLs vidéo, temporaires privés et nettoyage garanti.
4. **Lot exploitation :** audit de dépendances autorisé, livraison reproductible, migrations non destructives, moindre privilège, MFA, sauvegardes/restauration et alertes.

Pour chaque lot : sauvegarde préalable, revue du diff, tests d’autorisation et de refus, recette des formulaires et uploads, déploiement contrôlé, puis nouvelle lecture des en-têtes et observation des erreurs. Toute migration proposée doit être additive et revue ; ne jamais lancer `db:reset`, `db:create`, seed ou `sync({ force: true })` sur la base de production.

La sécurité doit ensuite être entretenue : veille de dépendances, surveillance des connexions et actions admin, vérification régulière des sauvegardes et nouvel audit lors d’une évolution sensible.
