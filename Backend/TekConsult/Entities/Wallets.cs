using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class Wallets
    {
        [Key]
        public Guid WalletId { get; set; }

        [ForeignKey("Users")]
        public Guid UserId { get; set; }

        public decimal Balance { get; set; }
        public DateTime LastUpdated { get; set; }

        public Users? User { get; set; }
    }
}