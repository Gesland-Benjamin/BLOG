# Emi’Pulse : audit et livraison SEO

> Mise à jour : à la demande du propriétaire, les pages À propos et auteur ainsi que le bloc À propos d’Emi ont été retirés. Les anciennes URLs redirigent vers l’accueil et la liste des articles, et sont exclues du sitemap. Le nom réel de l’auteur reste dans les articles et le JSON-LD, sans lien vers une page auteur. Les variables EMI_AUTHOR_EMAIL/EMI_AUTHOR_ID ne sont plus utilisées. Les sections ci-dessous décrivent également l’historique de la livraison initiale.

Audit du code local le 25 septembre 2026. Aucun accès à la BDD, aucune migration exécutée, aucun déploiement. Le schéma effectivement installé et les données de production restent à vérifier par l’exploitant. Les articles, les uploads et les migrations historiques n’ont pas été réécrits.

## Phase A — État initial

- JavaScript ES modules, Express 5.1.0, EJS 3.1.10, Sequelize 6.37.7, Sharp 0.34.5 (versions du verrou npm). Base MySQL par défaut dans `config/database.js`; PostgreSQL est aussi présent et `.env.example` est historiquement configuré pour PostgreSQL. Le moteur réellement déployé n’a pas été interrogé.
- Architecture MVC : `index.js` assemble les routes et middlewares ; `controllers/` lit les modèles `models/` et rend les vues `views/`. CSS en 12 feuilles et JS natif, Bootstrap via CDN/local. Aucun bundler, script build ou lint configuré.
- Modèle Article : table `articles`, `id`, `title`, `content`, `image`, `image_inline`, `video`, `likes`, `user_id`, `categorie_id`, `created_at`, `updated_at`. Alias virtuels français. Aucun slug, titre SEO, description, statut de publication ou table de tags exploité avant ce travail.
- Auteur : relation `Article.belongsTo(User, as: author)`, table `users`, nom, email, rôle. Les comptes ne sont ni recréés ni réattribués. La page Émilie utilise ce compte existant, identifié par configuration serveur.
- Catégories : table `categories`, nom unique et description. La liste réelle ne peut être déduite du code ; aucun nom ni rattachement n’a été modifié. Pas de nouvelles pages de tags.
- Administration : `/admin/dashboard`, `/admin/articles/new`, `/admin/articles/:id/edit`, formulaires POST/PUT et suppression existante. Authentification par session Sequelize, rôles, CSRF, CSP avec nonce, limitation de débit et MFA administrateur. Ces protections sont conservées.
- Éditeur texte maison : échappement HTML, gras/italique, aperçu JS et marqueur `[[IMAGE_INLINE]]`. Pas de conversion massive du contenu enregistré.
- Images : Multer en espace temporaire privé, Sharp, variantes WebP `sm/md/lg`, `fit: inside`, sans agrandissement. Les tailles des presets sont des bornes, pas les dimensions réelles : les anciens `srcset` 600w/1200w de la page détail pouvaient être faux. Les originaux temporaires sont nettoyés par le workflow existant.
- Routes publiques initiales : `/`, `/article`, `/article/:id`, `/article/categorie/:nom`, `/categories`, `/archive/:year/:month`, `/search`, contact, mentions légales ; RSS/Atom et sitemap déjà présents. Likes/commentaires utilisent des POST par ID.
- SEO initial : titres/descriptions simples, OG partiel, canonical des pages génériques vers localhost, robots statique vers localhost, mauvais noms d’attributs `createdAt` dans les flux, dates inventées en fallback dans le sitemap, pas de BlogPosting ni de fil d’Ariane.
- Déploiement : PM2, documentation Hostinger/Nginx, `APP_URL`, proxy HTTPS. Le démarrage actuel authentifie la BDD sans synchroniser les tables. Le script de déploiement courant ne lance pas de migrations.
- Migrations : deux historiques (`migrations/` et `migrations/structured/`), divergences `article`/`articles`, scripts SQL anciens destructifs, scripts reset/seed historiques. Ils n’ont pas été exécutés ou modifiés. Ne pas utiliser la chaîne historique pour cette livraison.

### Risques identifiés et décisions

1. Préserver URLs : route GET existante réutilisée ; ID résolu avant 301 ; formulaires de commentaires et likes restent en ID.
2. Préserver dates : backfill SQL limité au slug vide, `updated_at = updated_at`, aucune écriture `created_at`. Les anciennes dates restent la référence.
3. Ne pas publier de brouillons : ajout d’un statut, `true` par défaut pour tous les contenus déjà publics ; scope public ORM et accès administrateur explicite sans scope.
4. Éviter attribution erronée : aucune hypothèse sur un ID de compte. `EMI_AUTHOR_EMAIL` ou `EMI_AUTHOR_ID` résout Émilie. Aucun email rendu dans la page auteur ou le JSON-LD.
5. Préserver sécurité : JSON-LD échappé et nonce CSP, HTML utilisateur échappé, liens d’éditeur limités aux chemins internes d’article.
6. Conservation du design : composants EJS/CSS existants réutilisés, textes biographiques explicitement à compléter.
7. Performance : plusieurs PNG statiques de centaines de Ko à 2,2 Mo ; 11 copies WebP sans perte ajoutées, tous les PNG sources conservés. Comparaison des pixels visibles automatisée. Total 6 941 102 → 4 195 764 octets (−39,6 %) pour ce groupe, pas une mesure de transfert par page. Compression HTTP activée avec la dépendance déjà installée ; cache statique modéré, HTML avec CSRF toujours privé/no-store. Aucune mesure réelle LCP/INP/CLS n’est revendiquée.
8. L’accueil charge encore les articles des catégories pour son carrousel et son classement par likes. Cette requête et les polices/CSS externes restent des pistes à mesurer en production ; pas de refonte du carrousel ou du système CSS.

## Phases B/C — Implémentation

### Migration dédiée : `migrations/13.article-seo.js`

Ajoute uniquement les colonnes absentes à `articles` :

| Colonne | Définition | Anciens contenus |
| --- | --- | --- |
| slug | VARCHAR(255), nullable, index unique | Rempli si NULL/vide seulement |
| seo_title | VARCHAR(255), nullable | Titre normal en fallback |
| meta_description | VARCHAR(320), nullable | Extrait en fallback |
| image_alt | VARCHAR(255), nullable | Titre en fallback ; colonne préexistante réutilisée |
| is_published | BOOLEAN, défaut true, non nullable | Tous les articles déjà publics restent publiés |
| published_at | DATE, nullable | `created_at` reste la date de publication historique |
| related_article_ids | JSON, nullable | Suggestions par catégorie en fallback |

La migration vérifie les champs de base, refuse des colonnes historiques ambiguës et, sur MySQL/PostgreSQL, refuse les triggers sur `articles` tant qu’ils n’ont pas été examinés. Elle ne comporte aucune opération inverse destructive. L’index unique refuse les doublons préexistants sans les écraser. Le backfill traite 200 lignes à la fois, respecte les slugs déjà renseignés, gère les collisions et peut reprendre après interruption. Les DDL MySQL ne sont pas transactionnels : une interruption peut laisser un schéma partiellement complété, que la relance reprend.

Anciens slugs : titre normalisé + ID, par exemple `arretons-de-tout-normaliser-35`. Nouveaux slugs : titre normalisé + UUID, avec contrainte unique en base pour empêcher tout doublon concurrent. Un changement de titre ne change pas le slug. Une collision UUID exceptionnelle ferait échouer la création au lieu d’écraser un article.

### Comportements livrés

- GET `/article/35` → HTTP 301 vers `/article/<slug>`. Paramètres de pagination/commentaire utiles conservés. Slug inexistant ou brouillon → vraie 404. Article historique sans slug reste lisible pendant la transition.
- Nouveaux liens EJS publics et administrateur utilisent le slug lorsqu’il existe. POST `/article/:id/like` et `/article/:id/comment` conservés ; retour après commentaire vers le slug.
- `/categories` → 301 `/article` pour supprimer un doublon de liste.
- `/sitemap.xml` dynamique : pages publiques, catégories non vides, articles publiés ; index et sous-sitemaps au-delà de 1 000 articles. Dates réelles uniquement. RSS/Atom corrigés, identifiants historiques des entrées conservés.
- `/robots.txt` dynamique depuis `APP_URL`. Administration exclue ; recherche/auth/formulaires portent `noindex` mais restent explorables pour que ce signal soit lu. Pas de blocage global de Googlebot.
- Métadonnées partagées : title/description avec fallbacks, canonical absolue, OG/Twitter et image de repli. Canonical propre à la pagination des catégories, archives et auteur ; commentaires canoniques vers l’article. Suivi marketing exclu.
- BlogPosting avec auteur réel, dates, image, publisher ; BreadcrumbList ; un H1 article, H2/H3 facultatifs (`##`/`###`), ancres déterministes, sommaire à partir de deux H2.
- Administration : champs facultatifs, sélection de cinq articles liés maximum, insertion de liens vers les articles publiés, brouillon/publication. Brouillons accessibles uniquement dans l’admin ; la première publication d’un nouveau brouillon renseigne sa vraie date. Retrait/republication d’un ancien article conserve sa première date.
- Suggestions de même catégorie complètent les liens manuels, cinq maximum. Pas de tags ajoutés.
- `/auteur/emilie` avec liste paginée des articles du compte résolu ; sans compte configuré/trouvé, pas d’attribution implicite, page `noindex` et absente du sitemap. `/a-propos` avec présentation à compléter.
- Pagination des archives ajoutée ; pagination catégories/recherche conservée et liens à paramètres corrigés. Pages hors limites renvoient 404.
- Image principale eager/high priority ; inline et vidéos lazy ; dimensions réelles des uploads lues avec cache borné, sans accès réseau ; srcset uniquement pour les variantes réellement présentes, avec leurs largeurs mesurées. Compression WebP existante conservée. Les fichiers manquants n’empêchent pas le rendu.
- Page 404 enrichie avec accès aux articles et catégories.

Inventaire exact : [fichiers créés et modifiés](fichiers-livres.md).

## Phase D — Vérifications

- `npm test` : **50 tests réussis**, dont les tests historiques de sécurité/éditeur + tests SEO, modèle Sequelize sans connexion, migration simulée et HTTP réel sur loopback avec modèles simulés.
- Cas couverts : ancien article, 301/200/404, brouillons, unicité et stabilité des slugs, fallbacks, canonical, H1, JSON-LD, auteur, dates, images et social, sitemap/index/feeds, pagination, rendu EJS, édition et conservation des dates, migration relançable/collision.
- `npm run test:seo-images` et `npm run test:image-compression` : réussis. Le second utilise désormais un répertoire temporaire unique et ne touche pas aux uploads existants.
- Génération des 11 WebP : dimensions et pixels visibles comparés aux PNG ; sources conservées. Rapport `static-images.json`.
- Aucun script build/lint configuré ; vérification syntaxique JS et `git diff --check`.
- Les scripts historiques nécessitant la base réelle (`test:newsletter`, CSV) ou une installation déployée (`test:production`, smoke sitemap historique) ne valident pas cet environnement sans BDD. Ils n’ont pas été utilisés contre la production. Leur périmètre SEO est couvert par les tests HTTP isolés.
- Limites : pas de migration réellement appliquée sur MySQL/PostgreSQL, pas de mesure Core Web Vitals ni de contrôle visuel en navigateur de la production. Répétition sur une copie de préproduction requise avant livraison serveur.

## Phase E — Déploiement progressif, sans perte

**Hostinger sans SSH (configuration confirmée) : suivre [cette procédure avant le push](hostinger-sans-ssh.md).** La migration peut maintenant être activée au démarrage par `SEO_MIGRATION_ON_START=1`. Sans cette activation, le nouveau code refuse un schéma incomplet. Les étapes avec terminal ci-dessous sont une alternative pour les environnements disposant de SSH.

1. Faire une sauvegarde cohérente de la base et des uploads ; vérifier sa lisibilité/restauration dans un environnement séparé. Relever le nombre d’articles et quelques titres/contenus/dates/images avec des lectures seules.
2. Vérifier le vrai schéma `articles`, le dialecte, les colonnes SEO éventuellement déjà présentes et les triggers. Examiner toute divergence signalée par la migration. Aucun reset, seed, ancienne chaîne de migrations ou recréation de tables.
3. Sur copie de préproduction, puis sur le serveur avec la configuration de connexion existante, exécuter **uniquement** :

   ```sh
   node scripts/migrate-seo.js --apply
   ```

   Sans `--apply`, aucune opération BDD n’est exécutée. Le script charge `.env` comme l’application ; une configuration PM2 seule doit être fournie explicitement au processus de migration. Vérifier la cible avant d’exécuter. Ne pas démarrer la nouvelle version avant que la migration soit terminée.
4. Pendant la transition, suspendre les créations/éditions administrateur, terminer le backfill, contrôler les articles sans slug, puis basculer vers la nouvelle version. Cela évite que l’ancienne application crée un article sans slug entre le backfill et la bascule.
5. Configurer `APP_URL` avec l’origine HTTPS réellement utilisée et `EMI_AUTHOR_EMAIL=delbeemilie27500@gmail.com` (ou l’ID vérifié, prioritaire). L’email n’est pas publié. Configurer uniquement un token Google réel si disponible.
6. Contrôler les effectifs, slugs uniques, quelques contenus, dates et chemins d’images avant/après. Les dates historiques ne doivent pas changer pendant le backfill. Si une divergence apparaît, arrêter la bascule, conserver toutes les tables/colonnes et investiguer.
7. Déployer les nouveaux fichiers, dont les copies WebP. Recharger l’application. Aucun changement du build. Purger les caches CDN éventuels ; les feuilles CSS modifiées et l’éditeur portent une version d’URL.
8. Le proxy doit transmettre `/robots.txt`, `/sitemap.xml` et les flux à Node. Conserver la redirection HTTP → origine HTTPS canonique. Ne pas utiliser un cache `immutable` d’un an pour du JS/CSS non fingerprinté ; prévoir revalidation ou cache court. Les documents HTML avec CSRF ne doivent pas être mis en cache public.
9. Vérifier un ancien lien (301), sa cible (200), un inexistant/brouillon (404), sitemap/robots, commentaires/likes, création et édition admin avec/sans image, catégories et archives paginées. Compléter la biographie avec Émilie.
10. Ne pas supprimer les colonnes en cas de retour applicatif. Attention : une ancienne version ignorant `is_published` rendrait les brouillons publics ; tout retour doit conserver le filtre de publication.

## Google Search Console

1. Ajouter la propriété du vrai domaine dans Search Console. Pour une propriété Domaine, créer l’enregistrement DNS TXT fourni par Google puis valider. Alternative : propriété Préfixe d’URL HTTPS, méthode balise HTML ; placer **uniquement la valeur réelle** du champ `content` dans `GOOGLE_SITE_VERIFICATION`, recharger puis valider. [Documentation de validation](https://support.google.com/webmasters/answer/9008080).
2. Dans « Sitemaps », soumettre `sitemap.xml`, vérifier son accessibilité et le compte rendu de traitement. [Documentation sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
3. Inspecter quelques URLs avec slug, tester l’URL publiée et vérifier la canonical détectée ; demander l’indexation des pages principales. Tester BlogPosting avec le Rich Results Test puis surveiller les rapports d’indexation et les Core Web Vitals. [Documentation Article](https://developers.google.com/search/docs/appearance/structured-data/article).

Les métadonnées et le sitemap facilitent l’exploration ; ils ne garantissent ni indexation ni classement.
