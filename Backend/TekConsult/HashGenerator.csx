using System;
using BCrypt.Net;

// Generate BCrypt hash for "Test105*"
string password = "Test105*";
string hash = BCrypt.Net.BCrypt.HashPassword(password, 11);

Console.WriteLine("Password: " + password);
Console.WriteLine("BCrypt Hash: " + hash);
Console.WriteLine();

// Test verify
bool isValid = BCrypt.Net.BCrypt.Verify(password, hash);
Console.WriteLine("Verification test: " + (isValid ? "SUCCESS" : "FAILED"));

// Test with existing hash in database
string existingHash = "$2a$11$c.PfL51ltaUxpgVFfRKOvOubMTEJpeL/437uTvXF8bZ8USnydDiz.";
bool existingValid = BCrypt.Net.BCrypt.Verify(password, existingHash);
Console.WriteLine($"Test '{password}' with existing hash: " + (existingValid ? "MATCH" : "NO MATCH"));

// Try other common passwords
string[] testPasswords = { "Test105*", "Admin123!", "admin123", "Admin@123", "password", "Test@123" };
Console.WriteLine("\nTesting common passwords against existing hash:");
foreach (var pwd in testPasswords)
{
    bool match = BCrypt.Net.BCrypt.Verify(pwd, existingHash);
    Console.WriteLine($"  {pwd}: " + (match ? "✓ MATCH" : "✗"));
}
