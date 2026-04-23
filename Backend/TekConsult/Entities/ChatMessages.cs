using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class ChatMessages
    {
        [Key]
        public Guid MessageId { get; set; }

        // Nullable - messages linked to a conversation (new system)
        [ForeignKey("Conversations")]
        public Guid? ConversationId { get; set; }

        // Nullable - messages may or may not be tied to a session
        [ForeignKey("ConsultationSessions")]
        public Guid? SessionId { get; set; }

        [ForeignKey("Users")]
        public Guid SenderId { get; set; }

        public string? Content { get; set; }
        public int MessageType { get; set; }
        public bool IsRead { get; set; }
        public DateTime Timestamp { get; set; }

        public Conversations? Conversations { get; set; }
        public ConsultationSessions? ConsultationSessions { get; set; }
        public Users? Sender { get; set; }
    }
}
