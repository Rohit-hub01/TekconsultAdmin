namespace TekConsult.Dto
{
    public class UserFullProfileResponseDto
    {
        // Users
        public Guid UserId { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? CountryCode { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public bool Status { get; set; }
        public bool? IsPhoneVerified { get; set; }
        public string? RoleName { get; set; }
        public string? ProfilePhotoUrl { get; set; }
 
        public DateTime? CreatedOn { get; set; }
        public Guid? ConsultantProfileId { get; set; }
        public string? Bio { get; set; }
        public int? ExperienceYears { get; set; }
        public string? ConsultantCategory { get; set; }
        public decimal? ChatRatePerMinute { get; set; }
        public decimal? CallRatePerMinute { get; set; }
        public decimal? DiscountedChatRate { get; set; }
        public bool? IsChatDiscountActive { get; set; }
        public decimal? DiscountedCallRate { get; set; }
        public bool? IsCallDiscountActive { get; set; }
        public DateTime? DiscountStart { get; set; }
        public DateTime? DiscountEnd { get; set; }
        public bool? IsOnline { get; set; }
        public int? FreeMinutesOffer { get; set; }
        public decimal? AverageRating { get; set; }
        public int? TotalSessionsCompleted { get; set; }
        public decimal? WalletBalance { get; set; }
        public decimal? TotalMoneySpent { get; set; }
        public string? Gender { get; set; }
        public string? Languages { get; set; }
        public bool IsConsultantVerified { get; set; }
        public AddressResponseDto? Address { get; set; }
        public List<string> ExpertiseNames { get; set; } = new();
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public UserFullProfileResponseDto User { get; set; }
    }

    public class AddressResponseDto
    {
        public Guid AddressId { get; set; }
        public string? AddressLine { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Zipcode { get; set; }
        public string? Country { get; set; }
    }


}
