# Guide éditorial Emi’Pulse

Préparé le 25 septembre 2026 à partir des rubriques et articles publics. Ce guide ne publie rien et ne modifie aucune donnée. Les pages À propos/auteur et le bloc biographique restent exclus, conformément à la demande.

## Une structure réutilisable dans l’éditeur

Le bouton « Insérer une trame d’article » ajoute une structure au curseur, sans écraser le texte sélectionné. Remplacer les indications entre crochets avant publication. L’aperçu interprète H2/H3, gras, italique, liens internes et listes.

1. Titre affiché : une promesse claire, avec les mots d’Emi. Il constitue le seul H1.
2. Introduction : la question, pourquoi elle vous touche, ce que vous allez partager.
3. Deux ou plusieurs sections `##` : une idée principale par section. Le sommaire apparaît automatiquement dès deux H2.
4. Sous-sections `###` uniquement sous une section H2.
5. Paragraphes courts, exemples vécus et nuances. Listes avec `- ` ou `1. ` lorsque cela facilite la lecture.
6. Un lien interne utile inséré avec le sélecteur. Éviter « cliquez ici » : préférer un intitulé qui décrit l’article.
7. Conclusion personnelle et prochaine action concrète. Le bas de page invite aussi à commenter ou à retrouver les prochains articles par email.
8. Choisir jusqu’à cinq articles liés. Les suggestions de la même catégorie complètent la sélection lorsque des articles sont disponibles.

Le titre SEO et la meta description restent facultatifs, mais il est préférable de les personnaliser pour expliquer précisément le contenu. L’image doit avoir une description de ce qu’elle montre. Aucun quota de mots ou de répétition de mots-clés n’est un objectif : une réponse utile et suffisamment étayée prime. [Principes de Google sur le contenu utile](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## Rôle des catégories existantes

Les noms en base et leurs URLs ne sont pas changés. Voici une ligne éditoriale proposée pour clarifier leur usage ; les descriptions peuvent être renseignées ultérieurement par l’administratrice si elle le souhaite.

| Rubrique actuelle | Périmètre proposé |
| --- | --- |
| Le business sans filtre | Expérience de la vente directe, organisation, limites, relation avec les clients et l’équipe. |
| Le club Farmasi | Histoire de la marque, fonctionnement et retours personnels sur son univers. |
| Le coin beauté | Gestes beauté, routines et essais réellement effectués. |
| Le coin lifestyle | Organisation et habitudes du quotidien. |
| La game room | Jeux pratiqués, découvertes et retours d’expérience. |
| Face au miroir | Rapport à soi et réflexions personnelles. |
| La chambre des déclics | Changements d’habitudes et apprentissages vécus. |
| Entre Vous et Moi | Histoires personnelles et échanges avec les lecteurs. |
| On en parle? | Une question précise ouvrant un débat, avec un angle distinct des autres rubriques. |

Les trois dernières rubriques risquent de se recouper : choisir une catégorie principale d’après la question centrale de l’article. Ne pas créer une nouvelle rubrique pour chaque sujet. Aucun tag n’est ajouté sans besoin de navigation distinct.

## Questions et séries à préparer

**Ce sont des pistes éditoriales, pas des volumes de recherche mesurés ni des requêtes confirmées pour ce blog.** Le thème « Qu’est-ce que la vente directe ? » figure dans la [FAQ de la Fédération de la Vente Directe](https://fvd.fr/faq/). Les autres angles ci-dessous sont proposés à partir des articles déjà publiés et doivent être confrontés aux requêtes Search Console.

| Priorité | Question à traiter | Série / rubrique | Lien existant à utiliser |
| --- | --- | --- | --- |
| 1 | Qu’est-ce que la vente directe, expliqué avec mes mots ? | Le business sans filtre | Article sur la normalisation dans le MLM (35). |
| 2 | Comment parler de mon activité sans mettre mes proches sous pression ? | Le business sans filtre | Même article, puis lien réciproque avec le précédent. |
| 3 | Pourquoi je ne veux pas copier la méthode de tout le monde dans le MLM ? | Le business sans filtre | Enrichissement possible de l’article 35, pour éviter deux articles répondant à la même question. |
| 4 | Farmasi : d’où vient la marque ? | Le club Farmasi | Enrichir l’article 34 plutôt que créer un doublon. Vérifier les faits avec des sources officielles datées. |
| 5 | Comment je construis une routine beauté simple au quotidien ? | Le coin beauté | « Bienvenue dans ma salle de bain ». Utiliser seulement des essais et expériences réels. |
| 6 | Comment je choisis un jeu pour me détendre ? | La game room | « Bienvenue dans ma game room ». |
| 7 | Comment j’organise mon espace pour travailler chez moi ? | Le coin lifestyle | « Bienvenue dans mon bureau ». |

La série **« Bienvenue dans mon univers »** est configurée dans `config/article-series.js`. Ses dix épisodes existants sont reliés automatiquement et dans l’ordre, sans réécrire leur contenu. Les épisodes absents ou non publiés ne sont pas affichés. Pour une nouvelle série, publier les articles normalement puis ajouter leurs slugs à cette configuration. Les liens insérés manuellement restent possibles dans le texte.

## Améliorer les anciens articles

- Commencer par l’article 35, puis l’histoire de Farmasi : clarifier la question, ajouter des H2 si nécessaires, un exemple concret et des liens utiles.
- Conserver le titre personnel si souhaité ; employer le champ SEO pour une formulation plus explicite.
- Pour les articles « Bienvenue… », garder leur rôle de présentation. Les enrichir uniquement avec du vécu utile, sans inventer un témoignage pour les rallonger.
- Ne changer ni slug ni date de publication pour une simple révision. La date de modification s’affiche automatiquement après une vraie édition.
- Relire les éventuelles affirmations factuelles avec des sources à jour avant de publier.

## Mesurer avant de décider

Dans Search Console, ouvrir le rapport de performance puis les requêtes et pages. Relever les recherches réellement associées au blog, leurs impressions et leurs clics. Regrouper celles qui posent la même question et compléter une page existante lorsqu’elle répond déjà au besoin. Aucun accès aux données privées de ce compte n’était disponible lors de cette livraison. [Guide Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start).
