-- Données minimales Queen of Excellence
-- Importer APRÈS schema.mysql.sql dans phpMyAdmin (cPanel LWS)
-- Tout le contenu du site se gère depuis le dashboard admin.

INSERT INTO `admin` (id, email, name, password_hash) VALUES
('a0000001-0000-4000-8000-000000000001', 'admin@queenofexcellence.com', 'Administrateur', '$2b$10$cV/hkdrWhN.CHedMqk1oTuS4ZLoA9Tq1XvJx5hC/vZJLP8OZIZoLy')
ON DUPLICATE KEY UPDATE email = email;
-- Mot de passe initial : admin123 — changez-le après la première connexion.

INSERT INTO `site_content` (id, `key`, value) VALUES
('c0000001-0000-4000-8000-000000000001', 'about', '{"title":"Queen of Excellence","content":"Un concours intellectuel féminin à Parakou.","mission":"","vision":"","image":"/uploads/fbd98050-d325-4edf-b291-fe5b5c79d53b.jpg"}'),
('c0000002-0000-4000-8000-000000000002', 'social_links', '{"youtube":"","facebook":"","tiktok":"","instagram":"","whatsapp":""}'),
('c0000003-0000-4000-8000-000000000003', 'contact', '{"email":"","phone":"","address":"","hours":""}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
