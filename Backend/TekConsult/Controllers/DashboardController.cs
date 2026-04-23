using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using TekConsult.Dto;
using TekConsult.ServiceResult;
using TekConsult.Services;


namespace TekConsult.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase

    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// Get dashboard statistics (total users, consultants, sessions, etc.)
        /// </summary>
        /// <returns>Dashboard statistics</returns>
        [Authorize]
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("admin")) return Forbid();
                var result = await _dashboardService.GetDashboardStatsAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get complete dashboard overview with stats, recent activity, top categories, and revenue data
        /// </summary>
        /// <returns>Dashboard overview</returns>
        [Authorize]
        [HttpGet("overview")]
        public async Task<IActionResult> GetDashboardOverview()
        {
            try
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("admin")) return Forbid();
                var result = await _dashboardService.GetDashboardOverviewAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get consultant statistics and top performers
        /// </summary>
        /// <returns>Consultant statistics</returns>
        [Authorize]
        [HttpGet("consultant-stats")]
        public async Task<IActionResult> GetConsultantStats()
        {
            try
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("admin")) return Forbid();
                var result = await _dashboardService.GetConsultantStatsAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get session metrics including average duration and rating
        /// </summary>
        /// <returns>Session metrics</returns>
        [Authorize]
        [HttpGet("session-metrics")]
        public async Task<IActionResult> GetSessionMetrics()
        {
            try
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("admin")) return Forbid();
                var result = await _dashboardService.GetSessionMetricsAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get revenue chart data for specified number of days
        /// </summary>
        /// <param name="days">Number of days to retrieve (default: 30)</param>
        /// <returns>Revenue chart data</returns>
        [Authorize]
        [HttpGet("revenue-chart")]
        public async Task<IActionResult> GetRevenueChart([FromQuery] int days = 30)
        {
            try
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("admin")) return Forbid();
                if (days <= 0 || days > 365)
                {
                    return BadRequest(new ServiceResult<string>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Days parameter must be between 1 and 365."
                    });
                }

                var result = await _dashboardService.GetRevenueChartAsync(days);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get analytics data for specified period
        /// </summary>
        /// <param name="period">Period: last7, last30, last90 (default: last30)</param>
        /// <returns>Analytics data including revenue trend, category distribution, and user growth</returns>
        [Authorize]
        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics([FromQuery] string period = "last30")
        {
            try
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("admin")) return Forbid();
                if (!new[] { "last7", "last30", "last90" }.Contains(period))
                {
                    return BadRequest(new ServiceResult<string>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Period must be one of: last7, last30, last90."
                    });
                }

                var result = await _dashboardService.GetAnalyticsAsync(period);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }
        [Authorize]
        [HttpGet("user-stats")]
        public async Task<IActionResult> GetUserStats([FromQuery] Guid? userId)
        {
            try
            {
                if (!User.IsInRole("User") && !User.IsInRole("Consultant") && !User.IsInRole("Admin") && !User.IsInRole("admin"))
                {
                    return Forbid();
                }

                Guid targetUserId;
                var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                
                if (userId.HasValue && (User.IsInRole("Admin") || User.IsInRole("admin")))
                {
                    targetUserId = userId.Value;
                }
                else
                {
                    targetUserId = currentUserId;
                }

                var result = await _dashboardService.GetUserDashboardStatsAsync(targetUserId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<UserDashboardStatsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [Authorize]
        [HttpGet("advisor-stats")]
        public async Task<IActionResult> GetAdvisorStats([FromQuery] Guid? userId)
        {
            try
            {
                if (!User.IsInRole("Consultant") && !User.IsInRole("Admin") && !User.IsInRole("admin"))
                {
                    return Forbid();
                }

                Guid targetUserId;
                var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                
                if (userId.HasValue && (User.IsInRole("Admin") || User.IsInRole("admin")))
                {
                    targetUserId = userId.Value;
                }
                else
                {
                    targetUserId = currentUserId;
                }

                var result = await _dashboardService.GetConsultantDashboardStatsAsync(targetUserId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<ConsultantDashboardStatsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }
        [Authorize(Roles = "Consultant")]

        [HttpPost("update-online-status")]
        public async Task<IActionResult> UpdateOnlineStatus([FromBody] UpdateOnlineStatusDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                bool isOnline = dto.Status == 1;
                var result = await _dashboardService.UpdateOnlineStatusAsync(userId, isOnline);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message,
                    Data = false
                });
            }
        }
        [Authorize]
        [HttpGet("sessions-by-category")]
        public async Task<IActionResult> GetSessionsByCategory([FromQuery] int days = 14)
        {
            try
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("admin")) return Forbid();
                var result = await _dashboardService.GetSessionsByCategoryAsync(days);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }
    }
}


