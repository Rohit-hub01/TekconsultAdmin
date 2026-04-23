using TekConsult.Enums;

namespace TekConsult.Dto
{
    public class ActiveSessionRowDto
    {
        public Guid SessionId { get; set; }

        public string UserName { get; set; }
        public string UserPhone { get; set; }

        public string ConsultantName { get; set; }
        public string ConsultantCategory { get; set; }

        public int Mode { get; set; } // 0=Chat,1=Call

        public int DurationSeconds { get; set; }
        public DateTime? StartTime { get; set; }

        public decimal RatePerMinute { get; set; }
        public decimal TotalBilled { get; set; }
        public decimal UserBalance { get; set; }

        public SessionState State { get; set; }
    }
}
