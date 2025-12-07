# Newsletter avec Double Opt-in

## Fonctionnalités implémentées

### 1. Double Opt-in (confirmation par email)

Processus d'inscription en 2 étapes pour garantir la validité des adresses email et respecter les bonnes pratiques RGPD.

#### Flux d'inscription

1. **Inscription initiale** (`POST /newsletter/subscribe`)
   - L'utilisateur entre son email
   - Un token de confirmation unique est généré (64 caractères)
   - L'abonnement est créé avec `confirmed: false`
   - Un email de confirmation est envoyé

2. **Confirmation** (`GET /newsletter/confirm/:token`)
   - L'utilisateur clique sur le lien dans l'email
   - Le token est vérifié
   - L'abonnement est marqué comme confirmé (`confirmed: true`)
   - La date de confirmation est enregistrée
   - Le token est invalidé (supprimé)
   - Un email de bienvenue est envoyé

3. **Email de bienvenue**
   - Envoyé automatiquement après confirmation
   - Contient un lien vers le blog
   - Inclut un lien de désinscription

### 2. Désinscription (unsubscribe)

Processus simple et respectueux pour permettre aux utilisateurs de se désabonner.

#### Flux de désinscription

1. **Accès au formulaire** (`GET /newsletter/unsubscribe`)
   - Via le lien dans les emails (avec email pré-rempli)
   - Ou directement via le menu

2. **Traitement** (`POST /newsletter/unsubscribe`)
   - Vérification de l'existence de l'email
   - Suppression de l'abonnement
   - Message de confirmation

### 3. Structure de la base de données

Champs ajoutés au modèle `NewsletterSubscriber` :

```javascript
{
  id: INTEGER,
  email: STRING(150),
  date_inscription: DATE,
  user_id: INTEGER (nullable),
  confirmed: BOOLEAN (default: false),          // ✨ Nouveau
  confirmation_token: STRING(64) (unique),      // ✨ Nouveau
  confirmed_at: DATE (nullable)                 // ✨ Nouveau
}
```

### 4. Emails envoyés

#### Email de confirmation d'inscription
- **Objet** : "Confirmez votre inscription à la newsletter - Mi Amor"
- **Contenu** : Lien de confirmation avec token unique
- **Validité** : 24 heures (à implémenter si nécessaire)
- **Action** : Clic sur le bouton de confirmation

#### Email de bienvenue
- **Objet** : "Bienvenue dans la newsletter Mi Amor ! 🎉"
- **Contenu** : 
  - Message de bienvenue
  - Présentation des catégories d'articles
  - Lien vers le blog
  - Lien de désinscription
- **Envoi** : Automatique après confirmation

## Routes implémentées

```javascript
GET  /newsletter              // Formulaire d'inscription
POST /newsletter/subscribe    // Traitement inscription (avec rate limiting)
GET  /newsletter/confirm/:token  // Confirmation via token
GET  /newsletter/unsubscribe  // Formulaire de désinscription
POST /newsletter/unsubscribe  // Traitement désinscription
```

## Sécurité

### Protection implémentée

1. **Rate Limiting** : 5 soumissions max par minute (anti-spam)
2. **CSRF Protection** : Token CSRF sur tous les formulaires
3. **Validation** : Email validé avec Joi
4. **Token unique** : Crypto.randomBytes(32) pour la confirmation
5. **Gestion des doublons** : Vérification avant création

### Conformité RGPD

✅ **Consentement explicite** : Double opt-in obligatoire
✅ **Information claire** : Message sur le processus
✅ **Désinscription facile** : Lien dans chaque email
✅ **Suppression des données** : Suppression complète lors du unsubscribe
✅ **Traçabilité** : Date d'inscription et de confirmation enregistrées

## Vues créées

### `newsletter.ejs`
Formulaire d'inscription avec :
- Explication du processus
- Message de confirmation après soumission
- Indication du double opt-in

### `newsletter-confirm.ejs`
Page de confirmation avec :
- Message de succès ou d'erreur
- Design responsive
- Liens vers le blog

### `newsletter-unsubscribe.ejs`
Page de désinscription avec :
- Formulaire simple (email uniquement)
- Message de confirmation après désinscription
- Design empathique

## Configuration requise

### Variables d'environnement

```env
APP_URL=http://localhost:3000        # URL de base de l'application
EMAIL_SERVICE=gmail                   # Service email
EMAIL_USER=votre@email.com           # Email d'envoi
EMAIL_PASSWORD=mot_de_passe_app      # Mot de passe d'application
```

### Migration

```bash
node migrations/06.add-newsletter-confirmation.js
```

## Utilisation

### Test du flux complet

1. **Inscription** :
```bash
# Accéder à http://localhost:3000/newsletter
# Entrer un email valide
# Vérifier l'email de confirmation
```

2. **Confirmation** :
```bash
# Cliquer sur le lien dans l'email
# Voir la page de confirmation
# Recevoir l'email de bienvenue
```

3. **Désinscription** :
```bash
# Accéder à http://localhost:3000/newsletter/unsubscribe
# Entrer l'email
# Confirmer la désinscription
```

## Gestion des cas d'erreur

### Email déjà inscrit et confirmé
- Message : "Cet email est déjà inscrit à notre newsletter"
- Pas de renvoi d'email

### Email déjà inscrit mais non confirmé
- Renvoi de l'email de confirmation
- Message : "Un email de confirmation a été renvoyé"

### Token invalide ou expiré
- Page d'erreur avec message clair
- Lien pour réessayer

### Email service indisponible
- L'abonnement est créé
- Message : "Inscription enregistrée, mais l'email n'a pas pu être envoyé"
- Permet de réessayer plus tard

## Améliorations possibles

### Court terme
- [ ] Expiration des tokens de confirmation (24h ou 48h)
- [ ] Statistiques d'abonnements (dashboard admin)
- [ ] Export des abonnés confirmés

### Moyen terme
- [ ] Historique des emails envoyés
- [ ] Préférences de fréquence (quotidien, hebdomadaire)
- [ ] Catégories d'articles sélectives
- [ ] Template d'email personnalisable

### Long terme
- [ ] Intégration avec un service d'email marketing (Mailchimp, SendGrid)
- [ ] Segmentation des abonnés
- [ ] A/B testing des emails
- [ ] Analytics détaillés (taux d'ouverture, clics)

## Dépannage

### Les emails ne partent pas
1. Vérifier les variables d'environnement :
   ```bash
   npm run check:env
   ```
2. Pour Gmail, utiliser un mot de passe d'application
3. Vérifier les logs du serveur pour les erreurs SMTP

### Le lien de confirmation ne fonctionne pas
1. Vérifier que `APP_URL` est correcte dans `.env`
2. Vérifier que le token existe dans la base
3. Vérifier que l'abonnement n'est pas déjà confirmé

### L'utilisateur ne reçoit pas l'email
1. Vérifier les spams
2. Vérifier que l'email est valide
3. Consulter les logs du serveur
4. Tester avec un autre fournisseur d'email

## Support

Pour toute question ou problème, consulter :
- [Configuration email](./configuration-env.md)
- [Documentation principale](../README.md)
