-- ============================================
-- SCRIPT COMPLET PRODUCTION - MYSQL/phpMyAdmin
-- ============================================
-- Compatible : Hostinger, MySQL 5.7+, phpMyAdmin
-- Charset : UTF-8 MB4 (émojis + caractères spéciaux)
-- À importer dans phpMyAdmin pour déploiement
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET COLLATION_CONNECTION = utf8mb4_unicode_ci;

-- ============================================
-- PURGE COMPLÈTE DE LA BASE (OPTIONNEL)
-- ============================================
-- Option A : DROP + CREATE DATABASE (décommentez et remplacez `DB_NAME`)
-- DROP DATABASE IF EXISTS `DB_NAME`;
-- CREATE DATABASE `DB_NAME` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `DB_NAME`;
--
-- Option B : suppression explicite des tables connues (phpMyAdmin friendly)
-- (évite l'usage de `information_schema` et de PREPARE/EXECUTE)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `article_likes`;
DROP TABLE IF EXISTS `article_likes`;
DROP TABLE IF EXISTS `article_like`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `commentaire`;
DROP TABLE IF EXISTS `articles`;
DROP TABLE IF EXISTS `article`;
DROP TABLE IF EXISTS `newsletter_subscribers`;
DROP TABLE IF EXISTS `newsletter_subscriber`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `categorie`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `user`;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================
-- SUPPRESSION DES TABLES (pour recréation)
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `article_likes`;
DROP TABLE IF EXISTS `commentaire`;
DROP TABLE IF EXISTS `newsletter_subscriber`;
DROP TABLE IF EXISTS `article`;
DROP TABLE IF EXISTS `categorie`;
DROP TABLE IF EXISTS `user`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- TABLE UTILISATEURS
-- ============================================
CREATE TABLE `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'visiteur' CHECK (`role` IN ('visiteur', 'admin')),
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expiry` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE CATEGORIES
-- ============================================
CREATE TABLE `categorie` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_categorie_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE ARTICLES
-- ============================================
CREATE TABLE `article` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `image` VARCHAR(255) NULL,
  `image_alt` VARCHAR(255) NULL,
  `video` VARCHAR(255) NULL,
  `likes` INT DEFAULT 0,
  `userId` INT NOT NULL,
  `categorieId` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_article_user` FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_article_categorie` FOREIGN KEY (`categorieId`)
    REFERENCES `categorie` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_article_user` (`userId`),
  INDEX `idx_article_categorie` (`categorieId`),
  INDEX `idx_article_created` (`created_at`),
  FULLTEXT INDEX `ft_article_title_content` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE COMMENTAIRES
-- ============================================
CREATE TABLE `commentaire` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(150) NULL,
  `contenu` TEXT NOT NULL,
  `statut` VARCHAR(20) DEFAULT 'pending' CHECK (`statut` IN ('pending', 'approved', 'rejected')),
  `is_spam` BOOLEAN DEFAULT FALSE,
  `is_admin_reply` BOOLEAN DEFAULT FALSE,
  `userId` INT NULL,
  `articleId` INT NOT NULL,
  `parentId` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_commentaire_user` FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_commentaire_article` FOREIGN KEY (`articleId`)
    REFERENCES `article` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_commentaire_parent` FOREIGN KEY (`parentId`)
    REFERENCES `commentaire` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_commentaire_article` (`articleId`),
  INDEX `idx_commentaire_user` (`userId`),
  INDEX `idx_commentaire_statut` (`statut`),
  INDEX `idx_commentaire_parent` (`parentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE ARTICLE_LIKES (MIGRATION 02)
-- ============================================
CREATE TABLE `article_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `articleId` INT NOT NULL,
  `userId` INT NULL,
  `ip` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_article_like_user_ip` (`articleId`, `userId`, `ip`),
  CONSTRAINT `fk_article_like_article` FOREIGN KEY (`articleId`)
    REFERENCES `article` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_article_like_user` FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_article_like_article` (`articleId`),
  INDEX `idx_article_like_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE NEWSLETTER_SUBSCRIBER
-- ============================================
CREATE TABLE `newsletter_subscriber` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `userId` INT NULL,
  `confirmed` BOOLEAN DEFAULT FALSE,
  `confirmation_token` VARCHAR(64) UNIQUE NULL,
  `confirmed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_newsletter_subscriber_user` FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_newsletter_email` (`email`),
  INDEX `idx_newsletter_confirmed` (`confirmed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTION DATA EXEMPLE (OPTIONNEL)
-- ============================================

-- Admin utilisateur par défaut
INSERT INTO `user` (`name`, `email`, `password`, `role`)
VALUES ('Emilie Delbe', 'contact@emi-pulse.fr', '$2b$10$YourHashedPasswordHere', 'admin')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Catégories exemple
INSERT INTO `categorie` (`name`)
VALUES 
  ('Accueil'),
  ('Articles'),
  ('Conseil'),
  ('Ressources')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- ============================================
-- TRIGGERS (optionnel, pour audit)
-- ============================================

-- Trigger : mise à jour automatique updated_at pour user
DELIMITER $$
CREATE TRIGGER `before_user_update` BEFORE UPDATE ON `user`
FOR EACH ROW
BEGIN
  SET NEW.`updated_at` = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Trigger : mise à jour automatique updated_at pour article
DELIMITER $$
CREATE TRIGGER `before_article_update` BEFORE UPDATE ON `article`
FOR EACH ROW
BEGIN
  SET NEW.`updated_at` = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================
-- SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE();

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- ✅ Toutes les tables sont créées
-- ✅ Toutes les migrations sont appliquées
-- ✅ Tous les indexes sont optimisés
-- ✅ UTF-8 MB4 configuré pour caractères spéciaux
-- ============================================
