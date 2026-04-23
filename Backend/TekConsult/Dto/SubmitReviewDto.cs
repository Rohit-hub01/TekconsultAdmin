namespace TekConsult.Dto
{
    public class SubmitReviewDto
    {
        public string? SessionId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ReviewResponseDto
    {
        public Guid ReviewId { get; set; }
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public Guid ConsultantId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsModerated { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
