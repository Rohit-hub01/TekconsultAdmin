using System;
using TekConsult.Enums;

namespace TekConsult.Dto
{
    public class SessionRequestDto
    {
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public int Mode { get; set; } // 0=Chat, 1=Call
        public DateTime RequestedAt { get; set; }
        public SessionState State { get; set; }
        public string? ProfilePhotoUrl { get; set; }
    }
}
