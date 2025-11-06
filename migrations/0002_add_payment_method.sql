
-- Add payment_method column to orders table
ALTER TABLE `orders` ADD COLUMN `payment_method` varchar(50) NOT NULL DEFAULT 'cash';

-- Add payment_method column to returns table
ALTER TABLE `returns` ADD COLUMN `payment_method` varchar(50) NOT NULL DEFAULT 'cash';
