namespace TekConsult.Dto
{
    public class CategoryStatsDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int TotalConsultants { get; set; }
        public int ActiveSessionsCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
