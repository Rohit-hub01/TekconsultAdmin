using System;

namespace TekConsult.Dto
{
    public class GetOrCreateConversationDto
    {
        public Guid UserId { get; set; }
        public Guid ConsultantId { get; set; }
    }
}
