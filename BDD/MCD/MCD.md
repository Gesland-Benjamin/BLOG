## MCD VERSION MOCODO


USER: id, nom/prenom, email, mot de passe, role 
ARTICLE: id, titre, contenu, date de publication, auteur_id (FK vers user), categorie_id (FK vers categorie)
CATEGORIE: id, nom (ex : Beauté, Nutrition, Développement personnel…)
NEWSLETTERSUBSCRIBER: id, email, date_inscription
COMMENTAIRE: id, contenu, date, user_id(FK), article_id (FK)


## RELATIONS PRINCIPALES

Un Article appartient à une Catégorie → relation n:1

Un Article est écrit par un User → relation n:1

Un User peut s’abonner à la Newsletter → relation 1:n (ou juste stocker les emails)

Un Article peut avoir plusieurs Commentaires → relation 1:n


