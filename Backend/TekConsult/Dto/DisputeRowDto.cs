namespace TekConsult.Dto
{
    public class DisputeRowDto
    {
        public Guid DisputeId { get; set; }
        public Guid SessionId { get; set; }

        // Output will have disputeid, sessionid, user, consultant, category, amount ,status, createdat
        public string UserName { get; set; }
        public string ConsultantName { get; set; }
        public string Category { get; set; }
        public decimal Amount { get; set; }
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Description { get; set; }
    }
}
