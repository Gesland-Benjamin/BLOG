/**
 * PM2 Ecosystem Configuration
 * Gère le déploiement et l'exécution de l'application en développement et production
 * 
 * Usage:
 *   Development:  pm2 start ecosystem.config.js --env development
 *   Staging:      pm2 start ecosystem.config.js --env staging
 *   Production:   pm2 start ecosystem.config.js --env production
 */

module.exports = {
  // ===== Configurations par environnement =====
  apps: [
    {
      // ===== Configuration de développement =====
      name: 'blog-dev',
      script: './index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      // Mode watch (redémarrage auto au changement de fichiers)
      watch: ['index.js', 'routes', 'controllers', 'models', 'services', 'middleware'],
      ignore_watch: ['node_modules', 'public/uploads', 'logs', '.git'],
      watch_delay: 1000, // 1 secondes avant redémarrage
      
      // Logging
      output: './logs/dev.log',
      error: './logs/dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart policy
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    {
      // ===== Configuration de staging =====
      name: 'blog-staging',
      script: './index.js',
      instances: 2, // 2 instances avec load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001,
      },
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Logging
      output: './logs/staging.log',
      error: './logs/staging-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Memory & restart
      max_memory_restart: '1G',
      max_restarts: 5,
      min_uptime: '1m',
      autorestart: true,
      
      // Health check
      cron_restart: '0 3 * * *', // Redémarrage quotidien à 3h du matin
    },

    {
      // ===== Configuration de production =====
      name: 'blog-production',
      script: './index.js',
      instances: 'max', // Utiliser tous les CPU cores disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Graceful shutdown (important en production!)
      kill_timeout: 10000, // 10 secondes pour terminer les connexions
      listen_timeout: 5000,
      
      // Logging structuré
      output: './logs/production.log',
      error: './logs/production-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Memory management
      max_memory_restart: '500M', // Redémarrer si > 500MB
      
      // Stabilité
      max_restarts: 3, // Max 3 redémarrages dans la fenêtre
      min_uptime: '5m', // Attendre 5 minutes entre redémarrages
      autorestart: true,
      
      // Health check quotidien (redémarrage graceful)
      cron_restart: '0 2 * * *', // 2h du matin (charge minimale)
      
      // Monitoring avec PM2 Pro (optionnel)
      instance_var: 'INSTANCE_ID',
      merge_logs: true, // Fusionner les logs de toutes les instances
      
      // Ignore certain signals
      ignore_watch: ['node_modules', 'public/uploads', 'logs', '.git', '.env'],
      
      // Environment-specific
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],

  // ===== Configuration de déploiement (déploiement distant) =====
  deploy: {
    production: {
      user: 'deploy',
      host: process.env.DEPLOY_HOST || 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:Gesland-Benjamin/BLOG.git',
      path: '/var/www/blog',
      
      // Commandes à exécuter avant et après le déploiement
      'pre-deploy-local': 'echo "Déploiement en production..."',
      'post-deploy': 'cd /var/www/blog && npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-deploy': 'npm run test', // Tester avant déploiement
      
      'exec-mode': 'cluster',
      instances: 'max',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },

    staging: {
      user: 'deploy',
      host: process.env.DEPLOY_HOST_STAGING || 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:Gesland-Benjamin/BLOG.git',
      path: '/var/www/blog-staging',
      
      'post-deploy': 'cd /var/www/blog-staging && npm install && npm run migrate && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001,
      },
    },
  },

  // ===== Configuration PM2+ (monitoring optionnel) =====
  pmx: {
    enable: false, // Activer pour PM2 Pro monitoring
    custom_probes: true,
  },

  // ===== Global settings =====
  error_file: './logs/pm2-error.log',
  output_file: './logs/pm2-output.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
};
