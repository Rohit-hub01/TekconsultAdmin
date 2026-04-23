using Microsoft.EntityFrameworkCore;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.Enums;
using TekConsult.ServiceResult;

namespace TekConsult.Services
{
    public interface INotificationSettingsService
    {
        Task<ServiceResult<NotificationSettingsDto>> GetNotificationSettingsAsync();
        Task<ServiceResult<NotificationSettingsDto>> UpdateNotificationSettingsAsync(Guid adminId, UpdateNotificationSettingsDto dto);
        Task<bool> IsNotificationEnabledAsync(NotificationType type);
    }

    public class NotificationSettingsService : INotificationSettingsService
    {
        private readonly AppDbContext _dbContext;
        private readonly IAuditLogService _auditLogService;

        public NotificationSettingsService(AppDbContext dbContext, IAuditLogService auditLogService)
        {
            _dbContext = dbContext;
            _auditLogService = auditLogService;
        }

        public async Task<ServiceResult<NotificationSettingsDto>> GetNotificationSettingsAsync()
        {
            try
            {
                var settings = await GetOrCreateSettingsAsync();

                return new ServiceResult<NotificationSettingsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Notification settings loaded",
                    Data = MapDto(settings)
                };
            }
            catch
            {
                return new ServiceResult<NotificationSettingsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to load notification settings",
                    Data = null
                };
            }
        }

        public async Task<ServiceResult<NotificationSettingsDto>> UpdateNotificationSettingsAsync(Guid adminId, UpdateNotificationSettingsDto dto)
        {
            if (dto == null ||
                (!dto.NewConsultantApplications.HasValue &&
                 !dto.DisputeAlerts.HasValue &&
                 !dto.WithdrawalRequests.HasValue &&
                 !dto.FailedTransactions.HasValue))
            {
                return new ServiceResult<NotificationSettingsDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "No settings provided",
                    Data = null
                };
            }

            try
            {
                var settings = await GetOrCreateSettingsAsync();
                var oldValue = $"NewConsultantApplications={settings.NewConsultantApplications}, DisputeAlerts={settings.DisputeAlerts}, WithdrawalRequests={settings.WithdrawalRequests}, FailedTransactions={settings.FailedTransactions}";

                if (dto.NewConsultantApplications.HasValue)
                {
                    settings.NewConsultantApplications = dto.NewConsultantApplications.Value;
                }

                if (dto.DisputeAlerts.HasValue)
                {
                    settings.DisputeAlerts = dto.DisputeAlerts.Value;
                }

                if (dto.WithdrawalRequests.HasValue)
                {
                    settings.WithdrawalRequests = dto.WithdrawalRequests.Value;
                }

                if (dto.FailedTransactions.HasValue)
                {
                    settings.FailedTransactions = dto.FailedTransactions.Value;
                }

                settings.UpdatedAt = DateTime.UtcNow;
                settings.UpdatedBy = adminId;

                await _dbContext.SaveChangesAsync();

                var newValue = $"NewConsultantApplications={settings.NewConsultantApplications}, DisputeAlerts={settings.DisputeAlerts}, WithdrawalRequests={settings.WithdrawalRequests}, FailedTransactions={settings.FailedTransactions}";
                await _auditLogService.LogAsync(
                    "NOTIFICATION_SETTINGS_UPDATE",
                    nameof(NotificationSettings),
                    settings.Id.ToString(),
                    adminId,
                    oldValue,
                    newValue
                );

                return new ServiceResult<NotificationSettingsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Notification settings updated",
                    Data = MapDto(settings)
                };
            }
            catch
            {
                return new ServiceResult<NotificationSettingsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to update notification settings",
                    Data = null
                };
            }
        }

        public async Task<bool> IsNotificationEnabledAsync(NotificationType type)
        {
            var settings = await GetOrCreateSettingsAsync();

            switch (type)
            {
                case NotificationType.NewConsultantSignup:
                    return settings.NewConsultantApplications;
                case NotificationType.NewWithdrawalRequest:
                    return settings.WithdrawalRequests;
                case NotificationType.NewDisputeRaised:
                case NotificationType.DisputeAgainstConsultant:
                case NotificationType.DisputeResolved:
                    return settings.DisputeAlerts;
                default:
                    return true;
            }
        }

        private async Task<NotificationSettings> GetOrCreateSettingsAsync()
        {
            var settings = await _dbContext.NotificationSettings.FirstOrDefaultAsync();
            if (settings != null)
            {
                return settings;
            }

            settings = new NotificationSettings
            {
                NewConsultantApplications = true,
                DisputeAlerts = true,
                WithdrawalRequests = true,
                FailedTransactions = true,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = null
            };

            _dbContext.NotificationSettings.Add(settings);
            await _dbContext.SaveChangesAsync();

            return settings;
        }

        private static NotificationSettingsDto MapDto(NotificationSettings settings)
        {
            return new NotificationSettingsDto
            {
                NewConsultantApplications = settings.NewConsultantApplications,
                DisputeAlerts = settings.DisputeAlerts,
                WithdrawalRequests = settings.WithdrawalRequests,
                FailedTransactions = settings.FailedTransactions
            };
        }
    }
}
