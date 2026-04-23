namespace TekConsult.Dto
{
    public class ConsultantDashboardStatsDto
    {
        public decimal TotalEarnings { get; set; }
        public decimal AverageRating { get; set; }
        public int NumberOfSessions { get; set; }
        public decimal AvailableBalance { get; set; }
        public bool IsOnline { get; set; }
    }
}

