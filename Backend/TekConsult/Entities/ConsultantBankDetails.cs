using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class ConsultantBankDetails
    {
        [Key]
        public Guid Id { get; set; }

        public Guid ConsultantId { get; set; }

        public string AccountHolderName { get; set; }

        public string BankName { get; set; }

        public string AccountNumber { get; set; }

        public string IFSCCode { get; set; }

        public string? BranchName { get; set; }

        public bool IsDefault { get; set; } = true;

        public bool IsVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("ConsultantId")]
        public Users Consultant { get; set; }
    }
}
