namespace TekConsult.Dto
{
    public class EmailSignupDto
    {
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string Email { get; set; }
        public string Otp { get; set; }
        public bool IsConsultant { get; set; }
    }
}
