-- Veritabanı oluşturma
DROP DATABASE IF EXISTS bookmark_db;
CREATE DATABASE bookmark_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Veritabanını seç
USE bookmarks_db;

-- Kullanıcılar tablosu
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    website VARCHAR(255),
    twitter VARCHAR(100),
    github VARCHAR(100),
    is_approved BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until DATETIME,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    max_bookmarks INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- Etiketler tablosu
CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tag_name (name),
    INDEX idx_tag_slug (slug)
) ENGINE=InnoDB;

-- Yer imleri tablosu
CREATE TABLE bookmarks (
    id VARCHAR(36) PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(2048),
    is_public BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    favorite_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_bookmarks (user_id),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX ft_bookmark_search (title, description)
) ENGINE=InnoDB;

-- Yer imi - Etiket ilişki tablosu
CREATE TABLE bookmark_tags (
    bookmark_id VARCHAR(36),
    tag_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bookmark_id, tag_id),
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    INDEX idx_bookmark_tags (tag_id, bookmark_id)
) ENGINE=InnoDB;

-- Favoriler tablosu
CREATE TABLE favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    bookmark_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favorite (user_id, bookmark_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
    INDEX idx_user_favorites (user_id)
) ENGINE=InnoDB;

-- Yorumlar tablosu
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    bookmark_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    parent_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_bookmark_comments (bookmark_id),
    INDEX idx_user_comments (user_id)
) ENGINE=InnoDB;

-- Koleksiyonlar tablosu
CREATE TABLE collections (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_collections (user_id)
) ENGINE=InnoDB;

-- Koleksiyon - Yer imi ilişki tablosu
CREATE TABLE collection_bookmarks (
    collection_id VARCHAR(36),
    bookmark_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, bookmark_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
    INDEX idx_collection_bookmarks (collection_id)
) ENGINE=InnoDB;

-- SEO Ayarları tablosu
CREATE TABLE seo_settings (
    id VARCHAR(36) PRIMARY KEY,
    robots_txt TEXT,
    sitemap_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Kullanıcı aktivite logları tablosu
CREATE TABLE user_activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action_type ENUM('create', 'update', 'delete', 'login', 'logout', 'favorite', 'comment'),
    entity_type ENUM('bookmark', 'comment', 'collection', 'tag', 'user'),
    entity_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_activity (user_id, action_type),
    INDEX idx_activity_date (created_at)
) ENGINE=InnoDB;

-- Bildirimler tablosu
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('favorite', 'comment', 'mention', 'system') NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type ENUM('bookmark', 'comment', 'collection', 'user'),
    related_entity_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id, is_read)
) ENGINE=InnoDB;

-- Görünüm: Popüler yer imleri
CREATE VIEW popular_bookmarks AS
SELECT 
    b.*,
    COUNT(DISTINCT f.id) as total_favorites,
    COUNT(DISTINCT c.id) as total_comments
FROM bookmarks b
LEFT JOIN favorites f ON b.id = f.bookmark_id
LEFT JOIN comments c ON b.id = c.bookmark_id
WHERE b.is_public = TRUE
GROUP BY b.id
ORDER BY total_favorites DESC, total_comments DESC;

-- Görünüm: Kullanıcı istatistikleri
CREATE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    COUNT(DISTINCT b.id) as total_bookmarks,
    COUNT(DISTINCT f.id) as total_favorites,
    COUNT(DISTINCT c.id) as total_comments,
    COUNT(DISTINCT col.id) as total_collections
FROM users u
LEFT JOIN bookmarks b ON u.id = b.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN comments c ON u.id = c.user_id
LEFT JOIN collections col ON u.id = col.user_id
GROUP BY u.id;

-- Tetikleyici: Yer imi silindiğinde favori sayısını güncelle
DELIMITER //
CREATE TRIGGER after_favorite_insert
AFTER INSERT ON favorites
FOR EACH ROW
BEGIN
    UPDATE bookmarks 
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.bookmark_id;
END//

CREATE TRIGGER after_favorite_delete
AFTER DELETE ON favorites
FOR EACH ROW
BEGIN
    UPDATE bookmarks 
    SET favorite_count = favorite_count - 1
    WHERE id = OLD.bookmark_id;
END//
DELIMITER ;
