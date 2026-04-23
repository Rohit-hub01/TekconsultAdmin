using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class Users
    {
        [Key]
        public Guid UserId { get; set; }
        public string? FirstName { get; set; }

        public string? MiddleName { get; set; }

        public string? LastName { get; set; }
        public string? CountryCode { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }

        [Required]
        public bool Status { get; set; }

        [ForeignKey("Roles")]
        public int RoleId { get; set; }
        [Required]
        public DateTime CreatedOn { get; set; }
        public Roles Roles { get; set; }
        public bool IsPhoneVerified { get; set; }
        public bool IsConsultantVerified { get; set; }

        public string? ProfilePhotoUrl { get; set; }
        public Addresses? Addresses { get; set; }
        public ConsultantProfiles? ConsultantProfiles { get; set; }

    }
}
