-- Add date column to time_slots table for date-specific scheduling
ALTER TABLE time_slots ADD COLUMN date DATE NULL;
