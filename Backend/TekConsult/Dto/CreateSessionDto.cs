namespace TekConsult.Dto
{
    public class CreateSessionDto
    {
        public List<Guid> UserIds { get; set; } = new();
        public int Mode { get; set; }
    }

    public class SendMessageDto
    {
        public Guid SessionId { get; set; }
        public string Message { get; set; }
    }

}
