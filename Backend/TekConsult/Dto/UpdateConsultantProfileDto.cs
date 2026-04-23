namespace TekConsult.Dto
{
    public class UpdateConsultantProfileDto
    {
        public string? Bio { get; set; }
        public int? ExperienceYears { get; set; }
        public decimal? ChatRatePerMinute { get; set; }
        public decimal? CallRatePerMinute { get; set; }
        public bool? IsOnline { get; set; }
        public int? FreeMinutesOffer { get; set; }
    }

    public class UpdateConsultantVerificationStatusDto
    {
        public Guid UserId { get; set; }
        public bool IsConsultantVerified { get; set; }
    }

}
