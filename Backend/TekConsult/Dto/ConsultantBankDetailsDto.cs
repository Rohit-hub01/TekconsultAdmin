using System;

namespace TekConsult.Dto
{
    public class ConsultantBankDetailsDto
    {
        public Guid Id { get; set; }
        public Guid ConsultantId { get; set; }
        public string AccountHolderName { get; set; }
        public string BankName { get; set; }
        public string AccountNumber { get; set; }
        public string IFSCCode { get; set; }
        public string? BranchName { get; set; }
        public bool IsDefault { get; set; }
        public bool IsVerified { get; set; }
    }
}
