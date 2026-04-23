using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class SessionBillingTicks
    {
        [Key]
        public Guid TickId { get; set; }

        [ForeignKey("ConsultationSessions")]
        public Guid SessionId { get; set; }

        public decimal AmountDeducted { get; set; }
        public decimal BalanceAfterDeduction { get; set; }
        public DateTime Timestamp { get; set; }

        public ConsultationSessions? ConsultationSessions { get; set; }
    }
}