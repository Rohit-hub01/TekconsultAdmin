using System.Runtime.InteropServices;
namespace TekConsult.Dto
{
    public class PhoneNumberOtpDto
    {
        public string CountryCode { get; set; }
        public string PhoneNumber { get; set; }
        public string Otp { get; set; }
        public bool IsConsultant { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
    }

    public class LoginDto
    {
        public string CountryCode { get; set; }
        public string PhoneNumber { get; set; }
        public string Otp { get; set; }
    }
}