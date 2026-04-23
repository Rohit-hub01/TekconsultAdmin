using System.Runtime.InteropServices;

namespace TekConsult.Dto
{
    public class AdminUserListSpDto
    {
        public Guid UserId { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? CountryCode { get; set; }
        public string? PhoneNumber { get; set; }
        public bool Status { get; set; }
        public bool IsPhoneVerified { get; set; }
        public bool IsConsultantVerified { get; set; }
        public DateTime CreatedOn { get; set; }
        public string RoleName { get; set; }

        public Guid? ConsultantProfileId { get; set; }
        public string? Bio { get; set; }
        public int? ExperienceYears { get; set; }
        public decimal? ChatRatePerMinute { get; set; }
        public decimal? CallRatePerMinute { get; set; }
        public bool? IsOnline { get; set; }
        public int? FreeMinutesOffer { get; set; }
        public decimal? AverageRating { get; set; }
        public int? TotalSessionsCompleted { get; set; }

        public Guid? AddressId { get; set; }
        public string? AddressLine { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Zipcode { get; set; }
        public string? Country { get; set; }
    }

    public class GetUsersForAdminDto
    {
        public int Skip { get; set; }
        public int Take { get; set; }
        public bool IsConsultant { get; set; }
    }

}