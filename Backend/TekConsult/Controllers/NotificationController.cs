using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TekConsult.Dto;
using TekConsult.Services;

namespace TekConsult.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("my-notifications")]
        public async Task<IActionResult> GetMyNotifications([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var result = await _notificationService.GetUserNotificationsAsync(userId, skip, take);
            
            if (result.Success) return Ok(result);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var result = await _notificationService.GetUnreadCountAsync(userId);

            if (result.Success) return Ok(result);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("mark-as-read/{notificationId}")]
        public async Task<IActionResult> MarkAsRead(Guid notificationId)
        {
            var result = await _notificationService.MarkAsReadAsync(notificationId);
            if (result.Success) return Ok(result);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("mark-all-as-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var result = await _notificationService.MarkAllAsReadAsync(userId);
            
            if (result.Success) return Ok(result);
            return StatusCode(result.StatusCode, result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all-notifications")]
        public async Task<IActionResult> GetAllNotifications([FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            var result = await _notificationService.GetAllNotificationsAsync(skip, take);
            if (result.Success) return Ok(result);
            return StatusCode(result.StatusCode, result);
        }
    }
}
