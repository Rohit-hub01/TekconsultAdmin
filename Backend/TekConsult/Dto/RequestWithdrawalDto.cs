namespace TekConsult.Dto
{
    public class RequestWithdrawalDto
    {
        public decimal Amount { get; set; }
    }

    public class ProcessWithdrawalDto
    {
        public Guid RequestId { get; set; }
        public bool Approve { get; set; } // true = approve, false = reject
    }

    public class WithdrawalRowDto
    {
        public Guid RequestId { get; set; }
        public Guid ConsultantUserId { get; set; }
        public string ConsultantName { get; set; }
        public string ConsultantEmail { get; set; }
        public string ConsultantPhone { get; set; }
        public decimal Amount { get; set; }
        public decimal AvailableBalance { get; set; }
        public string BankDetails { get; set; }
        public int Status { get; set; }
        public DateTime RequestedAt { get; set; }

    }

    public class PaginatedWithdrawalResponseDto
    {
        public List<WithdrawalRowDto> Withdrawals { get; set; } = new();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
    }

    public class WithdrawalDetailsDto
    {
        public Guid RequestId { get; set; }

        public Guid ConsultantUserId { get; set; }
        public string ConsultantName { get; set; }
        public string ConsultantEmail { get; set; }
        public string ConsultantPhone { get; set; }

        public decimal Amount { get; set; }
        public decimal AvailableBalance { get; set; }

        public string BankDetails { get; set; }

        public int Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public List<PaymentMethodDto> PaymentMethods { get; set; } = new();
        public List<RecentWithdrawalDto> RecentHistory { get; set; } = new();
    }

    public class RecentWithdrawalDto
    {
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public int Status { get; set; }
    }
    public class PaymentMethodDto
    {
        public string MethodType { get; set; }
        public string MaskedDisplay { get; set; }
        public bool IsDefault { get; set; }
    }




}
