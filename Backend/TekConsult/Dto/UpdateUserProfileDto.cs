namespace TekConsult.Dto
{
    public class UpdateUserProfileDto
    {
        public Guid? UserId { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        // Address
        public string? AddressLine { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Zipcode { get; set; }
        public string? Country { get; set; }

        public string? Bio { get; set; }
        public int? ExperienceYears { get; set; }
        public decimal? ChatRatePerMinute { get; set; }
        public string? ConsultantCategory { get; set; }
        public decimal? CallRatePerMinute { get; set; }
        public bool? IsOnline { get; set; }
        public int? FreeMinutesOffer { get; set; }
        public string? Gender { get; set; }
        public string? Languages { get; set; }
        public string? ProfilePhotoUrl { get; set; }
        public bool? Status { get; set; }

        // Discount fields
        public decimal? DiscountedChatRate { get; set; }
        public bool? IsChatDiscountActive { get; set; }
        public decimal? DiscountedCallRate { get; set; }
        public bool? IsCallDiscountActive { get; set; }
        public DateTime? DiscountStart { get; set; }
        public DateTime? DiscountEnd { get; set; }
    }

}
