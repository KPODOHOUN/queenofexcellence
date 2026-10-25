-- Migration : catégories d'événements (importer si la base existe déjà)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `event_category` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `category_event_slug` (`event_id`, `slug`),
  INDEX `category_event_id_idx` (`event_id`),
  CONSTRAINT `category_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `candidate`
  ADD COLUMN IF NOT EXISTS `category_id` VARCHAR(36) NULL AFTER `event_id`;

-- MySQL < 8.0.12 : ignorer l'erreur si la colonne existe déjà
-- ALTER TABLE `candidate` ADD COLUMN `category_id` VARCHAR(36) NULL AFTER `event_id`;

ALTER TABLE `candidate`
  ADD INDEX IF NOT EXISTS `candidate_category_id_idx` (`category_id`);
