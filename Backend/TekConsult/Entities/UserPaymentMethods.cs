using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class UserPaymentMethods
    {
        [Key]
        public Guid PaymentMethodId { get; set; }   // ✅ Primary Key

        [ForeignKey("Users")]
        public Guid UserId { get; set; }             // ✅ Foreign Key

        public string MethodType { get; set; }       // "Bank" / "Card" / "UPI"

        public string EncryptedPayload { get; set; }
        public string MaskedDisplay { get; set; }

        public bool IsDefault { get; set; }

        public DateTime CreatedAt { get; set; }

        public Users User { get; set; }              // ✅ Navigation
    }


}
