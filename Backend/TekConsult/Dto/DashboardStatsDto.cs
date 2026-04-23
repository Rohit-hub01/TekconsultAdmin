namespace TekConsult.Dto
{
    public class DashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalConsultants { get; set; }
        public int ActiveSessions { get; set; }
        public int TotalCategories { get; set; }
        public decimal TotalTransactionValue { get; set; }
        public int TotalDisputes { get; set; }
        public int ResolvedDisputes { get; set; }
        public int PendingDisputes { get; set; }
    }

    public class DashboardOverviewDto
    {
        public DashboardStatsDto Stats { get; set; }
        public List<DashboardUserActivityDto> RecentActivity { get; set; }
        public List<DashboardTopCategoryDto> TopCategories { get; set; }
        public DashboardRevenueChartDto RevenueData { get; set; }
    }

    public class DashboardUserActivityDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string ActivityType { get; set; }
        public DateTime ActivityDate { get; set; }
    }

    public class DashboardTopCategoryDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int SessionCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class DashboardRevenueChartDto
    {
        public List<string> Dates { get; set; }
        public List<decimal> Revenue { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class DashboardConsultantStatsDto
    {
        public int TotalConsultants { get; set; }
        public int ActiveConsultants { get; set; }
        public int TotalSessions { get; set; }
        public decimal AverageRating { get; set; }
        public List<ConsultantPerformanceDto> TopPerformers { get; set; }
    }

    public class ConsultantPerformanceDto
    {
        public Guid ConsultantId { get; set; }
        public string ConsultantName { get; set; }
        public int SessionCount { get; set; }
        public decimal AverageRating { get; set; }
        public decimal TotalEarnings { get; set; }
    }

    public class DashboardSessionMetricsDto
    {
        public int TotalSessions { get; set; }
        public int CompletedSessions { get; set; }
        public int OngoingSessions { get; set; }
        public int CancelledSessions { get; set; }
        public decimal AverageSessionDuration { get; set; }
        public decimal AverageSessionRating { get; set; }
    }

    // Analytics DTOs
    public class AnalyticsSummaryDto
    {
        public decimal TotalGmv { get; set; }
        public decimal PlatformRevenue { get; set; }
        public int TotalSessions { get; set; }
        public int NewUsersMonth { get; set; }
    }

    public class RevenueTrendDto
    {
        public string Month { get; set; }
        public decimal Gmv { get; set; }
        public decimal Revenue { get; set; }
    }

    public class CategoryDistributionDto
    {
        public string Name { get; set; }
        public int Value { get; set; }
        public string Color { get; set; }
    }

    public class UserGrowthDto
    {
        public string Month { get; set; }
        public int Users { get; set; }
        public int Consultants { get; set; }
    }

    public class AnalyticsDataDto
    {
        public AnalyticsSummaryDto Summary { get; set; }
        public List<RevenueTrendDto> RevenueTrend { get; set; }
        public List<CategoryDistributionDto> CategoryDistribution { get; set; }
        public List<UserGrowthDto> UserGrowth { get; set; }
    }
}
