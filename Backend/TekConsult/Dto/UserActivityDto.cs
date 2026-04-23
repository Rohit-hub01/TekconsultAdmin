using System;

namespace TekConsult.Dto
{
    public class UserActivityDto
    {
        public string Action { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
