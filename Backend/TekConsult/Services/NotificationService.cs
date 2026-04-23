using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.Enums;
using TekConsult.Hubs;
using TekConsult.ServiceResult;

namespace TekConsult.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _dbContext;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly INotificationSettingsService _notificationSettingsService;

        public NotificationService(
            AppDbContext dbContext,
            IHubContext<NotificationHub> hubContext,
            INotificationSettingsService notificationSettingsService)
        {
            _dbContext = dbContext;
            _hubContext = hubContext;
            _notificationSettingsService = notificationSettingsService;
        }

        public async Task<ServiceResult<NotificationDto>> CreateNotificationAsync(CreateNotificationDto dto)
        {
            try
            {
                var notification = new Notifications
                {
                    NotificationId = Guid.NewGuid(),
                    UserId = dto.UserId,
                    Title = dto.Title,
                    Body = dto.Body,
                    Type = dto.Type,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Notifications.Add(notification);
                await _dbContext.SaveChangesAsync();

                var resultDto = MapToDto(notification);

                // Send real-time notification via SignalR
                await _hubContext.Clients.User(dto.UserId.ToString()).SendAsync("ReceiveNotification", resultDto);

                return new ServiceResult<NotificationDto>
                {
                    Success = true,
                    StatusCode = 201,
                    Data = resultDto
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<NotificationDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = ex.Message
                };
            }
        }

        public async Task<ServiceResult<List<NotificationDto>>> GetUserNotificationsAsync(Guid userId, int skip, int take)
        {
            try
            {
                var notifications = await _dbContext.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Skip(skip)
                    .Take(take)
                    .Select(n => MapToDto(n))
                    .ToListAsync();

                return new ServiceResult<List<NotificationDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = notifications
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<NotificationDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = ex.Message
                };
            }
        }

        public async Task<ServiceResult<bool>> MarkAsReadAsync(Guid notificationId)
        {
            try
            {
                var notification = await _dbContext.Notifications.FindAsync(notificationId);
                if (notification == null)
                {
                    return new ServiceResult<bool> { Success = false, StatusCode = 404, Message = "Notification not found" };
                }

                notification.IsRead = true;
                await _dbContext.SaveChangesAsync();

                return new ServiceResult<bool> { Success = true, StatusCode = 200, Data = true };
            }
            catch (Exception ex)
            {
                return new ServiceResult<bool> { Success = false, StatusCode = 500, Message = ex.Message };
            }
        }

        public async Task<ServiceResult<bool>> MarkAllAsReadAsync(Guid userId)
        {
            try
            {
                var unreadNotifications = await _dbContext.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                }

                await _dbContext.SaveChangesAsync();

                return new ServiceResult<bool> { Success = true, StatusCode = 200, Data = true };
            }
            catch (Exception ex)
            {
                return new ServiceResult<bool> { Success = false, StatusCode = 500, Message = ex.Message };
            }
        }

        public async Task<ServiceResult<int>> GetUnreadCountAsync(Guid userId)
        {
            try
            {
                var count = await _dbContext.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                return new ServiceResult<int> { Success = true, StatusCode = 200, Data = count };
            }
            catch (Exception ex)
            {
                return new ServiceResult<int> { Success = false, StatusCode = 500, Message = ex.Message };
            }
        }

        public async Task<ServiceResult<List<NotificationDto>>> GetAllNotificationsAsync(int skip, int take)
        {
            try
            {
                var notifications = await _dbContext.Notifications
                    .Include(n => n.User)
                    .OrderByDescending(n => n.CreatedAt)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                var dtos = notifications.Select(n => MapToDto(n)).ToList();

                return new ServiceResult<List<NotificationDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = dtos
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<NotificationDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = ex.Message
                };
            }
        }

        public async Task NotifyAdminAsync(string title, string body, NotificationType type)
        {
            var isEnabled = await _notificationSettingsService.IsNotificationEnabledAsync(type);
            if (!isEnabled)
            {
                return;
            }

            // Fetch all admin users
            var adminRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
            if (adminRole == null) return;

            var admins = await _dbContext.Users
                .Where(u => u.RoleId == adminRole.RoleId)
                .ToListAsync();

            foreach (var admin in admins)
            {
                await CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = admin.UserId,
                    Title = title,
                    Body = body,
                    Type = (int)type
                });
            }
        }

        public async Task NotifyUserAsync(Guid userId, string title, string body, NotificationType type)
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = userId,
                Title = title,
                Body = body,
                Type = (int)type
            });
        }

        private static NotificationDto MapToDto(Notifications n)
        {
            return new NotificationDto
            {
                NotificationId = n.NotificationId,
                UserId = n.UserId,
                Title = n.Title,
                Body = n.Body,
                Type = n.Type,
                IsRead = n.IsRead,
                UserName = n.User != null ? $"{n.User.FirstName} {n.User.LastName}".Trim() : null,
                CreatedAt = n.CreatedAt
            };
        }
    }
}
