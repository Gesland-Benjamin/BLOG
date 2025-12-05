-- ==========================
-- SCRIPT SQL - BLOG / NEWSLETTER (ROLES VISITEUR/ADMIN)
-- ==========================

-- Suppression si déjà existant (optionnel pour recréer)
DROP TABLE IF EXISTS COMMENTAIRE CASCADE;
DROP TABLE IF EXISTS ARTICLE CASCADE;
DROP TABLE IF EXISTS NEWSLETTER_SUBSCRIBER CASCADE;
DROP TABLE IF EXISTS CATEGORIE CASCADE;
DROP TABLE IF EXISTS "USER" CASCADE;

-- ==========================
-- TABLE UTILISATEURS
-- ==========================
CREATE TABLE "USER" (
    id SERIAL PRIMARY KEY,
    nom_prenom VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('visiteur', 'admin'))
);

-- ==========================
-- TABLE CATEGORIE
-- ==========================
CREATE TABLE CATEGORIE (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL
);

-- ==========================
-- TABLE ARTICLE
-- ==========================
CREATE TABLE ARTICLE (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    date_publication TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    auteur_id INT NOT NULL,
    categorie_id INT NOT NULL,
    CONSTRAINT fk_article_user FOREIGN KEY (auteur_id)
        REFERENCES "USER"(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_categorie FOREIGN KEY (categorie_id)
        REFERENCES CATEGORIE(id) ON DELETE SET NULL
);

-- ==========================
-- TABLE COMMENTAIRE
-- ==========================
CREATE TABLE COMMENTAIRE (
    id SERIAL PRIMARY KEY,
    contenu TEXT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    article_id INT NOT NULL,
    CONSTRAINT fk_commentaire_user FOREIGN KEY (user_id)
        REFERENCES "USER"(id) ON DELETE CASCADE,
    CONSTRAINT fk_commentaire_article FOREIGN KEY (article_id)
        REFERENCES ARTICLE(id) ON DELETE CASCADE
);

-- ==========================
-- TABLE NEWSLETTER_SUBSCRIBER
-- ==========================
CREATE TABLE NEWSLETTER_SUBSCRIBER (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NULL,
    CONSTRAINT fk_newsletter_user FOREIGN KEY (user_id)
        REFERENCES "USER"(id) ON DELETE SET NULL
);

-- ==========================
-- INDEXS (optimisation)
-- ==========================
CREATE INDEX idx_article_auteur ON ARTICLE(auteur_id);
CREATE INDEX idx_article_categorie ON ARTICLE(categorie_id);
CREATE INDEX idx_commentaire_article ON COMMENTAIRE(article_id);
CREATE INDEX idx_commentaire_user ON COMMENTAIRE(user_id);
