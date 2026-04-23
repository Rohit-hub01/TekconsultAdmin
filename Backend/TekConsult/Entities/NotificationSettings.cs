using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class NotificationSettings
    {
        [Key]
        public int Id { get; set; }

        public bool NewConsultantApplications { get; set; }

        public bool DisputeAlerts { get; set; }

        public bool WithdrawalRequests { get; set; }

        public bool FailedTransactions { get; set; }

        public DateTime UpdatedAt { get; set; }

        public Guid? UpdatedBy { get; set; }
    }
}
