using System;

namespace TekConsult.Dto
{
    public class RaiseDisputeDto
    {
        public Guid SessionId { get; set; }
        public string Description { get; set; }
        public decimal RefundAmount { get; set; }
    }
}
