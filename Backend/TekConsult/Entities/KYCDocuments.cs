using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class KYCDocuments
    {
        [Key]
        public Guid DocId { get; set; }

        [ForeignKey("ConsultantProfiles")]
        public Guid ConsultantProfileId { get; set; }

        public string DocumentType { get; set; }
        public string DocumentUrl { get; set; }
        public int VerificationStatus { get; set; }
        public string? AdminFeedback { get; set; }
        public DateTime UploadedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }

        public ConsultantProfiles? ConsultantProfiles { get; set; }
    }
}