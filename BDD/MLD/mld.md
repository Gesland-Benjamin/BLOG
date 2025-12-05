1. USER (utilisateurs)

id (PK) → Identifiant unique de l’utilisateur
nom_prenom (VARCHAR 150, NOT NULL)
email (VARCHAR 150, UNIQUE, NOT NULL)
mot_de_passe (VARCHAR 255, NOT NULL)
role (VARCHAR 50, NOT NULL : "visiteur", "admin")

2. CATEGORIE

id (PK)
nom (VARCHAR 100, NOT NULL)

3. ARTICLE

id (PK)
titre (VARCHAR 255, NOT NULL)
contenu (TEXT, NOT NULL)
date_publication (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
auteur_id (FK → USER.id, NOT NULL)
categorie_id (FK → CATEGORIE.id, NOT NULL)

# Relations :

Un ARTICLE est écrit par un seul USER (n:1)
Un ARTICLE appartient à une seule CATEGORIE (n:1)

4. COMMENTAIRE

id (PK)
contenu (TEXT, NOT NULL)
date (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
user_id (FK → USER.id, NOT NULL)
article_id (FK → ARTICLE.id, NOT NULL)

# Relations :

Un COMMENTAIRE est écrit par un USER (n:1)

Un COMMENTAIRE concerne un seul ARTICLE (n:1)

Un ARTICLE peut avoir plusieurs COMMENTAIRES (1:n)

5. NEWSLETTER_SUBSCRIBER

id (PK)
email (VARCHAR 150, UNIQUE, NOT NULL)
date_inscription (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
user_id (FK → USER.id, NULL)

# Relations :

Optionnellement, un USER peut être lié à un enregistrement (1:n).

Permet aussi de gérer des abonnés qui ne sont pas inscrits sur le site.


## Résumé des relations

USER — ARTICLE : 1 (auteur) → n (articles)

CATEGORIE — ARTICLE : 1 (catégorie) → n (articles)

USER — COMMENTAIRE : 1 (user) → n (commentaires)

ARTICLE — COMMENTAIRE : 1 (article) → n (commentaires)

USER — NEWSLETTER_SUBSCRIBER : 1 (user) → n (abonnements, optionnels)