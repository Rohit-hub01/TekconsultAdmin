using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class PaymentGateways
    {
        [Key]
        public Guid PaymentId { get; set; }

        [ForeignKey("Users")]
        public Guid UserId { get; set; }

        public string? GatewayTransactionId { get; set; }
        public decimal Amount { get; set; }
        public string? GatewayStatus { get; set; }
        public string? GatewayResponse { get; set; }
        public DateTime CreatedAt { get; set; }

        public Users? User { get; set; }
    }
}