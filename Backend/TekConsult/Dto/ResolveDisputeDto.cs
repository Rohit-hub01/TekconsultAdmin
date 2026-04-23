using System;

namespace TekConsult.Dto
{
    public class ResolveDisputeDto
    {
        public Guid DisputeId { get; set; }
        public bool Approve { get; set; } // true = Resolve/Refund, false = Reject
        public decimal? PartialAmount { get; set; }
    }
}
