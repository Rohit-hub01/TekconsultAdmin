using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class SessionParticipants
    {
        [Key]
        public Guid Id { get; set; }

        [ForeignKey("ConsultationSessions")]
        public Guid SessionId { get; set; }

        [ForeignKey("Users")]
        public Guid UserId { get; set; }

        public DateTime JoinedAt { get; set; }

        public ConsultationSessions Session { get; set; }
        public Users User { get; set; }
    }

}
