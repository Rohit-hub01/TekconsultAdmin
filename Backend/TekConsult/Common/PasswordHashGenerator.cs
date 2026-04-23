using System;
using BCrypt.Net;

namespace TekConsult.Utilities
{
    /// <summary>
    /// Utility class to generate BCrypt password hashes
    /// </summary>
    public class PasswordHashGenerator
    {
        public static void Main(string[] args)
        {
            // Generate hash for admin password: Test105*
            string password = "Test105*";
            string hash = BCrypt.Net.BCrypt.HashPassword(password);
            
            Console.WriteLine("Password: " + password);
            Console.WriteLine("BCrypt Hash: " + hash);
            Console.WriteLine();
            
            // Verify the hash works
            bool isValid = BCrypt.Net.BCrypt.Verify(password, hash);
            Console.WriteLine("Verification: " + (isValid ? "SUCCESS" : "FAILED"));
        }

        /// <summary>
        /// Hash a password using BCrypt
        /// </summary>
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Verify a password against a BCrypt hash
        /// </summary>
        public static bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
    }
}
