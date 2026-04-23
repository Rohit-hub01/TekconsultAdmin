using System;

namespace TekConsult.Dto
{
    public class NotificationDto
    {
        public Guid NotificationId { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; }
        public string? Body { get; set; }
        public int Type { get; set; }
        public bool IsRead { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public Guid UserId { get; set; }
        public string Title { get; set; }
        public string? Body { get; set; }
        public int Type { get; set; }
    }
}
