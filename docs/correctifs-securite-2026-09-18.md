# Correctifs de sécurité — 18 septembre 2026

## État de livraison

Correctifs dans le dossier de travail local, **non déployés**. Aucun accès à la base en ligne, aucune migration, aucun reset, aucun seed et aucun envoi d'email effectués pendant ce travail. Aucune modification de schéma requise par ces correctifs. La table `sessions` déjà utilisée doit exister : sa création automatique au démarrage est supprimée.

Ce document complète l'audit initial `audit-securite-2026-09-18.md`, qui décrit le code avant correction. Il ne constitue pas une garantie de sécurité absolue. Les réglages de l'hébergement et les dépendances restent à vérifier.

## Corrections réalisées

| Audit | Correction locale | Limite / action restante |
|---|---|---|
| S01 | Vérification CSRF liée à la session, contrôle Origin/Fetch Metadata, override uniquement POST → PUT/DELETE, logout POST, formulaires et uploads protégés | Recette navigateur sur préproduction |
| S02 | Suppression des logs de corps sensibles et URLs contenant des tokens, erreurs ORM/SMTP expurgées, SMTP debug interdit en production | Examiner les anciens logs du serveur/proxy ; les secrets déjà exposés doivent être renouvelés |
| S03 | Secret de session obligatoire et refus des valeurs de démonstration, suppression des identifiants admin codés en dur, provisionnement explicite, TOTP admin obligatoire en production | Renouveler les anciens identifiants et configurer chaque facteur avant livraison |
| S04 | Limites IP et email normalisé, routes alternatives protégées, contact/recherche/admin bornés, IPv6 regroupées | Mémoire locale : un seul processus ; limiteur partagé nécessaire avant ajout d'instances |
| S05 | Compte relu en base, révocation après suppression ou changement de mot de passe/rôle, expiration après 30 minutes d'inactivité | Les sessions existantes seront invalidées lors de la première requête |
| S06 | Liens reset signés, limités à une heure et liés au hash actuel, consommation atomique, réponses génériques, aucun champ reset supplémentaire requis | Anciens liens à redemander ; test SMTP et recette réelle sur base de test |
| S07 | CSP avec nonce, refus des handlers JS inline, HSTS production, nosniff, anti-framing, no-referrer, cache dynamique privé no-store | Vérifier les règles du proxy/CDN et les pages/vidéos sous CSP |
| S08 | Transaction gérée, validation avant ouverture, verrouillage des admins, préservation des contenus ; refus de supprimer un auteur possédant des articles | Tester les contraintes SQL réelles sur une base isolée ; erreur = rollback |
| S09 | Confirmation signée 48 h, empreinte en base dans la colonne existante ; désinscription par lien signé, email seul sans suppression ; renvoi admin fonctionnel | Anciens liens de confirmation à renouveler ; liens de désinscription valables un an |
| S10 | Encodage HTML/attributs/email, CSV échappé et formules neutralisées, handlers inline supprimés, vidéos limitées à des domaines exacts | Recette des contenus historiques et fournisseurs vidéo |
| S11 | Originaux temporaires privés, noms aléatoires, contrôle CSRF avant décodage, formats/dimensions/pixels bornés, deux traitements simultanés, nettoyage après erreur | Vérifier que le serveur web ne publie pas directement les anciens dossiers temporaires |
| S12 | Validation des types/tailles, modération des commentaires non-admin, pagination/recherche bornées, likes atomiques sous verrou article | Mesurer performances, limiter le trafic au frontal et définir la rétention des données |
| S13 | Variables hébergeur prioritaires, URL canonique APP_URL, suppression des migrations dans tous les hooks de déploiement, resets/seed/rollback désactivés, démarrage sans sync | Recette du déploiement ; historique Git non réécrit |
| S14 | Tests isolés ajoutés ; besoins d'exploitation listés ci-dessous | Audit npm, recette complète et contrôle hébergement non terminés |

Les 4 776 fichiers de `node_modules` et 10 fichiers de journaux ont été retirés **de l'index Git uniquement**. Ils restent sur le disque. Ces retraits apparaissent comme suppressions préparées dans Git ; les autres changements applicatifs ne sont pas encore commités. Les versions précédentes des fichiers restent dans l'historique. Ne pas confondre ce changement de suivi avec une suppression de fichiers en production.

## Configuration indispensable avant mise en ligne

1. Conserver les variables DB existantes et les fichiers d'uploads persistants. Ne pas lancer `db:create`, `db:reset`, `db:seed`, `migrate` ou `migrate:rollback`. Aucun de ces scripts n'est nécessaire pour cette livraison.
2. Définir `NODE_ENV=production`, y compris en préproduction exposée, et `APP_URL=https://emi-pulse.fr` si c'est bien le domaine canonique utilisé. Rediriger les autres noms d'hôte au frontal. `APP_URL` est désormais utilisé aussi pour les emails, sitemap, RSS et URLs d'articles.
3. Définir un nouveau `SESSION_SECRET` aléatoire, d'au moins 32 caractères, hors Git. Par exemple générer 48 octets aléatoires en hexadécimal depuis un gestionnaire de secrets. La rotation invalide toutes les sessions et tous les liens signés précédemment émis.
4. Définir `TRUST_PROXY` avec les seules adresses/CIDR du proxy réellement devant Node. `loopback` convient uniquement si le proxy local se connecte en boucle locale. Une configuration incorrecte empêche les cookies Secure de fonctionner ou regroupe les visiteurs dans un même quota ; une confiance excessive permet d'usurper l'IP. Restreindre aussi l'accès réseau direct au port Node.
5. Définir `ADMIN_TOTP_SECRETS` sous forme JSON : objet associant chaque email administrateur en minuscules à son secret Base32 distinct. Générer au moins 20 octets aléatoires par secret, les encoder en Base32 et enregistrer ce même secret dans une application d'authentification (TOTP SHA-1, 6 chiffres, période 30 secondes). Ne pas réutiliser les valeurs des tests. Conserver une copie de récupération chiffrée dans le gestionnaire de secrets de l'hébergement. **Sans secret configuré pour le compte, la connexion admin est refusée en production.** Il n'y a pas encore de parcours d'enrôlement ni de codes de secours dans l'interface ; la récupération passe par un opérateur autorisé sur l'hébergement. Le registre anti-réutilisation est en mémoire et se réinitialise au redémarrage.
6. `TEMP_DIR`, si défini, doit être hors de `public/` et du répertoire public d'images (`STATIC_DIR`). Valeur par défaut : `.private-uploads/`. Donner au compte applicatif les droits d'écriture nécessaires sur ce dossier et sur les images publiques uniquement. Ne pas supprimer les images existantes. Le frontal doit également refuser `/uploads/tmp/` et tous les originaux historiques ; l'application les refuse déjà.
7. Vérifier SMTP sur préproduction avec une boîte de test ; le chiffrement TLS est requis. Garder `EMAIL_DEBUG` désactivé. Vérifier SPF, DKIM, DMARC et quotas avec l'hébergeur.
8. Exécuter **un seul processus/une seule instance** de cette application. La configuration PM2 a été ajustée. Les compteurs anti-abus en mémoire sont bornés mais remis à zéro au redémarrage et ne remplacent pas la protection réseau du frontal. Un store partagé doit précéder toute mise à l'échelle.

## Validation réalisée

Commande : `npm run test:security`.

17 tests passent, sans importer les modèles réels ni ouvrir une connexion DB : refus GET/HEAD destructifs, CSRF, CSP/cache, secrets et origine, tokens falsifiés/expirés, sessions révoquées, limites par IP/email/IPv6, TOTP et rejeu, absence de mots de passe dans les erreurs, encodage HTML/CSV, URLs vidéo, temporaires/pagination, compilation EJS et rendu de huit formulaires, transaction de suppression simulée, double consommation d'un reset, désinscription avec preuve de possession, nettoyage d'uploads simulé.

Les contrôleurs DB et la chaîne upload sont testés avec des doubles explicites. Ces tests ne remplacent pas les transactions réelles, Multer/Sharp réels, SMTP, un navigateur ou l'infrastructure réseau. Le dossier local `node_modules` est incomplet (import Express bloqué par un fichier manquant d'iconv-lite) : démarrage et recette HTTP de bout en bout non réalisés. Une ancienne erreur de syntaxe dans le script de test sitemap (shebang en deuxième ligne) a aussi été corrigée.

Vérification syntaxique : 105 fichiers JS/CJS hors dépendances, zéro erreur. Les contrôles `git diff --check` et `git diff --cached --check` ont passé lors du premier contrôle ; leur ultime répétition après les derniers ajustements est bloquée par une erreur système `Operation timed out` lors de la lecture de `.git/index`. Le fichier existe mais sa lecture échoue aussi directement, y compris hors bac à sable. Aucun reset/reconstruction d’index tenté. Vérifier le stockage local et relancer ces contrôles avant commit/livraison.

## Contrôles restant nécessaires

- **Audit et installation npm** : l'approbation automatique a refusé la transmission des noms/versions au registre npm sans accord explicite. La demande d'autorisation est en attente. Aucun contournement, aucune mise à jour automatique forcée. Après accord : installation propre dans un dossier temporaire isolé, audit production/développement, mises à jour ciblées puis tests. Ne pas faire une installation de test dans le dossier de production.
- **Recette préproduction** : base dédiée avec données fictives et mêmes contraintes que la production, SMTP de test, proxy représentatif. Vérifier connexion/MFA, logout, récupération, newsletter, création/modification d'article avec deux images, refus d'upload, likes/commentaires et actions admin. Tester les refus d'accès et le comportement des transactions concurrentes. L'URL et les secrets de cette préproduction doivent être distincts.
- **Hébergement** : mises à jour Node/OS, droits SQL minimaux, absence de droits DROP/ALTER/CREATE pour l'application, port DB privé, TLS DB si connexion distante, MFA hébergeur/SSH, droits fichiers, redirection HTTPS, règles de cache et de logs du proxy.
- **Sauvegardes** : confirmer une sauvegarde récente chiffrée de la base et des images ; tester une restauration vers une autre base isolée. Ne jamais écraser la base existante pour faire ce test.
- **Secrets historiques** : vérifier l'utilisation passée des comptes/identifiants codés en dur et la présence de secrets dans les journaux. Renouveler ceux exposés. Le retrait du suivi Git n'efface pas l'historique ni les copies du serveur.
- **Données et disponibilité** : rétention emails/IP/logs/sessions, purge des demandes newsletter expirées selon une politique validée, alertes, surveillance des accès admin, protection réseau contre les volumes distribués. L'application crée encore une session anonyme pour les formulaires présents sur les pages : le plafonnement applicatif atténue ce coût, sans résoudre seul un afflux distribué.

Ne pas déployer avant configuration et recette. Le script de déploiement utilise désormais `npm ci --omit=dev` puis un redémarrage PM2 ciblé ; aucune migration de schéma n'est déclenchée. Le retour arrière porte uniquement sur le code et sa configuration, jamais sur l'écrasement de la base.
