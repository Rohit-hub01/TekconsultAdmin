using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TekConsult.Dto;
using TekConsult.ServiceResult;
using TekConsult.Services;

namespace TekConsult.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly ISystemSettingsService _systemSettingsService;
        private readonly INotificationSettingsService _notificationSettingsService;

        public SettingsController(ISystemSettingsService systemSettingsService, INotificationSettingsService notificationSettingsService)
        {
            _systemSettingsService = systemSettingsService;
            _notificationSettingsService = notificationSettingsService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("system-settings")]
        public async Task<IActionResult> GetSystemSettings()
        {
            try
            {
                var result = await _systemSettingsService.GetSystemSettingsAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("system-settings")]
        public async Task<IActionResult> UpdateSystemSettings([FromBody] UpdateSystemSettingsDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _systemSettingsService.UpdateSystemSettingsAsync(adminId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("notification-settings")]
        public async Task<IActionResult> GetNotificationSettings()
        {
            try
            {
                var result = await _notificationSettingsService.GetNotificationSettingsAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("notification-settings")]
        public async Task<IActionResult> UpdateNotificationSettings([FromBody] UpdateNotificationSettingsDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _notificationSettingsService.UpdateNotificationSettingsAsync(adminId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }
    }
}
