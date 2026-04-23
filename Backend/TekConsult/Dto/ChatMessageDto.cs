using System;

namespace TekConsult.Dto
{
    public class ChatMessageDto
    {
        public Guid MessageId { get; set; }
        public Guid ConversationId { get; set; }   // Will be Guid.Empty for legacy session-only messages
        public Guid? SessionId { get; set; }
        public Guid SenderId { get; set; }
        public string? Content { get; set; }
        public string? SenderName { get; set; }
        public string? SenderRole { get; set; }
        public int MessageType { get; set; }
        public bool IsRead { get; set; }
        public DateTime Timestamp { get; set; }
        public string? ProfilePhotoUrl { get; set; }
    }
}
