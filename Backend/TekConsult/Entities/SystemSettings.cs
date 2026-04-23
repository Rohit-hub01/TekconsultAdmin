using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class SystemSettings
    {
        [Key]
        public int Id { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal PlatformCommissionPercent { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinimumWithdrawalAmount { get; set; }

        public DateTime UpdatedAt { get; set; }

        public Guid? UpdatedBy { get; set; }
    }
}
