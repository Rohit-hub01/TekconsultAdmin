using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class ConsultantProfiles
    {
        [Key]
        public Guid ConsultantProfileId { get; set; }

        [ForeignKey("Users")]
        public Guid UserId { get; set; }

        public string? Bio { get; set; }
        public int? ExperienceYears { get; set; }

        public decimal ChatRatePerMinute { get; set; }
        public decimal CallRatePerMinute { get; set; }
        public decimal? DiscountedChatRate { get; set; }
        public bool IsChatDiscountActive { get; set; }
        public decimal? DiscountedCallRate { get; set; }
        public bool IsCallDiscountActive { get; set; }
        public DateTime? DiscountStart { get; set; }
        public DateTime? DiscountEnd { get; set; }

        public string? ConsultantCategory { get; set; }
        public bool IsOnline { get; set; }
        public int FreeMinutesOffer { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalSessionsCompleted { get; set; }
        public string? Gender { get; set; }
        public string? Languages { get; set; }
        public string? ProfilePhotoUrl { get; set; }
 
        public DateTime CreatedAt { get; set; }
        public DateTime? ModifiedAt { get; set; }

        public Users? User { get; set; }
    }
}