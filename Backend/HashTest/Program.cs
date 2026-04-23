using System;

namespace HashTest
{
    class Program
    {
        static void Main(string[] args)
        {
            string password = "Test105*";
            
            // Generate new hash
            string newHash = BCrypt.Net.BCrypt.HashPassword(password, 11);
            Console.WriteLine($"New hash for '{password}':");
            Console.WriteLine(newHash);
            Console.WriteLine();
            
            // Test with existing hash
            string existingHash = "$2a$11$oYeovSvrZ4x6Fll12j2U8OTJ6lZ0mUqJbKz31AfArkXCOVhH3bOcm";
            Console.WriteLine("Testing against existing database hash:");
            Console.WriteLine($"Hash: {existingHash}");
            Console.WriteLine();
            
            string[] testPasswords = { 
                "Test105*", 
                "Admin123!",
                "admin123", 
                "Admin@123", 
                "password",
                "Test@123",
                "admin@123",
                "Password123!",
                "TekConsult@2024"
            };
            
            bool found = false;
            foreach (var pwd in testPasswords)
            {
                bool match = BCrypt.Net.BCrypt.Verify(pwd, existingHash);
                Console.WriteLine($"Testing '{pwd}': {(match ? "✓ MATCH!" : "✗")}");
                if (match)
                {
                    found = true;
                    Console.WriteLine($"\n***** FOUND! Password is: {pwd} *****\n");
                }
            }
            
            if (!found)
            {
                Console.WriteLine("\nNone of the test passwords matched.");
                Console.WriteLine("Update database with new hash:");
                Console.WriteLine($"UPDATE Users SET PasswordHash = '{newHash}' WHERE Email = 'admin@gmail.com';");
            }
        }
    }
}
