# Blog Mi Amor

Application de blog développée avec Node.js, Express et PostgreSQL.

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Configuration

1. **Cloner le projet**
```bash
git clone <url-du-repo>
cd BLOG
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
# Copier le fichier exemple
cp .env.example .env

# Éditer avec vos valeurs
nano .env
```

4. **Générer un secret de session fort**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copier le résultat dans `SESSION_SECRET` dans `.env`

5. **Créer la base de données**
```bash
createdb blog
```

6. **Vérifier la configuration**
```bash
npm run check:env
```

7. **Initialiser la base de données**
```bash
npm run db:reset
```

8. **Démarrer l'application**
```bash
# Mode développement avec rechargement automatique
npm run dev

# Mode production
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📋 Scripts disponibles

- `npm start` - Démarrer l'application en mode production
- `npm run dev` - Démarrer en mode développement avec nodemon
- `npm run db:create` - Créer les tables de la base de données
- `npm run db:seed` - Remplir la base avec des données de test
- `npm run db:reset` - Réinitialiser la base (create + seed)
- `npm run check:env` - Vérifier la configuration des variables d'environnement
- `npm run test:newsletter` - Afficher les statistiques de la newsletter

## 🔒 Sécurité

### Variables d'environnement

Toutes les configurations sensibles sont stockées dans `.env` :
- ✅ Secrets de session
- ✅ Identifiants de base de données
- ✅ Configuration email
- ✅ Secrets CSRF

**Important** : Le fichier `.env` ne doit JAMAIS être commité dans Git.

### Protections implémentées

- 🛡️ **CSRF Protection** - Protection contre les attaques Cross-Site Request Forgery
- 🔐 **Rate Limiting** - Limitation du nombre de requêtes par IP
- 👮 **Middleware d'authentification** - Vérification des rôles (admin/utilisateur)
- 🔑 **Mots de passe hashés** - Utilisation d'Argon2
- 🍪 **Cookies sécurisés** - HttpOnly, Secure en production
- ✅ **Validation des données** - Joi pour tous les formulaires

## 📖 Documentation

- [Configuration des variables d'environnement](docs/configuration-env.md)
- [Sécurité et rôles](docs/securite-roles.md)
- [Réflexions techniques](docs/reflexion.md)

## 🗄️ Base de données

Voir les schémas dans le dossier `BDD/` :
- MCD (Modèle Conceptuel de Données)
- MLD (Modèle Logique de Données)
- MPD (Modèle Physique de Données)

## 📧 Configuration Email

Pour activer les fonctionnalités email (réinitialisation de mot de passe et newsletter) :

1. Configurer les variables dans `.env` :
```env
APP_URL=http://localhost:3000
EMAIL_SERVICE=gmail
EMAIL_USER=votre@email.com
EMAIL_PASSWORD=mot_de_passe_application
EMAIL_FROM=noreply@miamor.com
```

2. Pour Gmail, créer un mot de passe d'application :
   - Activer l'authentification à deux facteurs
   - Générer un mot de passe d'application dans les paramètres Google

### Newsletter avec Double Opt-in

La newsletter utilise un système de double opt-in conforme RGPD :
- ✅ Email de confirmation obligatoire
- ✅ Lien de désinscription dans chaque email
- ✅ Email de bienvenue après confirmation
- ✅ Gestion des tokens de confirmation

Voir la [documentation complète de la newsletter](docs/newsletter-double-optin.md).

## 👤 Compte administrateur par défaut

Après `npm run db:seed`, un compte admin est créé :
- Email : `admin@miamor.com`
- Mot de passe : `Admin123!`

**⚠️ Changez ce mot de passe en production !**

## 🛠️ Technologies utilisées

- **Backend** : Node.js, Express
- **Base de données** : PostgreSQL, Sequelize ORM
- **Template** : EJS
- **Sécurité** : Argon2, CSURF, Rate Limiting
- **Upload** : Multer
- **Email** : Nodemailer
- **Validation** : Joi

## 📝 Fonctionnalités

### Public
- ✅ Consultation des articles par catégorie
- ✅ Lecture des articles
- ✅ Système de likes
- ✅ Commentaires (avec modération)
- ✅ Recherche d'articles
- ✅ Newsletter avec double opt-in (confirmation par email)
- ✅ Désinscription facile de la newsletter
- ✅ Création de compte
- ✅ Réinitialisation de mot de passe
- ✅ Réinitialisation de mot de passe

### Administrateur
- ✅ Tableau de bord
- ✅ Gestion des articles (CRUD)
- ✅ Gestion des catégories (CRUD)
- ✅ Modération des commentaires
- ✅ Gestion des médias
- ✅ Upload d'images

## 🔧 Dépannage

### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
pg_ctl status

# Vérifier les credentials dans .env
npm run check:env
```

### Les emails ne partent pas
- Vérifier EMAIL_USER et EMAIL_PASSWORD dans `.env`
- Pour Gmail, utiliser un mot de passe d'application
- Vérifier les logs du serveur

### Session non persistante
- Vérifier que SESSION_SECRET est défini dans `.env`
- Le secret doit faire au moins 32 caractères

## 📄 Licence

ISC

## 👨‍💻 Auteur

Benjamin Gesland
