# Configuration Nginx pour Production

## Installation Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# macOS
brew install nginx

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx  # Autostart au reboot
```

## Configuration de base

```nginx
# /etc/nginx/sites-available/blog

# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Permettre renouvellement Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/blog;
    }
    
    # Redirection HTTP -> HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration (optionnel mais recommandé)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Logging
    access_log /var/log/nginx/blog_access.log;
    error_log /var/log/nginx/blog_error.log;
    
    # Root directory
    root /var/www/blog/public;
    
    # Compression (optionnel, Node.js le fait aussi)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers pour l'application Node.js
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Ne pas modifier les redirects
        proxy_redirect off;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# Redirection www vers non-www (optionnel)
server {
    listen 443 ssl http2;
    server_name www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    return 301 https://yourdomain.com$request_uri;
}
```

## Activation

```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog

# Supprimer la config par défaut
sudo rm /etc/nginx/sites-enabled/default

# Vérifier la syntaxe
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Vérifier que Nginx tourne
sudo systemctl status nginx
```

## Let's Encrypt avec Certbot

```bash
# Installation
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Le certificat est valide 90 jours
# Renouvellement automatique
sudo certbot renew --dry-run

# Ajouter un cron pour le renouvellement auto
sudo crontab -e

# Ajouter:
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

## Monitoring et Logs

```bash
# Voir les logs en temps réel
sudo tail -f /var/log/nginx/blog_access.log
sudo tail -f /var/log/nginx/blog_error.log

# Voir les erreurs Let's Encrypt
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Statistiques Nginx
curl http://localhost/nginx_status  # Si mod_status activé

# Vérifier le certificat
openssl x509 -text -noout -in /etc/letsencrypt/live/yourdomain.com/cert.pem
sudo certbot certificates

# Tester HTTPS
curl -I https://yourdomain.com
openssl s_client -connect yourdomain.com:443
```

## Optimization

### Caching statique

```nginx
location ~* \.(jpg|jpeg|png|gif|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:3000;
}
```

### Connection Pooling

```nginx
upstream app {
    least_conn;
    server localhost:3000;
    server localhost:3001;  # Si plusieurs instances PM2
    keepalive 32;
}

location / {
    proxy_pass http://app;
}
```

## Troubleshooting

```bash
# Vérifier la syntaxe
sudo nginx -t

# Voir les processus Nginx
ps aux | grep nginx

# Redémarrer Nginx
sudo systemctl restart nginx

# Voir les erreurs
sudo tail -20 /var/log/nginx/error.log

# Vérifier les permissions
sudo chown -R www-data:www-data /var/www/blog
sudo chmod -R 755 /var/www/blog

# Vérifier que Node.js écoute sur 3000
netstat -tulpn | grep 3000

# Voir les connexions
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
```

## Checklist

- [ ] Nginx installé et configuré
- [ ] Domaine pointé vers le serveur
- [ ] Certificat Let's Encrypt généré
- [ ] Configuration Nginx testée (`nginx -t`)
- [ ] Redirection HTTP → HTTPS fonctionnelle
- [ ] Proxy vers Node.js configuré
- [ ] Security headers activés
- [ ] Caching statique configuré
- [ ] HSTS préload compatible
- [ ] Logs configurés et monitored
- [ ] Renouvellement certificat automatique

---

**Nginx + Node.js = Production robuste et performante** 🚀
