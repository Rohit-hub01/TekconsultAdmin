namespace TekConsult.Dto
{
    public class ReviewDetailsDto
    {
        public Guid ReviewId { get; set; }
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public string? UserName { get; set; }
        public Guid ConsultantId { get; set; }
        public string? ConsultantName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsModerated { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UserProfilePhotoUrl { get; set; }
        public string? ConsultantProfilePhotoUrl { get; set; }
    }

    public class ReviewListResponseDto
    {
        public List<ReviewDetailsDto> Reviews { get; set; } = new List<ReviewDetailsDto>();
        public int TotalCount { get; set; }
        public decimal AverageRating { get; set; }
    }
}
