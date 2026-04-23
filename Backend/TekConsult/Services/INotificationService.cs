using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TekConsult.Dto;
using TekConsult.ServiceResult;

namespace TekConsult.Services
{
    public interface INotificationService
    {
        Task<ServiceResult<NotificationDto>> CreateNotificationAsync(CreateNotificationDto dto);
        Task<ServiceResult<List<NotificationDto>>> GetUserNotificationsAsync(Guid userId, int skip, int take);
        Task<ServiceResult<bool>> MarkAsReadAsync(Guid notificationId);
        Task<ServiceResult<bool>> MarkAllAsReadAsync(Guid userId);
        Task<ServiceResult<int>> GetUnreadCountAsync(Guid userId);
        Task<ServiceResult<List<NotificationDto>>> GetAllNotificationsAsync(int skip, int take);
        
        // Helper methods for common notification tasks
        Task NotifyAdminAsync(string title, string body, Enums.NotificationType type);
        Task NotifyUserAsync(Guid userId, string title, string body, Enums.NotificationType type);
    }
}
