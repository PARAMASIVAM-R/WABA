-- Add no_show status to appointments table
ALTER TABLE appointments 
MODIFY COLUMN status ENUM('pending', 'confirmed', 'accepted', 'visited', 'completed', 'cancelled', 'rejected', 'alternate_suggested', 'no_show') DEFAULT 'confirmed';
