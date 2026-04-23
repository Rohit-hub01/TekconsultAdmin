using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TekConsult.Enums;

namespace TekConsult.Entities
{
    public class ConsultationSessions
    {
        [Key]
        public Guid SessionId { get; set; }

        public int Mode { get; set; }
        public SessionState State { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int? TotalDurationSeconds { get; set; }
        public decimal TotalChargedAmount { get; set; }
        public decimal ConsultantEarnings { get; set; }
        public decimal AppliedRate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? MaxAllowedEndTime { get; set; }
        public bool IsDisputed { get; set; }

        public ICollection<SessionParticipants> Participants { get; set; }
    }


}