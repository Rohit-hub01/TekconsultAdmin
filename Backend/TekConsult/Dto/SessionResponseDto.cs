using System;
using System.Collections.Generic;
using TekConsult.Enums;

namespace TekConsult.Dto
{
    public class SessionResponseDto
    {
        public Guid SessionId { get; set; }
        public int Mode { get; set; }
        public SessionState State { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public DateTime? MaxAllowedEndTime { get; set; }
        public decimal TotalChargedAmount { get; set; }
        public decimal ConsultantEarnings { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDisputed { get; set; }
        public decimal AppliedRate { get; set; }
        public string? AgoraToken { get; set; }
        public List<SessionParticipantDto> Participants { get; set; } = new();
    }

    public class SessionParticipantDto
    {
        public Guid UserId { get; set; }
        public string? FullName { get; set; }
        public string? Role { get; set; }
        public string? ProfilePhotoUrl { get; set; }

    }
}
