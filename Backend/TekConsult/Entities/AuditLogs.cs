using System;
using System.ComponentModel.DataAnnotations;

namespace TekConsult.Entities
{
    public class AuditLogs
    {
        [Key]
        public Guid AuditId { get; set; }

        public string Action { get; set; }
        public string EntityName { get; set; }
        public string? EntityId { get; set; }
        public Guid? PerformedBy { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime Timestamp { get; set; }
    }
}