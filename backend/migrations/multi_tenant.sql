-- Multi-tenant migration: hospitals + users tables, hospital_id on all tables
-- Compatible with MySQL 5.7+

CREATE TABLE IF NOT EXISTS hospitals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'receptionist') NOT NULL DEFAULT 'receptionist',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- Seed default hospital for existing data (id=1)
INSERT INTO hospitals (id, name, whatsapp_number)
  VALUES (1, 'Default Hospital', '+910000000000')
  ON DUPLICATE KEY UPDATE name = name;

-- Safely add hospital_id to each table using a procedure
DROP PROCEDURE IF EXISTS add_hospital_id;

DELIMITER $$
CREATE PROCEDURE add_hospital_id(IN tbl VARCHAR(64))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = tbl
      AND COLUMN_NAME  = 'hospital_id'
  ) THEN
    SET @sql = CONCAT(
      'ALTER TABLE `', tbl, '` ',
      'ADD COLUMN hospital_id INT NOT NULL DEFAULT 1 AFTER id, ',
      'ADD CONSTRAINT fk_', tbl, '_hospital ',
      'FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE'
    );
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_hospital_id('categories');
CALL add_hospital_id('doctors');
CALL add_hospital_id('time_slots');
CALL add_hospital_id('appointments');
CALL add_hospital_id('followups');

DROP PROCEDURE IF EXISTS add_hospital_id;
