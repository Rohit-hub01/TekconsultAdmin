namespace TekConsult.Dto
{

    public class EndSessionDto
    {
        public Guid SessionId { get; set; }
    }
    public class RecalculateSessionTimeDto
    {
        public Guid SessionId { get; set; }
    }

    public class AcceptRejectSessionDto
    {
        public Guid SessionId { get; set; }
        public bool Accept { get; set; }
    }

}
