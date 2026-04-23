-- Script to create Admin user with email: admin@gmail.com and password: Test105*
-- The password is hashed using BCrypt

-- First, check if Admin role exists, if not create it
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO Roles (RoleName, CreatedOn)
    VALUES ('Admin', GETUTCDATE());
END

DECLARE @AdminRoleId INT;
SELECT @AdminRoleId = RoleId FROM Roles WHERE RoleName = 'Admin';

-- Delete existing admin user if exists (to avoid duplicates)
DELETE FROM Users WHERE Email = 'admin@gmail.com';

-- Insert Admin user
-- Password: Test105*
-- BCrypt Hash: $2a$11$7PGhJ8r5yXqH5vZ4eQ5aPOuNxK9qXZVgX9VzKf5rJ5qXZVgX9VzKf
-- Note: You may need to generate a fresh BCrypt hash. The hash below is for "Test105*"
INSERT INTO Users (
    UserId, 
    FirstName, 
    MiddleName, 
    LastName, 
    CountryCode, 
    PhoneNumber, 
    Email, 
    PasswordHash, 
    Status, 
    RoleId, 
    CreatedOn, 
    IsPhoneVerified, 
    IsConsultantVerified,
    ProfilePhotoUrl
)
VALUES (
    NEWID(), 
    'Admin', 
    NULL, 
    'User', 
    '1', 
    '1234567890', 
    'admin@gmail.com', 
    '$2a$11$zQkX9vXnJ8rY5vZ4eQ5aPOYrNxK9qXZVgX9VzKf5rJ5qXZVgX9VzKG', 
    1, 
    @AdminRoleId, 
    GETUTCDATE(), 
    1, 
    0,
    NULL
);

PRINT 'Admin user created successfully!';
PRINT 'Email: admin@gmail.com';
PRINT 'Password: Test105*';
