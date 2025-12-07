# 🚀 Configuration de Production - Guide Complet

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Process Manager (PM2)](#process-manager-pm2)
3. [Configuration HTTPS](#configuration-https)
4. [CORS et Sécurité](#cors-et-sécurité)
5. [Déploiement](#déploiement)
6. [Monitoring et Logs](#monitoring-et-logs)
7. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

Cette configuration de production inclut :

- **PM2** : Process manager pour gérer et relancer l'application
- **Helmet** : Headers de sécurité (CSP, X-Frame-Options, etc.)
- **Compression** : Compression gzip automatique des réponses
- **Rate Limiting** : Protection contre les attaques par force brute
- **HTTPS** : Redirection HTTP → HTTPS et HSTS
- **CORS** : Contrôle des origines autorisées
- **Graceful Shutdown** : Arrêt propre de l'application
- **Monitoring** : Health checks et logging structuré

---

## Process Manager (PM2)

### Installation

```bash
# PM2 est déjà installé
npm list pm2

# Vérifier la version
pm2 --version
```

### Configuration

Voir `ecosystem.config.js` pour les configurations par environnement :
- **development** : 1 instance, watch mode activé
- **staging** : 2 instances, cluster mode
- **production** : max instances (nombre de CPU), clustering

### Démarrer l'application

```bash
# Développement (avec auto-reload)
npm run pm2:dev

# Staging
npm run pm2:staging

# Production
npm run pm2:production
```

### Gestion des processus

```bash
# Voir le statut
npm run pm2:status
pm2 list

# Redémarrer
npm run pm2:restart

# Reload graceful (no downtime)
npm run pm2:reload

# Arrêter
npm run pm2:stop

# Supprimer
npm run pm2:delete

# Sauvegarder la config
pm2 save

# Restaurer au reboot
pm2 startup
```

### Logs

```bash
# Voir les logs en temps réel
npm run pm2:logs
pm2 logs

# Voir les logs d'une app spécifique
pm2 logs blog-production

# Voir les 100 dernières lignes
pm2 logs --lines 100

# Voir les logs avec filtre
pm2 logs --grep "error"
```

### Monitoring

```bash
# Dashboard en temps réel
npm run pm2:monit
pm2 monit

# Voir les statuts détaillés
pm2 info blog-production
pm2 describe all

# Interface web (accessible à http://localhost:9615)
npm run pm2:web
pm2 web
```

---

## Configuration HTTPS

### Certificats SSL

#### Option 1 : Certificat auto-signé (développement/test)

```bash
# Générer un certificat
node scripts/ssl-setup.js generate

# Vérifier les certificats
node scripts/ssl-setup.js verify
```

Cela créera :
- `certs/private-key.pem` (clé privée)
- `certs/certificate.pem` (certificat)

Ajouter au `.env` :
```env
SSL_KEY_PATH=certs/private-key.pem
SSL_CERT_PATH=certs/certificate.pem
HTTPS_ENABLED=true
```

#### Option 2 : Let's Encrypt (production recommandé)

```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian
brew install certbot  # macOS

# Générer un certificat
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Les certificats sont stockés dans :
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

Ajouter au `.env.production` :
```env
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
HTTPS_ENABLED=true
```

**Renouvellement automatique** :
```bash
# Crontab pour renouveler automatiquement
sudo crontab -e

# Ajouter:
0 3 * * * certbot renew --quiet && pm2 reload ecosystem.config.js --env production
```

#### Option 3 : Reverse Proxy (Nginx/Apache)

Pour une configuration en production recommandée :

**nginx.conf** :
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Puis dans `.env.production` :
```env
HTTPS_ENABLED=false  # Le proxy gère HTTPS
REDIRECT_HTTP=false  # Le proxy gère la redirection
```

### Variables d'environnement HTTPS

```env
# Enable/disable HTTPS
HTTPS_ENABLED=true

# Chemins des certificats
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem

# Redirection HTTP -> HTTPS
REDIRECT_HTTP=true

# HSTS (Strict-Transport-Security)
# Déjà configuré dans config/production.js
# maxAge: 1 an, includeSubDomains: true, preload: true
```

---

## CORS et Sécurité

### Configuration CORS

Par défaut en production, les origines autorisées sont définies via `CORS_ORIGINS` :

```env
# .env.production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

En développement, CORS accepte toutes les origines.

### Headers de sécurité

Automatiquement configurés par Helmet :
- `Content-Security-Policy` : Contrôle quelles ressources peuvent être chargées
- `X-Frame-Options: DENY` : Empêche le clickjacking
- `X-Content-Type-Options: nosniff` : Empêche le MIME sniffing
- `X-XSS-Protection` : Protection XSS
- `Referrer-Policy` : Contrôle les infos de référent
- `Permissions-Policy` : Contrôle des APIs (géolocalisation, microphone, etc)
- `Strict-Transport-Security` : Force HTTPS

### Rate Limiting

```env
# .env.production
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100            # 100 requêtes par IP par fenêtre
```

Endpoints ignorés du rate limit :
- `/health` - Health check

### Cache Control

Automatiquement géré :
- Pages admin/auth : pas de cache (`no-store`)
- Contenu public : cache 1 heure (`max-age=3600`)

---

## Déploiement

### Déploiement initial

```bash
# 1. Clone du repository
git clone https://github.com/Gesland-Benjamin/BLOG.git
cd BLOG
git checkout main  # ou votre branche de production

# 2. Installation des dépendances
npm install --production

# 3. Configuration de l'environnement
cp .env.production .env
# Éditer .env avec vos valeurs réelles

# 4. Vérification de la base de données
npm run migrate:status
npm run migrate  # Si nécessaire

# 5. Déploiement automatique
node scripts/deploy.js production
```

### Déploiement avec le script automatique

```bash
# Déploiement complet (installe deps, migrations, démarre avec PM2)
node scripts/deploy.js production

# Voir les logs de déploiement
npm run pm2:logs
```

Le script `deploy.js` effectue automatiquement :
1. ✓ Vérification de PM2
2. ✓ Installation des dépendances
3. ✓ Exécution des migrations
4. ✓ Arrêt des applications existantes
5. ✓ Démarrage avec PM2
6. ✓ Sauvegarde de la configuration
7. ✓ Configuration du startup automatique

### Mise à jour de l'application

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Installer les nouvelles dépendances
npm install --production

# 3. Exécuter les migrations
npm run migrate

# 4. Recharger l'application (sans downtime)
npm run pm2:reload
```

### Déploiement distant avec PM2

Voir `ecosystem.config.js` section `deploy` pour configurer :

```bash
# Déployer sur le serveur de production
pm2 deploy ecosystem.config.js production
```

Cela nécessite :
- SSH setup (clé publique)
- Git repository autorisé
- Credentials dans le fichier de config

---

## Monitoring et Logs

### Health Check

```bash
# Vérifier la santé de l'application
node scripts/monitor.js health

# Réponse attendue:
# ✅ Application en bonne santé
# Status: ok
# Environment: production
# Port: 3000
# Uptime: 12345s
```

L'endpoint `/health` retourne :
```json
{
  "status": "ok",
  "timestamp": "2024-12-07T12:00:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "port": 3000
}
```

### Logs structurés

Les logs sont écrits dans :
- `logs/production.log` : Logs normaux
- `logs/production-error.log` : Erreurs seulement
- `logs/pm2-error.log` : Erreurs PM2
- `logs/pm2-output.log` : Sortie PM2

Format : `YYYY-MM-DD HH:mm:ss Z`

### Monitoring avec scripts

```bash
# Dashboard en temps réel
node scripts/monitor.js dashboard
npm run pm2:monit

# Afficher les logs
node scripts/monitor.js logs
npm run pm2:logs

# Voir le statut
node scripts/monitor.js status
npm run pm2:status

# Statistiques détaillées
node scripts/monitor.js stats
```

### Monitoring avec PM2 Plus (optionnel)

PM2 Plus offre un monitoring en ligne et un alerting :

```bash
# S'enregistrer sur pm2.io
pm2 plus

# Ou ajouter credentials au .env
PM2_PUBLIC_KEY=your_public_key
PM2_SECRET_KEY=your_secret_key

# Redémarrer
npm run pm2:reload
```

---

## Troubleshooting

### L'application redémarre en boucle

```bash
# Voir les erreurs
pm2 logs blog-production --lines 50

# Vérifier si les migrations sont complètes
npm run migrate:status

# Vérifier la base de données
npm run check:env
```

### HTTPS ne fonctionne pas

```bash
# Vérifier que HTTPS_ENABLED=true dans .env
# Vérifier que les chemins SSL sont corrects
node scripts/ssl-setup.js verify

# Si derrière un proxy, vérifier headers X-Forwarded-Proto
```

### CORS bloqué

```bash
# Vérifier CORS_ORIGINS dans .env
echo $CORS_ORIGINS

# En développement, il faut que l'origin soit listée
# En production, accepte '*' ou domaines spécifiques
```

### Haute utilisation mémoire

```bash
# Vérifier les processus
pm2 list

# Voir la mémoire utilisée
pm2 monit

# max_memory_restart: 500M dans ecosystem.config.js
# Redémarrera si > 500MB
```

### Fichiers verrouillés au déploiement

```bash
# Vérifier les processus Node.js
ps aux | grep node

# Arrêter manuellement si nécessaire
pm2 kill

# Redémarrer
npm run pm2:production
```

### Logs trop volumineux

```bash
# Vider les logs PM2
pm2 logs --reset

# Ou nettoyer les fichiers de log manuellement
rm -f logs/*.log

# Les logs sont rotatés après 10MB par défaut
```

---

## Checklist de déploiement

- [ ] Cloner le repository
- [ ] Copier `.env.production` en `.env` et configurer
- [ ] Vérifier la connexion à la base de données
- [ ] Exécuter les migrations : `npm run migrate`
- [ ] Configurer les certificats SSL
- [ ] Configurer CORS_ORIGINS
- [ ] Configurer EMAIL_* pour les notifications
- [ ] Déployer : `node scripts/deploy.js production`
- [ ] Vérifier la santé : `node scripts/monitor.js health`
- [ ] Vérifier les logs : `npm run pm2:logs`
- [ ] Configurer le certificat Let's Encrypt
- [ ] Configurer le reverse proxy Nginx (recommandé)
- [ ] Configurer la redirection HTTP → HTTPS
- [ ] Tester HTTPS : `curl -I https://yourdomain.com`
- [ ] Vérifier CSP et security headers
- [ ] Configurer la sauvegarde de la BD
- [ ] Configurer les alertes monitoring
- [ ] Documenter les credentials d'accès

---

## Ressources

- [PM2 Documentation](https://pm2.keymetrics.io)
- [Helmet Documentation](https://helmetjs.github.io)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers)
- [Let's Encrypt](https://letsencrypt.org)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance)
- [Express.js Production](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Dernière mise à jour**: 7 décembre 2024
