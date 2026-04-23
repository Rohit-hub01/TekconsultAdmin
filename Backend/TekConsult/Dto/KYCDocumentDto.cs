using System;
using Microsoft.AspNetCore.Http;

namespace TekConsult.Dto
{
    public class UploadKYCDocumentDto
    {
        public string DocumentType { get; set; }
        public IFormFile File { get; set; }
    }

    public class KYCDocumentResponseDto
    {
        public Guid DocId { get; set; }
        public string DocumentType { get; set; }
        public string DocumentUrl { get; set; }
        public int VerificationStatus { get; set; }
        public string? AdminFeedback { get; set; }
        public DateTime UploadedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }

    public class UpdateKYCStatusDto
    {
        public Guid DocId { get; set; }
        public int Status { get; set; } // Uses KYCStatus enum
        public string? AdminFeedback { get; set; }
    }
}
