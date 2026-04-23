using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class Transactions
    {
        [Key]
        public Guid TransactionId { get; set; }

        [ForeignKey("Wallets")]
        public Guid WalletId { get; set; }

        public decimal Amount { get; set; }
        public int TransactionType { get; set; }
        public int Status { get; set; }
        public string? ReferenceId { get; set; }
        public DateTime Timestamp { get; set; }
        public string? PaymentMethod { get; set; }      // "Card", "UPI", "Bank", "Wallet"
        public string? PaymentMethodRef { get; set; }   // pm_123..., upi_xxx

        public Wallets? Wallets { get; set; }
    }
}