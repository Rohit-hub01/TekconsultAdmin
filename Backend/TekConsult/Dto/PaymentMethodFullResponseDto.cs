namespace TekConsult.Dto
{
    public class PaymentMethodFullResponseDto
    {
        public Guid PaymentMethodId { get; set; }
        public string MethodType { get; set; }
        public string EncryptedPayload { get; set; }  // ✅ RETURN THIS
        public string MaskedDisplay { get; set; }
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
