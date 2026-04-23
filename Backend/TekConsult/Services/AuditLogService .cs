using Microsoft.EntityFrameworkCore;
using System.Runtime.InteropServices;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.ServiceResult;
namespace TekConsult.Services
{
    public interface IAuditLogService
    {
        Task<ServiceResult<bool>> LogAsync(string action, string entityName, string? entityId, Guid? performedBy, string? oldValue, string? newValue);
        Task<ServiceResult<List<UserActivityDto>>> GetRecentActivitiesAsync(Guid userId, int take = 4);


    }
    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _dbContext;

        public AuditLogService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
          
        }

        public async Task<ServiceResult<bool>> LogAsync(string action, string entityName, string? entityId, Guid? performedBy, string? oldValue, string? newValue)
        {
            try
            {
                var log = new AuditLogs
                {
                    AuditId = Guid.NewGuid(),
                    Action = action,
                    EntityName = entityName,
                    EntityId = entityId,
                    PerformedBy = performedBy,
                    OldValue = oldValue,
                    NewValue = newValue,
                    Timestamp = DateTime.UtcNow
                };

                _dbContext.AuditLogs.Add(log);
                await _dbContext.SaveChangesAsync();

                return new ServiceResult<bool>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Audit log saved.",
                    Data = true
                };
            }
            catch (Exception ex)
            {

                // ❗ DO NOT THROW — audit failure must not break business flow
                return new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to save audit log.",
                    Data = false
                };
            }
        }

        public async Task<ServiceResult<List<UserActivityDto>>> GetRecentActivitiesAsync(Guid userId, int take = 4)
        {
            try
            {
                var logs = await _dbContext.AuditLogs
                    .Where(l => l.PerformedBy == userId)
                    .OrderByDescending(l => l.Timestamp)
                    .Take(take)
                    .Select(l => new
                    {
                        l.Action,
                        l.NewValue,
                        l.OldValue,
                        l.Timestamp
                    })
                    .ToListAsync();

                var activities = logs.Select(l => new UserActivityDto
                {
                    Action = l.Action,
                    Message = GetFriendlyMessage(l.Action, l.NewValue, l.OldValue),
                    Timestamp = l.Timestamp
                }).ToList();

                return new ServiceResult<List<UserActivityDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Recent activities fetched.",
                    Data = activities
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<UserActivityDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to fetch recent activities: " + ex.Message,
                    Data = null
                };
            }
        }

        private string GetFriendlyMessage(string action, string? newValue, string? oldValue)
        {
            try
            {
                switch (action)
                {
                    case "LOGIN":
                    case "LOGIN_EMAIL":
                        return "Logged in successfully";

                    case "SIGNUP":
                        return "Account created successfully";

                    case "UPDATE_PROFILE":
                        return "Updated profile details";

                    case "SESSION_ENDED":
                        // "State: 2 (Completed), Duration: 120s, Amount: 500"
                        if (!string.IsNullOrEmpty(newValue) && newValue.Contains("Duration:"))
                        {
                            var parts = newValue.Split(',');
                            var durationPart = parts.FirstOrDefault(p => p.Trim().StartsWith("Duration:"))?.Split(':')[1]?.Trim();
                            var amountPart = parts.FirstOrDefault(p => p.Trim().StartsWith("Amount:"))?.Split(':')[1]?.Trim();
                            
                            if (durationPart != null && amountPart != null)
                                return $"Completed a session ({durationPart}, \u20B9{amountPart})";
                            else if (durationPart != null)
                                return $"Completed a session ({durationPart})";
                        }
                        return "Completed a consultation session";

                    case "REVIEW_SUBMITTED":
                        // "Rating: 5, ConsultantId: ..., Comment Length: ..."
                        if (!string.IsNullOrEmpty(newValue) && newValue.Contains("Rating:"))
                        {
                            var rating = newValue.Split(',')[0].Split(':')[1].Trim();
                            return $"Submitted a {rating}-star review";
                        }
                        return "Submitted a review";

                    case "DISPUTE_RAISED":
                         return "Raised a dispute for a session";

                    case "DISPUTE_RESOLVED":
                        // "Status: Resolved, ActualRefund: 500"
                        if (!string.IsNullOrEmpty(newValue) && newValue.Contains("ActualRefund:"))
                        {
                            var refund = newValue.Split(',').FirstOrDefault(p => p.Trim().StartsWith("ActualRefund:"))?.Split(':')[1]?.Trim();
                             return $"Dispute resolved (Refund: \u20B9{refund})";
                        }
                        return "Dispute resolved";

                    case "WITHDRAWAL_REQUEST":
                         // "Amount: 500, Status: Pending"
                         if (!string.IsNullOrEmpty(newValue) && newValue.Contains("Amount:"))
                         {
                             var amount = newValue.Split(',')[0].Split(':')[1].Trim();
                             return $"Requested withdrawal of \u20B9{amount}";
                         }
                         return "Requested a withdrawal";
                         
                    case "WITHDRAWAL_APPROVED":
                         if (!string.IsNullOrEmpty(newValue) && newValue.Contains("Amount:"))
                         {
                             var amount = newValue.Split(',').LastOrDefault()?.Split(':')[1]?.Trim();
                             return $"Withdrawal of \u20B9{amount} approved";
                         }
                         return "Withdrawal approved";

                    case "WITHDRAWAL_REJECTED":
                         return "Withdrawal request rejected";

                    case "RATE_UPDATED":
                        return "Updated consultation rates";

                    default:
                        // Convert snake_case to Sentence case
                        return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(action.Replace("_", " ").ToLower());
                }
            }
            catch
            {
                return action;
            }
        }


    }
}

