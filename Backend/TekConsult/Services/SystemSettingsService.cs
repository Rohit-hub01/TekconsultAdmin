using Microsoft.EntityFrameworkCore;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.ServiceResult;

namespace TekConsult.Services
{
    public interface ISystemSettingsService
    {
        Task<ServiceResult<SystemSettingsDto>> GetSystemSettingsAsync();
        Task<ServiceResult<SystemSettingsDto>> UpdateSystemSettingsAsync(Guid adminId, UpdateSystemSettingsDto dto);
    }

    public class SystemSettingsService : ISystemSettingsService
    {
        private const decimal DefaultCommissionPercent = 20m;
        private const decimal DefaultMinimumWithdrawal = 500m;

        private readonly AppDbContext _dbContext;
        private readonly IAuditLogService _auditLogService;

        public SystemSettingsService(AppDbContext dbContext, IAuditLogService auditLogService)
        {
            _dbContext = dbContext;
            _auditLogService = auditLogService;
        }

        public async Task<ServiceResult<SystemSettingsDto>> GetSystemSettingsAsync()
        {
            try
            {
                var settings = await GetOrCreateSettingsAsync();

                return new ServiceResult<SystemSettingsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "System settings loaded",
                    Data = MapDto(settings)
                };
            }
            catch
            {
                return new ServiceResult<SystemSettingsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to load system settings",
                    Data = null
                };
            }
        }

        public async Task<ServiceResult<SystemSettingsDto>> UpdateSystemSettingsAsync(Guid adminId, UpdateSystemSettingsDto dto)
        {
            if (dto == null || (!dto.PlatformCommissionPercent.HasValue && !dto.MinimumWithdrawalAmount.HasValue))
            {
                return new ServiceResult<SystemSettingsDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "No settings provided",
                    Data = null
                };
            }

            if (dto.PlatformCommissionPercent.HasValue &&
                (dto.PlatformCommissionPercent.Value < 0 || dto.PlatformCommissionPercent.Value > 100))
            {
                return new ServiceResult<SystemSettingsDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "Platform commission must be between 0 and 100",
                    Data = null
                };
            }

            if (dto.MinimumWithdrawalAmount.HasValue && dto.MinimumWithdrawalAmount.Value < 0)
            {
                return new ServiceResult<SystemSettingsDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "Minimum withdrawal amount must be 0 or greater",
                    Data = null
                };
            }

            try
            {
                var settings = await GetOrCreateSettingsAsync();
                var oldValue = $"Commission={settings.PlatformCommissionPercent}, MinWithdrawal={settings.MinimumWithdrawalAmount}";

                if (dto.PlatformCommissionPercent.HasValue)
                {
                    settings.PlatformCommissionPercent = dto.PlatformCommissionPercent.Value;
                }

                if (dto.MinimumWithdrawalAmount.HasValue)
                {
                    settings.MinimumWithdrawalAmount = dto.MinimumWithdrawalAmount.Value;
                }

                settings.UpdatedAt = DateTime.UtcNow;
                settings.UpdatedBy = adminId;

                await _dbContext.SaveChangesAsync();

                var newValue = $"Commission={settings.PlatformCommissionPercent}, MinWithdrawal={settings.MinimumWithdrawalAmount}";
                await _auditLogService.LogAsync(
                    "SYSTEM_SETTINGS_UPDATE",
                    nameof(SystemSettings),
                    settings.Id.ToString(),
                    adminId,
                    oldValue,
                    newValue
                );

                return new ServiceResult<SystemSettingsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "System settings updated",
                    Data = MapDto(settings)
                };
            }
            catch
            {
                return new ServiceResult<SystemSettingsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to update system settings",
                    Data = null
                };
            }
        }

        private async Task<SystemSettings> GetOrCreateSettingsAsync()
        {
            var settings = await _dbContext.SystemSettings.FirstOrDefaultAsync();
            if (settings != null)
            {
                return settings;
            }

            settings = new SystemSettings
            {
                PlatformCommissionPercent = DefaultCommissionPercent,
                MinimumWithdrawalAmount = DefaultMinimumWithdrawal,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = null
            };

            _dbContext.SystemSettings.Add(settings);
            await _dbContext.SaveChangesAsync();

            return settings;
        }

        private static SystemSettingsDto MapDto(SystemSettings settings)
        {
            return new SystemSettingsDto
            {
                PlatformCommissionPercent = settings.PlatformCommissionPercent,
                MinimumWithdrawalAmount = settings.MinimumWithdrawalAmount
            };
        }
    }
}
