-- Images envoyées depuis l'admin : le fichier lui-même est stocké en base.
-- Les contenus gardent leur chemin /uploads/<filename>, servi depuis cette table.
CREATE TABLE IF NOT EXISTS `media` (
  `filename` VARCHAR(128) NOT NULL PRIMARY KEY,
  `mime` VARCHAR(64) NOT NULL,
  `size` INT NOT NULL,
  `data` LONGBLOB NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
