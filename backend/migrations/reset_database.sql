-- Drop all tables
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS followups;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS categories;

-- Create categories table
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create doctors table
CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create time_slots table
CREATE TABLE time_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Create appointments table
CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  doctor VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  token_number INT,
  rejection_reason TEXT,
  alternate_slot VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create followups table
CREATE TABLE followups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL,
  patient_name VARCHAR(255),
  message_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(255),
  custom_message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed categories
INSERT INTO categories (name) VALUES
('General Medicine'),
('Cardiology'),
('Orthopedics'),
('Pediatrics'),
('Dermatology');

-- Seed doctors
INSERT INTO doctors (name, category_id) VALUES
('Dr. Rajesh Kumar', 1),
('Dr. Priya Sharma', 1),
('Dr. Anil Verma', 2),
('Dr. Sunita Patel', 3),
('Dr. Vikram Singh', 4),
('Dr. Meera Reddy', 5);
