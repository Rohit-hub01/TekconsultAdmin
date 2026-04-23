using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class Conversations
    {
        [Key]
        public Guid Id { get; set; }

        [ForeignKey("User")]
        public Guid UserId { get; set; }

        [ForeignKey("Consultant")]
        public Guid ConsultantId { get; set; }

        public DateTime CreatedAt { get; set; }

        public Users? User { get; set; }
        public Users? Consultant { get; set; }
    }
}
