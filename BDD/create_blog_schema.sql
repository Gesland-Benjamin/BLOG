-- ==========================
-- SCRIPT DE CREATION BDD BLOG (COMPATIBLE HOSTINGER / POSTGRESQL)
-- ==========================

-- Nettoyage (optionnel, à commenter en prod)
DROP TABLE IF EXISTS commentaire CASCADE;
DROP TABLE IF EXISTS article CASCADE;
DROP TABLE IF EXISTS newsletter_subscriber CASCADE;
DROP TABLE IF EXISTS categorie CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- ==========================
-- TABLE UTILISATEURS
-- ==========================
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    nom_prenom VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('visiteur', 'admin')),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP
);

-- ==========================
-- TABLE CATEGORIE
-- ==========================
CREATE TABLE categorie (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL
);

-- ==========================
-- TABLE ARTICLE
-- ==========================
CREATE TABLE article (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    date_publication TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    auteur_id INT NOT NULL,
    categorie_id INT NOT NULL,
    image VARCHAR(255),
    image_alt VARCHAR(255),
    video VARCHAR(255),
    likes INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_article_user FOREIGN KEY (auteur_id)
        REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_categorie FOREIGN KEY (categorie_id)
        REFERENCES categorie(id) ON DELETE SET NULL
);

-- ==========================
-- TABLE COMMENTAIRE
-- ==========================
CREATE TABLE commentaire (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(150),
    contenu TEXT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected')),
    is_spam BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INT,
    article_id INT NOT NULL,
    parent_id INT,
    CONSTRAINT fk_commentaire_user FOREIGN KEY (user_id)
        REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT fk_commentaire_article FOREIGN KEY (article_id)
        REFERENCES article(id) ON DELETE CASCADE,
    CONSTRAINT fk_commentaire_parent FOREIGN KEY (parent_id)
        REFERENCES commentaire(id) ON DELETE CASCADE
);

-- ==========================
-- TABLE NEWSLETTER_SUBSCRIBER
-- ==========================
CREATE TABLE newsletter_subscriber (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_token VARCHAR(64) UNIQUE,
    confirmed_at TIMESTAMP,
    CONSTRAINT fk_newsletter_user FOREIGN KEY (user_id)
        REFERENCES "user"(id) ON DELETE SET NULL
);

-- ==========================
-- INDEXS (optimisation)
-- ==========================
CREATE INDEX idx_article_auteur ON article(auteur_id);
CREATE INDEX idx_article_categorie ON article(categorie_id);
CREATE INDEX idx_commentaire_article ON commentaire(article_id);
CREATE INDEX idx_commentaire_user ON commentaire(user_id);

-- ==========================
-- FIN DU SCRIPT
-- ==========================
