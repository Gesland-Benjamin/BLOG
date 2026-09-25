# Premier déploiement SEO sur Hostinger sans SSH

> **Procédure historique de première migration — ne pas appliquer pour la livraison actuelle.** Le propriétaire interdit toute modification de base. Ne pas activer `SEO_MIGRATION_ON_START=1`. Consulter [la préparation production et ses blocages](preparation-production.md).

Le push déclenche le redéploiement : préparer les sauvegardes et les variables **avant** le push. Aucun push ni accès à la base de production n’a été effectué depuis ce projet local.

## 1. Sauvegarder avant de toucher au déploiement

- Depuis hPanel/phpMyAdmin, exporter la base actuelle (structure et données) et télécharger le fichier. Vérifier que l’export contient bien les articles ; noter leur nombre et quelques dates historiques.
- Télécharger aussi les images/uploads via le gestionnaire de fichiers. Les uploads ne sont pas dans Git : une sauvegarde du dépôt ne les sauvegarde pas.
- Vérifier que le répertoire d’uploads est conservé par le redéploiement Hostinger. Le code utilise `STATIC_DIR` s’il est configuré, sinon `public/uploads`. Ne pas changer cette variable vers un dossier vide. Si la conservation des fichiers n’est pas certaine, clarifier ce point avec Hostinger avant le push.
- Éviter toute création/modification d’article pendant la sauvegarde et la bascule. Idéalement, vérifier d’abord cette livraison sur une copie de préproduction séparée.

## 2. Préparer les variables Hostinger

Dans le tableau de bord du site, ouvrir **Environment variables / Variables d’environnement**, ajouter les valeurs suivantes et appliquer les changements. Ne pas remplacer les paramètres BDD, session, SMTP ou uploads existants.

| Variable | Valeur |
| --- | --- |
| `SEO_MIGRATION_ON_START` | `1` pour autoriser cette migration additive au prochain démarrage |
| `APP_URL` | Conserver/vérifier l’origine HTTPS exacte du site, sans chemin |


L’ancienne version du code ignore `SEO_MIGRATION_ON_START`. L’ajout de cette variable ne lance donc pas encore la nouvelle migration. Ne pas la mettre dans une variable publique de frontend.

La configuration reste `index.js` comme point d’entrée, ou `npm start` comme commande de démarrage. Aucun script build n’est nécessaire pour ce projet Express/EJS. La migration ne doit pas être exécutée pendant l’installation npm ou dans une commande de build.

[Gestion des variables selon Hostinger](https://www.hostinger.com/support/how-to-edit-or-add-environment-variables-after-deployment/) et [paramètres de redéploiement](https://www.hostinger.com/support/how-to-redeploy-a-node-js-application/).

## 3. Effectuer le push après ces préparatifs

La nouvelle version suit cet ordre avant d’ouvrir le port HTTP :

1. Connexion à la base existante.
2. Vérification en lecture seule des colonnes SEO, de l’index unique et de la présence des slugs.
3. Si nécessaire **et uniquement si la variable vaut `1`**, exécution de `migrations/13.article-seo.js` : colonnes manquantes, index unique, remplissage des slugs vides. Aucun ancien script de migrations, seed, reset ou recréation n’est appelé.
4. Nouvelle vérification du schéma, puis démarrage du site.

Les logs attendus sont :

```text
[SEO] Migration additive 13 : démarrage.
[SEO] Migration additive 13 terminée ; schéma vérifié.
```

Si la migration était déjà terminée :

```text
[SEO] Schéma prêt. Aucune migration exécutée.
```

**Si le schéma est incomplet et la variable absente, ou si la migration échoue, cette version ne démarre pas.** Ce contrôle évite de servir des pages sur un schéma incompatible ; il ne garantit pas que Hostinger maintiendra l’ancienne version en ligne. Ne pas promettre une bascule sans interruption. En cas de refus, lire les logs et corriger la cause sans réinitialiser la base.

## 4. Vérifier puis désactiver l’autorisation

- Accueil, catégories et administration accessibles.
- Ancien lien `/article/ID` redirigé vers une URL avec slug ; mêmes texte, image et date.
- `/sitemap.xml` et `/robots.txt` accessibles sur le bon domaine.
- Effectif des articles et dates historiques inchangés après la migration (vérification en lecture seule dans phpMyAdmin).
- Images des anciens articles toujours accessibles.

Une fois ces contrôles réussis, remettre `SEO_MIGRATION_ON_START=0` ou retirer la variable. Les démarrages suivants n’effectuent que le contrôle en lecture seule. Même laissée à `1`, la migration n’est pas rejouée si le schéma et les slugs sont complets.

En cas d’échec partiel, les colonnes déjà ajoutées sont conservées ; le script est relançable. Ne pas supprimer ces colonnes. Une ancienne version ignorant les brouillons ne doit pas être remise en service avec des brouillons privés sans conserver leur filtre de publication.

## Validation locale

`npm test` : 50 tests réussis, dont cinq scénarios du démarrage conditionnel (activation, absence d’activation, schéma prêt, schéma incomplet, erreur). Modèles/bases simulés : aucune migration de production n’a été exécutée et le schéma réel Hostinger reste à vérifier.
