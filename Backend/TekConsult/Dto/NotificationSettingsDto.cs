namespace TekConsult.Dto
{
    public class NotificationSettingsDto
    {
        public bool NewConsultantApplications { get; set; }
        public bool DisputeAlerts { get; set; }
        public bool WithdrawalRequests { get; set; }
        public bool FailedTransactions { get; set; }
    }
}
