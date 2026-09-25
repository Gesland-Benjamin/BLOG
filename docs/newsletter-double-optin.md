# Newsletter Emi’Pulse

## Parcours actuel

1. Le formulaire du pied de page et `/newsletter` envoient une adresse validée à `POST /newsletter/subscribe`.
2. Un nouvel abonnement reste non confirmé. Un lien signé valable **48 heures** est envoyé ; seule son empreinte SHA-256 est stockée en base.
3. `GET /newsletter/confirm/:token` vérifie le lien et active l’abonnement une seule fois. Le jeton stocké est effacé, la date de confirmation enregistrée et un mail de bienvenue est demandé.
4. Le mail de bienvenue contient un lien personnel de désinscription. Son ouverture affiche un formulaire ; seule la confirmation par POST supprime l’abonnement.
5. Sans lien personnel, `/newsletter/unsubscribe` permet de demander un lien par e-mail. Saisir une adresse ne désinscrit personne directement.

Une nouvelle inscription avec une adresse non confirmée renvoie un lien. Une adresse déjà confirmée ne reçoit pas de nouveau mail de confirmation. Le message de succès reste générique.

Si l’envoi de confirmation ou du lien de désinscription échoue, la page répond avec un statut 503, une explication et l’adresse conservée. L’abonnement ne devient pas actif en cas d’échec d’envoi. Un échec du mail de bienvenue est journalisé sans annuler la confirmation déjà effectuée.

## Présentation

La carte du pied de page et les pages d’inscription, de confirmation et de désinscription reprennent les tons crème, pêche et brun du site, avec des champs étiquetés et un focus clavier visible.

`services/newsletterTemplate.js` fournit le modèle partagé des trois mails : confirmation, bienvenue et lien de désinscription. Il utilise des tableaux de présentation et des styles intégrés, sans image ni police externe. Les mails disposent aussi d’une version texte. Le lien de secours reste visible sous le bouton.

Le projet propose la gestion des abonnés et leur export dans l’administration ; cette refonte n’ajoute pas de moteur d’envoi de campagnes.

## Vérifications effectuées

- `npm test` : **55 tests réussis**, avec base et transport SMTP simulés pour la newsletter.
- Parcours inscription → confirmation unique → bienvenue → désinscription signée.
- Refus des confirmations falsifiées ou expirées ; gestion des erreurs SMTP.
- Rendu EJS, présence des jetons CSRF dans les formulaires POST, échappement du contenu des mails et durée annoncée de 48 heures.
- Aperçu local de la carte et du modèle de mail contrôlé dans Chrome.

Aucun e-mail réel n’a été envoyé et aucune base réelle n’a été modifiée pendant ces vérifications. L’aperçu navigateur ne remplace pas un contrôle dans les clients de messagerie.

## Contrôle après déploiement Hostinger

Vérifier dans les variables d’environnement que `APP_URL` correspond à l’URL HTTPS publique et que la configuration SMTP existante est renseignée. Conserver le secret de signature configuré pour ne pas invalider les liens déjà envoyés. Cette refonte ne nécessite pas de nouvelle migration.

Avec une adresse de test maîtrisée, vérifier ensuite la réception du mail, son affichage dans Gmail/Outlook, la confirmation, le mail de bienvenue et la désinscription. Ce contrôle réel reste à effectuer après déploiement.
