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

-- Cadre graphique « J'y serai » (PNG avec zone transparente) fourni par le graphiste.
ALTER TABLE `event` ADD COLUMN IF NOT EXISTS `attendance_frame` VARCHAR(512) NULL AFTER `banner`;
