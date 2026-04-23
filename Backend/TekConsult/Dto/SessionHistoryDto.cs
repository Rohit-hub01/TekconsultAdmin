using System;
using TekConsult.Enums;

namespace TekConsult.Dto
{
    public class SessionHistoryDto
    {
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public int Mode { get; set; } // 0=Chat, 1=Call
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int DurationSeconds { get; set; }
        public decimal TotalChargedAmount { get; set; }
        public decimal ConsultantEarnings { get; set; }
        public SessionState State { get; set; } // Pending=0, Active=1, Completed=2, Rejected=3
        public int? Rating { get; set; }
        public string? ReviewComment { get; set; }
        public string? ProfilePhotoUrl { get; set; }
        public bool IsDisputed { get; set; }
    }
}
