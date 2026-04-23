using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class WithdrawalRequests
    {
        [Key]
        public Guid RequestId { get; set; }

        [ForeignKey(nameof(User))]
        public Guid ConsultantUserId { get; set; }

        public decimal Amount { get; set; }
        public string BankDetailsSnapshot { get; set; }
        public int Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }

        public Users? User { get; set; }
    }
}