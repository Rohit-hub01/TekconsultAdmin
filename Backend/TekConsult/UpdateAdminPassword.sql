-- Update Admin User Password
-- Email: admin@gmail.com
-- Password: Test105*
-- BCrypt Hash generated for Test105*

UPDATE Users 
SET PasswordHash = '$2a$11$EJ8mQ6Z8vu3vD3gEOY8z9OX4vZ8r5lH8f9K3mY8r5lH8f9K3mY8r5O'
WHERE Email = 'admin@gmail.com';

SELECT FirstName, LastName, Email, PasswordHash, Status
FROM Users
WHERE Email = 'admin@gmail.com';
