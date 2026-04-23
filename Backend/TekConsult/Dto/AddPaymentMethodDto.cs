namespace TekConsult.Dto
{
    public class AddPaymentMethodDto
    {
        public string MethodType { get; set; }        // Bank / Card / UPI
        public string EncryptedPayload { get; set; }  // From frontend
        public string MaskedDisplay { get; set; }     // From frontend
        public bool IsDefault { get; set; }
    }

    public class UpdatePaymentMethodDto
    {
        public Guid PaymentMethodId { get; set; }
        public string EncryptedPayload { get; set; }
        public string MaskedDisplay { get; set; }
        public bool IsDefault { get; set; }
    }

    public class PaymentMethodResponseDto
    {
        public Guid PaymentMethodId { get; set; }
        public string MethodType { get; set; }
        public string EncryptedPayload { get; set; }
        public string MaskedDisplay { get; set; }
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
    }

}
