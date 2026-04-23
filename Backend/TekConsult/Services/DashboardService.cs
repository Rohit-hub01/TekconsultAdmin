using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.ServiceResult;
using TekConsult.Enums;


namespace TekConsult.Services
{
    public interface IDashboardService
    {
        Task<ServiceResult<DashboardStatsDto>> GetDashboardStatsAsync();
        Task<ServiceResult<DashboardOverviewDto>> GetDashboardOverviewAsync();
        Task<ServiceResult<DashboardConsultantStatsDto>> GetConsultantStatsAsync();
        Task<ServiceResult<DashboardSessionMetricsDto>> GetSessionMetricsAsync();
        Task<ServiceResult<DashboardRevenueChartDto>> GetRevenueChartAsync(int days = 30);
        Task<ServiceResult<AnalyticsDataDto>> GetAnalyticsAsync(string period = "last30");
        Task<ServiceResult<ConsultantDashboardStatsDto>> GetConsultantDashboardStatsAsync(Guid consultantId);
        Task<ServiceResult<UserDashboardStatsDto>> GetUserDashboardStatsAsync(Guid userId);
        Task<ServiceResult<bool>> UpdateOnlineStatusAsync(Guid userId, bool isOnline);
        Task<ServiceResult<List<CategoryDistributionDto>>> GetSessionsByCategoryAsync(int days);
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public DashboardService(AppDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task<ServiceResult<DashboardStatsDto>> GetDashboardStatsAsync()
        {
            try
            {
                var totalUsers = await _dbContext.Users.CountAsync();
                var totalConsultants = await _dbContext.ConsultantProfiles.CountAsync();
                var activeSessions = await _dbContext.ConsultationSessions
                    .Where(s => s.State == SessionState.Active)
                    .CountAsync();
                var totalCategories = await _dbContext.Categories.CountAsync();
                var totalTransactionValue = await _dbContext.Transactions
                    .Where(t => t.Status == 1)
                    .SumAsync(t => t.Amount);
                var totalDisputes = await _dbContext.Disputes.CountAsync();
                var resolvedDisputes = await _dbContext.Disputes
                    .Where(d => d.Status == 2)
                    .CountAsync();
                var pendingDisputes = await _dbContext.Disputes
                    .Where(d => d.Status == 0)
                    .CountAsync();

                return new ServiceResult<DashboardStatsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Dashboard statistics retrieved successfully.",
                    Data = new DashboardStatsDto
                    {
                        TotalUsers = totalUsers,
                        TotalConsultants = totalConsultants,
                        ActiveSessions = activeSessions,
                        TotalCategories = totalCategories,
                        TotalTransactionValue = totalTransactionValue,
                        TotalDisputes = totalDisputes,
                        ResolvedDisputes = resolvedDisputes,
                        PendingDisputes = pendingDisputes
                    }
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<DashboardStatsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving dashboard statistics: {ex.Message}"
                };
            }
        }

        public async Task<ServiceResult<DashboardOverviewDto>> GetDashboardOverviewAsync()
        {
            try
            {
                var stats = await GetDashboardStatsAsync();
                var recentActivity = await GetRecentActivityAsync();
                var topCategories = await GetTopCategoriesAsync();
                var revenueData = await GetRevenueChartAsync(30);

                var overview = new DashboardOverviewDto
                {
                    Stats = stats.Data,
                    RecentActivity = recentActivity.Data,
                    TopCategories = topCategories.Data,
                    RevenueData = revenueData.Data
                };

                return new ServiceResult<DashboardOverviewDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Dashboard overview retrieved successfully.",
                    Data = overview
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<DashboardOverviewDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving dashboard overview: {ex.Message}"
                };
            }
        }

        public async Task<ServiceResult<DashboardConsultantStatsDto>> GetConsultantStatsAsync()
        {
            try
            {
                var totalConsultants = await _dbContext.ConsultantProfiles.CountAsync();
                var activeConsultants = await _dbContext.ConsultantProfiles
                    .Where(c => c.IsOnline)
                    .CountAsync();

                var topPerformers = await _dbContext.ConsultantProfiles
                    .Include(c => c.User)
                    .OrderByDescending(c => c.AverageRating)
                    .Take(5)
                    .ToListAsync();

                var performerDtos = topPerformers.Select(c => new ConsultantPerformanceDto
                {
                    ConsultantId = c.ConsultantProfileId,
                    ConsultantName = (c.User?.FirstName ?? "") + " " + (c.User?.LastName ?? ""),
                    SessionCount = c.TotalSessionsCompleted,
                    AverageRating = c.AverageRating,
                    TotalEarnings = 0
                }).ToList();

                var totalSessions = await _dbContext.ConsultationSessions.CountAsync();
                var avgRating = await _dbContext.ConsultantProfiles
                    .AverageAsync(c => (double)c.AverageRating);

                return new ServiceResult<DashboardConsultantStatsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Consultant statistics retrieved successfully.",
                    Data = new DashboardConsultantStatsDto
                    {
                        TotalConsultants = totalConsultants,
                        ActiveConsultants = activeConsultants,
                        TotalSessions = totalSessions,
                        AverageRating = (decimal)avgRating,
                        TopPerformers = performerDtos
                    }
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<DashboardConsultantStatsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving consultant statistics: {ex.Message}"
                };
            }
        }

        public async Task<ServiceResult<DashboardSessionMetricsDto>> GetSessionMetricsAsync()
        {
            try
            {
                var totalSessions = await _dbContext.ConsultationSessions.CountAsync();
                var completedSessions = await _dbContext.ConsultationSessions
                    .Where(s => s.State == SessionState.Completed)
                    .CountAsync();
                var ongoingSessions = await _dbContext.ConsultationSessions
                    .Where(s => s.State == SessionState.Active)
                    .CountAsync();
                var cancelledSessions = await _dbContext.ConsultationSessions
                    .Where(s => s.State == SessionState.Rejected)
                    .CountAsync();

                var avgDuration = 0m;
                var sessionsWithDuration = await _dbContext.ConsultationSessions
                    .Where(s => s.EndTime.HasValue && s.StartTime.HasValue && s.TotalDurationSeconds.HasValue)
                    .Select(s => s.TotalDurationSeconds ?? 0)
                    .ToListAsync();

                if (sessionsWithDuration.Any())
                {
                    avgDuration = (decimal)sessionsWithDuration.Average() / 60; // Convert seconds to minutes
                }

                var avgRating = 0m;
                var reviews = await _dbContext.Reviews.ToListAsync();
                if (reviews.Any())
                {
                    avgRating = (decimal)reviews.Average(r => r.Rating);
                }

                return new ServiceResult<DashboardSessionMetricsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Session metrics retrieved successfully.",
                    Data = new DashboardSessionMetricsDto
                    {
                        TotalSessions = totalSessions,
                        CompletedSessions = completedSessions,
                        OngoingSessions = ongoingSessions,
                        CancelledSessions = cancelledSessions,
                        AverageSessionDuration = avgDuration,
                        AverageSessionRating = avgRating
                    }
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<DashboardSessionMetricsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving session metrics: {ex.Message}"
                };
            }
        }

        public async Task<ServiceResult<DashboardRevenueChartDto>> GetRevenueChartAsync(int days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-days);

                var revenueByDate = await _dbContext.Transactions
                    .Where(t => t.Timestamp >= startDate && t.Status == 1)
                    .GroupBy(t => t.Timestamp.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Amount = g.Sum(t => t.Amount)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                var dates = revenueByDate.Select(r => r.Date.ToString("yyyy-MM-dd")).ToList();
                var revenues = revenueByDate.Select(r => r.Amount).ToList();
                var totalRevenue = revenues.Sum();

                return new ServiceResult<DashboardRevenueChartDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Revenue chart data retrieved successfully.",
                    Data = new DashboardRevenueChartDto
                    {
                        Dates = dates,
                        Revenue = revenues,
                        TotalRevenue = totalRevenue
                    }
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<DashboardRevenueChartDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving revenue chart: {ex.Message}"
                };
            }
        }

        private async Task<ServiceResult<List<DashboardUserActivityDto>>> GetRecentActivityAsync()
        {
            try
            {
                var recentActivity = await _dbContext.AuditLogs
                    .OrderByDescending(a => a.Timestamp)
                    .Take(10)
                    .Select(a => new DashboardUserActivityDto
                    {
                        UserId = a.PerformedBy ?? Guid.Empty,
                        UserName = a.Action,
                        ActivityType = a.EntityName,
                        ActivityDate = a.Timestamp
                    })
                    .ToListAsync();

                return new ServiceResult<List<DashboardUserActivityDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Recent activity retrieved successfully.",
                    Data = recentActivity
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<DashboardUserActivityDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving recent activity: {ex.Message}"
                };
            }
        }

        private async Task<ServiceResult<List<DashboardTopCategoryDto>>> GetTopCategoriesAsync()
        {
            try
            {
                var topCategories = await _dbContext.Categories
                    .Select(c => new DashboardTopCategoryDto
                    {
                        CategoryId = c.CategoryId,
                        CategoryName = c.Name,
                        SessionCount = 0,
                        Revenue = 0
                    })
                    .OrderByDescending(c => c.SessionCount)
                    .Take(5)
                    .ToListAsync();

                return new ServiceResult<List<DashboardTopCategoryDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Top categories retrieved successfully.",
                    Data = topCategories
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<DashboardTopCategoryDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving top categories: {ex.Message}"
                };
            }
        }

        public async Task<ServiceResult<AnalyticsDataDto>> GetAnalyticsAsync(string period = "last30")
        {
            try
            {
                int days = period switch
                {
                    "last7" => 7,
                    "last30" => 30,
                    "last90" => 90,
                    _ => 30
                };

                var startDate = DateTime.UtcNow.AddDays(-days);

                // Summary Data
                var totalUsers = await _dbContext.Users.CountAsync();
                var totalConsultants = await _dbContext.ConsultantProfiles.CountAsync();
                var totalTransactions = await _dbContext.Transactions
                    .Where(t => t.Status == 1 && t.Timestamp >= startDate)
                    .SumAsync(t => t.Amount);

                var totalSessions = await _dbContext.ConsultationSessions
                    .Where(s => s.CreatedAt >= startDate)
                    .CountAsync();

                var newUsersThisMonth = await _dbContext.Users
                    .Where(u => u.CreatedOn >= DateTime.UtcNow.AddDays(-30))
                    .CountAsync();

                var summary = new AnalyticsSummaryDto
                {
                    TotalGmv = totalTransactions,
                    PlatformRevenue = totalTransactions * 0.15m, // Assuming 15% platform cut
                    TotalSessions = totalSessions,
                    NewUsersMonth = newUsersThisMonth
                };

                // Revenue Trend (Monthly data for last 6 months)
                var revenueTrend = new List<RevenueTrendDto>();
                for (int i = 5; i >= 0; i--)
                {
                    var monthStart = DateTime.UtcNow.AddMonths(-i);
                    var monthEnd = monthStart.AddMonths(1);
                    var monthGmv = await _dbContext.Transactions
                        .Where(t => t.Status == 1 && t.Timestamp >= monthStart && t.Timestamp < monthEnd)
                        .SumAsync(t => t.Amount);

                    revenueTrend.Add(new RevenueTrendDto
                    {
                        Month = monthStart.ToString("MMM"),
                        Gmv = monthGmv,
                        Revenue = monthGmv * 0.15m
                    });
                }

                // Category Distribution
                var categoryDistribution = new List<CategoryDistributionDto>
                {
                    new CategoryDistributionDto { Name = "Consulting", Value = 35, Color = "hsl(var(--chart-1))" },
                    new CategoryDistributionDto { Name = "Mentoring", Value = 25, Color = "hsl(var(--chart-2))" },
                    new CategoryDistributionDto { Name = "Coaching", Value = 20, Color = "hsl(var(--chart-3))" },
                    new CategoryDistributionDto { Name = "Training", Value = 20, Color = "hsl(var(--chart-4))" }
                };

                // User Growth (Monthly data for last 6 months)
                var userGrowth = new List<UserGrowthDto>();
                for (int i = 5; i >= 0; i--)
                {
                    var monthStart = DateTime.UtcNow.AddMonths(-i);
                    var monthEnd = monthStart.AddMonths(1);
                    var monthUsers = await _dbContext.Users
                        .Where(u => u.CreatedOn >= monthStart && u.CreatedOn < monthEnd)
                        .CountAsync();

                    var monthConsultants = await _dbContext.ConsultantProfiles
                        .Where(c => c.CreatedAt >= monthStart && c.CreatedAt < monthEnd)
                        .CountAsync();

                    userGrowth.Add(new UserGrowthDto
                    {
                        Month = monthStart.ToString("MMM"),
                        Users = monthUsers,
                        Consultants = monthConsultants
                    });
                }

                var analyticsData = new AnalyticsDataDto
                {
                    Summary = summary,
                    RevenueTrend = revenueTrend,
                    CategoryDistribution = categoryDistribution,
                    UserGrowth = userGrowth
                };

                return new ServiceResult<AnalyticsDataDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Analytics data retrieved successfully.",
                    Data = analyticsData
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<AnalyticsDataDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving analytics data: {ex.Message}"
                };
            }
        }
        public async Task<ServiceResult<UserDashboardStatsDto>> GetUserDashboardStatsAsync(Guid userId)
        {
            try
            {
                var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);

                var completedSessions = await _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                    .Where(s => s.State == SessionState.Completed &&
                                s.Participants.Any(p => p.UserId == userId))
                    .ToListAsync();

                var totalSpent = completedSessions.Sum(s => s.TotalChargedAmount);
                var numberOfSessions = completedSessions.Count;

                if (completedSessions.Any())
                {
                    // Deduct refunds from resolved disputes associated with these sessions
                    var sessionIds = completedSessions.Select(s => s.SessionId).ToList();
                    var refunds = await _dbContext.Disputes
                        .Where(d => sessionIds.Contains(d.SessionId) && d.Status == (int)DisputeStatus.Resolved)
                        .SumAsync(d => d.RefundAmount);

                    totalSpent -= refunds;
                }

                return new ServiceResult<UserDashboardStatsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "User dashboard statistics retrieved successfully.",
                    Data = new UserDashboardStatsDto
                    {
                        TotalSpent = totalSpent,
                        NumberOfSessions = numberOfSessions,
                        WalletBalance = wallet?.Balance ?? 0
                    }
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<UserDashboardStatsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving user dashboard statistics: {ex.Message}"
                };
            }
        }

        public async Task<ServiceResult<ConsultantDashboardStatsDto>> GetConsultantDashboardStatsAsync(Guid consultantId)
        {
            try
            {
                var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == consultantId);
                var profile = await _dbContext.ConsultantProfiles.FirstOrDefaultAsync(p => p.UserId == consultantId);

                // Total Earnings can be calculated by summing all credited transactions to the consultant's wallet
                // Or by summing ConsultantEarnings from completed sessions.
                // Using transactions for accuracy regarding actual money credited.
                var totalEarnings = 0m;
                var numberOfSessions = 0;

                // Calculate directly from sessions where this consultant participated
                var completedSessions = await _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                    .Where(s => s.State == SessionState.Completed && 
                                s.Participants.Any(p => p.UserId == consultantId))
                    .ToListAsync();

                if (completedSessions.Any())
                {
                    var sessionEarnings = completedSessions.Sum(s => s.ConsultantEarnings);
                    
                    // Deduct refunds from resolved disputes associated with these sessions
                    var sessionIds = completedSessions.Select(s => s.SessionId).ToList();
                    var refunds = await _dbContext.Disputes
                        .Where(d => sessionIds.Contains(d.SessionId) && d.Status == (int)DisputeStatus.Resolved)
                        .SumAsync(d => d.RefundAmount);

                    totalEarnings = sessionEarnings - refunds;
                    numberOfSessions = completedSessions.Count;
                }

                // Fallback/Combine with Wallet transactions if needed (e.g. strict wallet top-ups?)
                // But for "Consultant Earnings from Sessions", the above is authoritative based on SessionService logic.

                return new ServiceResult<ConsultantDashboardStatsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Consultant dashboard statistics retrieved successfully.",
                    Data = new ConsultantDashboardStatsDto
                    {
                        TotalEarnings = totalEarnings,
                        AverageRating = profile?.AverageRating ?? 0,
                        NumberOfSessions = numberOfSessions,
                        AvailableBalance = wallet?.Balance ?? 0,
                        IsOnline = profile?.IsOnline ?? false
                    }
                };

            }
            catch (Exception ex)
            {
                return new ServiceResult<ConsultantDashboardStatsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving consultant dashboard statistics: {ex.Message}"
                };
            }
        }
        public async Task<ServiceResult<bool>> UpdateOnlineStatusAsync(Guid userId, bool isOnline)
        {
            try
            {
                var profile = await _dbContext.ConsultantProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
                if (profile == null)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Consultant profile not found.",
                        Data = false
                    };
                }

                profile.IsOnline = isOnline;
                profile.ModifiedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();

                return new ServiceResult<bool>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = $"Consultant is now {(isOnline ? "online" : "offline")}.",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Error updating status: " + ex.Message,
                    Data = false
                };
            }
        }
        public async Task<ServiceResult<List<CategoryDistributionDto>>> GetSessionsByCategoryAsync(int days)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-days);

                // Get all sessions from the period
                var sessions = await _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                    .Where(s => s.CreatedAt >= startDate)
                    .ToListAsync();

                // Group by category (need to look up consultant for each session)
                var categoryCounts = new Dictionary<string, int>();

                foreach (var session in sessions)
                {
                    // Find the consultant participant
                    var consultantId = await _dbContext.SessionParticipants
                        .Where(p => p.SessionId == session.SessionId)
                        .Join(_dbContext.Users, p => p.UserId, u => u.UserId, (p, u) => u)
                        .Join(_dbContext.Roles, u => u.RoleId, r => r.RoleId, (u, r) => new { u, r })
                        .Where(x => x.r.RoleName == "Consultant" || x.r.RoleName == "consultant")
                        .Select(x => (Guid?)x.u.UserId)
                        .FirstOrDefaultAsync();

                    if (consultantId.HasValue)
                    {
                        var profile = await _dbContext.ConsultantProfiles.FirstOrDefaultAsync(cp => cp.UserId == consultantId.Value);
                        var category = profile?.ConsultantCategory ?? "Uncategorized";

                        if (categoryCounts.ContainsKey(category))
                            categoryCounts[category]++;
                        else
                            categoryCounts[category] = 1;
                    }
                    else
                    {
                        if (categoryCounts.ContainsKey("Uncategorized"))
                            categoryCounts["Uncategorized"]++;
                        else
                            categoryCounts["Uncategorized"] = 1;
                    }
                }

                var colors = new[] { "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))" };
                var result = categoryCounts
                    .OrderByDescending(x => x.Value)
                    .Select((x, index) => new CategoryDistributionDto
                    {
                        Name = x.Key,
                        Value = x.Value,
                        Color = colors[index % colors.Length]
                    })
                    .ToList();

                return new ServiceResult<List<CategoryDistributionDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Sessions by category retrieved successfully.",
                    Data = result
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<CategoryDistributionDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Error retrieving sessions by category: {ex.Message}"
                };
            }
        }
    }
}


