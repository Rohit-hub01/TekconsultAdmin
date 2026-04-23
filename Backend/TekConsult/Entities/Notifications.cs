using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class Notifications
    {
        [Key]
        public Guid NotificationId { get; set; }

        [ForeignKey("Users")]
        public Guid UserId { get; set; }

        public string Title { get; set; }
        public string? Body { get; set; }
        public int Type { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }

        public Users? User { get; set; }
    }
}