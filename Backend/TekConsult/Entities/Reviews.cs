using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class Reviews
    {
        [Key]
        public Guid ReviewId { get; set; }

        [ForeignKey("ConsultationSessions")]
        public Guid SessionId { get; set; }

        [ForeignKey("Users")]
        public Guid UserId { get; set; }

        [ForeignKey("Users")]
        public Guid ConsultantId { get; set; }

        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsModerated { get; set; }
        public DateTime CreatedAt { get; set; }

        public ConsultationSessions? ConsultationSessions { get; set; }
    }
}