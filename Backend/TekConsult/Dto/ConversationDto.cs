using System;

namespace TekConsult.Dto
{
    public class ConversationDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ConsultantId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UserName { get; set; }
        public string? ConsultantName { get; set; }
        public string? ConsultantPhotoUrl { get; set; }
        public string? UserPhotoUrl { get; set; }
    }
}
