-- Queen of Excellence — Schéma MySQL (import via phpMyAdmin sur LWS)
-- Charset utf8mb4 pour accents et emojis

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `admin` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `login_attempt` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `success` TINYINT(1) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `login_attempt_email_created_idx` (`email`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `event` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `image` VARCHAR(512) NULL,
  `banner` VARCHAR(512) NULL,
  `attendance_frame` VARCHAR(512) NULL,
  `description` TEXT NOT NULL,
  `short_desc` VARCHAR(512) NULL,
  `date` DATETIME(3) NOT NULL,
  `time` VARCHAR(32) NULL,
  `location` VARCHAR(255) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  `rules` TEXT NULL,
  `presentation` TEXT NULL,
  `vote_price` INT NOT NULL DEFAULT 500,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `archived` TINYINT(1) NOT NULL DEFAULT 0,
  `blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- « J'y serai » : présences annoncées par les visiteurs pour un événement.
-- visitor_token identifie un navigateur (anti-doublon), sans donnée personnelle.
CREATE TABLE IF NOT EXISTS `event_attendance` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(36) NOT NULL,
  `visitor_token` VARCHAR(64) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `attendance_event_visitor` (`event_id`, `visitor_token`),
  INDEX `attendance_event_id_idx` (`event_id`),
  CONSTRAINT `attendance_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `candidate` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `number` INT NOT NULL,
  `photo` VARCHAR(512) NULL,
  `bio` TEXT NULL,
  `presentation` TEXT NULL,
  `city` VARCHAR(128) NULL,
  `country` VARCHAR(128) NULL,
  `extra_info` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `vote_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `candidate_event_slug` (`event_id`, `slug`),
  INDEX `candidate_event_id_idx` (`event_id`),
  INDEX `candidate_category_id_idx` (`category_id`),
  CONSTRAINT `candidate_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidate_category_fk` FOREIGN KEY (`category_id`) REFERENCES `event_category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payment` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `reference` VARCHAR(64) NOT NULL UNIQUE,
  `fispay_ref` VARCHAR(128) NULL,
  `amount` INT NOT NULL,
  `type` VARCHAR(16) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `customer_name` VARCHAR(255) NULL,
  `customer_email` VARCHAR(255) NULL,
  `customer_phone` VARCHAR(64) NULL,
  `event_id` VARCHAR(36) NULL,
  `metadata` TEXT NULL,
  `paid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `payment_event_id_idx` (`event_id`),
  CONSTRAINT `payment_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `vote` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(36) NOT NULL,
  `candidate_id` VARCHAR(36) NOT NULL,
  `payment_id` VARCHAR(36) NOT NULL UNIQUE,
  `vote_count` INT NOT NULL,
  `amount` INT NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `voter_name` VARCHAR(255) NOT NULL,
  `voter_email` VARCHAR(255) NOT NULL,
  `voter_phone` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `vote_event_id_idx` (`event_id`),
  INDEX `vote_candidate_id_idx` (`candidate_id`),
  CONSTRAINT `vote_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vote_candidate_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidate` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vote_payment_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ticket` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` INT NOT NULL,
  `quantity` INT NOT NULL,
  `sold` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `ticket_event_id_idx` (`event_id`),
  CONSTRAINT `ticket_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ticket_order` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `reference` VARCHAR(64) NOT NULL UNIQUE,
  `event_id` VARCHAR(36) NOT NULL,
  `payment_id` VARCHAR(36) NOT NULL UNIQUE,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(64) NULL,
  `total_amount` INT NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `qr_code` MEDIUMTEXT NULL,
  `validated_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `ticket_order_event_id_idx` (`event_id`),
  CONSTRAINT `ticket_order_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_order_payment_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ticket_order_item` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `ticket_order_id` VARCHAR(36) NOT NULL,
  `ticket_id` VARCHAR(36) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` INT NOT NULL,
  `subtotal` INT NOT NULL,
  INDEX `ticket_order_item_order_idx` (`ticket_order_id`),
  INDEX `ticket_order_item_ticket_idx` (`ticket_id`),
  CONSTRAINT `ticket_order_item_order_fk` FOREIGN KEY (`ticket_order_id`) REFERENCES `ticket_order` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_order_item_ticket_fk` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gallery_item` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `video_url` VARCHAR(512) NULL,
  `category` VARCHAR(128) NULL,
  `type` VARCHAR(16) NOT NULL DEFAULT 'IMAGE',
  `event_id` VARCHAR(36) NULL,
  `candidate_id` VARCHAR(36) NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `gallery_item_event_id_idx` (`event_id`),
  INDEX `gallery_item_candidate_id_idx` (`candidate_id`),
  CONSTRAINT `gallery_item_event_fk` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE SET NULL,
  CONSTRAINT `gallery_item_candidate_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidate` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `impact` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `icon` VARCHAR(128) NULL,
  `value` VARCHAR(128) NULL,
  `image` VARCHAR(512) NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `partner` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(512) NOT NULL,
  `website` VARCHAR(512) NULL,
  `description` TEXT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `project` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NOT NULL,
  `image` VARCHAR(512) NULL,
  `content` MEDIUMTEXT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `faq` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `contact_message` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(64) NULL,
  `subject` VARCHAR(255) NULL,
  `message` TEXT NOT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `site_content` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `key` VARCHAR(128) NOT NULL UNIQUE,
  `value` MEDIUMTEXT NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `hero_slide` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `image` VARCHAR(512) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `cta_primary_label` VARCHAR(128) NULL,
  `cta_primary_href` VARCHAR(512) NULL,
  `cta_secondary_label` VARCHAR(128) NULL,
  `cta_secondary_href` VARCHAR(512) NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
