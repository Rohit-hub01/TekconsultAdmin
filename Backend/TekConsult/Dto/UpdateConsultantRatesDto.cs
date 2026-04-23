namespace TekConsult.Dto
{
    public class UpdateConsultantRatesDto
    {
        public decimal ChatRatePerMinute { get; set; }
        public decimal CallRatePerMinute { get; set; }
        public decimal? DiscountedChatRate { get; set; }
        public bool IsChatDiscountActive { get; set; }
        public decimal? DiscountedCallRate { get; set; }
        public bool IsCallDiscountActive { get; set; }
        public DateTime? DiscountStart { get; set; }
        public DateTime? DiscountEnd { get; set; }
    }
}
