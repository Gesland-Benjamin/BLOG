# Configuration des variables d'environnement

## Variables d'environnement configurées

Tous les secrets et configurations sensibles sont maintenant stockés dans le fichier `.env` et chargés via `process.env`.

### Fichiers concernés

#### 1. `.env` (non versionné)
Contient vos secrets réels. **Ne jamais commit ce fichier !**

#### 2. `.env.example` (versionné)
Template avec des exemples de valeurs. À copier pour créer votre `.env`.

### Configuration de la base de données (`config/database.js`)

Les paramètres de connexion PostgreSQL sont maintenant lus depuis `.env` :

```javascript
DB_NAME=blog              // Nom de la base de données
DB_USER=ben              // Utilisateur PostgreSQL
DB_PASSWORD=             // Mot de passe PostgreSQL
DB_HOST=localhost        // Hôte de la base
DB_PORT=5432            // Port PostgreSQL
DB_DIALECT=postgres     // Type de base de données
```

### Configuration des sessions (`index.js`)

Le secret de session est lu depuis `.env` avec des options de sécurité :

```javascript
SESSION_SECRET=unSecretTresFortEtAleatoirePourLesSessionsQuiDoitEtreTresLong2024
```

**Options de cookie de session :**
- `httpOnly: true` - Protection XSS
- `secure: true` - HTTPS uniquement en production
- `maxAge: 24h` - Durée de vie de la session

### Configuration email (`services/email.js`)

Paramètres pour l'envoi d'emails (réinitialisation de mot de passe) :

```javascript
EMAIL_SERVICE=gmail                    // Service email
EMAIL_HOST=smtp.gmail.com             // Serveur SMTP
EMAIL_PORT=587                        // Port SMTP
EMAIL_USER=votre@email.com           // Email d'envoi
EMAIL_PASSWORD=mot_de_passe_app      // Mot de passe d'application
EMAIL_FROM=noreply@miamor.com        // Email affiché comme expéditeur
```

## Installation et configuration

### 1. Première installation

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos vraies valeurs
nano .env  # ou votre éditeur préféré
```

### 2. Générer un secret fort pour SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copier le résultat dans votre `.env` :
```
SESSION_SECRET=le_secret_généré_ici
```

### 3. Configuration de la base de données

Mettre à jour dans `.env` :
```
DB_NAME=blog
DB_USER=votre_utilisateur_postgresql
DB_PASSWORD=votre_mot_de_passe_postgresql
DB_HOST=localhost
DB_PORT=5432
```

### 4. Configuration email (optionnel)

Pour utiliser la fonctionnalité de réinitialisation de mot de passe :

#### Pour Gmail :
1. Activer l'authentification à deux facteurs
2. Générer un "mot de passe d'application"
3. Mettre à jour `.env` :

```
EMAIL_SERVICE=gmail
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=mot_de_passe_application_16_caracteres
```

## Sécurité

### ✅ Bonnes pratiques implémentées

1. **Secrets externalisés** : Aucun secret en dur dans le code
2. **`.env` ignoré par Git** : Les secrets ne sont jamais versionnés
3. **`.env.example` documenté** : Guide pour la configuration
4. **Valeurs par défaut sûres** : Fallback si variable manquante
5. **Configuration par environnement** : `NODE_ENV` pour dev/prod

### ⚠️ Recommandations de sécurité

1. **Ne jamais commit `.env`** : Vérifier `.gitignore`
2. **Utiliser des secrets forts** : Minimum 32 caractères aléatoires
3. **Changer les secrets en production** : Ne pas utiliser les exemples
4. **Restreindre les accès** : Permissions 600 sur `.env` (`chmod 600 .env`)
5. **Rotation des secrets** : Changer régulièrement en production
6. **Variables distinctes** : Secrets différents pour dev/staging/prod

### 🔒 Pour la production

```bash
# Variables supplémentaires recommandées
NODE_ENV=production
SESSION_SECRET=un_tres_long_secret_aleatoire_64_caracteres_minimum
CSRF_SECRET=un_autre_secret_unique_pour_csrf

# Base de données de production
DB_HOST=votre-serveur-db.com
DB_NAME=blog_production
DB_USER=blog_user_prod
DB_PASSWORD=un_mot_de_passe_tres_fort

# HTTPS obligatoire
FORCE_HTTPS=true
```

## Vérification

Pour vérifier que vos variables sont bien chargées :

```bash
node -e "require('dotenv').config(); console.log(process.env.SESSION_SECRET ? '✅ SESSION_SECRET chargé' : '❌ SESSION_SECRET manquant')"
```

## Dépannage

### Erreur : "SESSION_SECRET is not defined"
➡️ Créer le fichier `.env` à partir de `.env.example`

### Les emails ne partent pas
➡️ Vérifier `EMAIL_USER` et `EMAIL_PASSWORD` dans `.env`
➡️ Pour Gmail, utiliser un mot de passe d'application

### Erreur de connexion à la base de données
➡️ Vérifier `DB_USER`, `DB_PASSWORD`, `DB_NAME` dans `.env`
➡️ Vérifier que PostgreSQL est démarré
