using System;
using System.Collections.Generic;

namespace TekConsult.Dto
{
    public class TransactionRowDto
    {
        public Guid TransactionId { get; set; }

        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;

        public decimal Amount { get; set; }
        public int TransactionType { get; set; }   // Credit / Debit
        public int Status { get; set; }            // Success / Failed
        public string? PaymentMethod { get; set; }
        public DateTime Timestamp { get; set; }
        public string? ReferenceId { get; set; }
    }

    public class TransactionHistoryResponseDto
    {
        public decimal TotalEarnings { get; set; }
        public List<TransactionRowDto> Transactions { get; set; } = new();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
    }
}
