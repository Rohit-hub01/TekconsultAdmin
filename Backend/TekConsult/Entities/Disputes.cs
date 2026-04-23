using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class Disputes
    {
        [Key]
        public Guid DisputeId { get; set; }

        public Guid SessionId { get; set; }

        [ForeignKey("SessionId")]
        public ConsultationSessions Session { get; set; }

        public Guid RaisedByUserId { get; set; }

        public string? Description { get; set; }

        public int Status { get; set; } // Uses DisputeStatus enum

        public decimal RefundAmount { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? ResolvedAt { get; set; }
    }

}
