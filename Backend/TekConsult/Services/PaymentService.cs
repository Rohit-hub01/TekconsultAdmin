using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Stripe;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.ServiceResult;
using TekConsult.Enums;


namespace TekConsult.Services
{
    public interface IPaymentService
    {
        Task<ServiceResult<string>> CreateAddMoneySessionAsync(Guid userId, decimal amount);
        Task HandleStripeWebhookAsync(string json, string stripeSignature);
        Task<ServiceResult<decimal>> GetWalletBalanceAsync(Guid userId);
        Task<ServiceResult<TransactionHistoryResponseDto>> GetMyTransactionsAsync(Guid userId, int skip, int take, DateTime? startDate = null, DateTime? endDate = null);
        Task<ServiceResult<List<TransactionRowDto>>> GetAllTransactionsForAdminAsync(int skip, int take, Guid? userId = null);
        Task<ServiceResult<bool>> RequestWithdrawalAsync(Guid consultantId, decimal amount);
        Task<ServiceResult<bool>> ProcessWithdrawalAsync(Guid adminId, ProcessWithdrawalDto dto);
        Task<ServiceResult<PaginatedWithdrawalResponseDto>> GetMyWithdrawalsAsync(Guid consultantId, int skip, int take);
        Task<ServiceResult<List<WithdrawalRowDto>>> GetAllWithdrawalsForAdminAsync();
        Task<ServiceResult<WithdrawalDetailsDto>> GetWithdrawalDetailsAsync(Guid requestId);
        Task<ServiceResult<ConsultantBankDetailsDto>> GetConsultantBankDetailsAsync(Guid consultantId);
        Task<ServiceResult<bool>> UpdateConsultantBankDetailsAsync(Guid consultantId, ConsultantBankDetailsDto dto);

    }
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;
        private readonly IAuditLogService _auditLogService;
        private readonly INotificationService _notificationService;
        private readonly ISystemSettingsService _systemSettingsService;

        public PaymentService(AppDbContext dbContext, IConfiguration configuration, IAuditLogService auditLogService, INotificationService notificationService, ISystemSettingsService systemSettingsService)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _auditLogService = auditLogService;
            _notificationService = notificationService;
            _systemSettingsService = systemSettingsService;
        }

        public async Task<ServiceResult<string>> CreateAddMoneySessionAsync(Guid userId, decimal amount)
        {
            var result = new ServiceResult<string>();

            try
            {
                if (amount <= 0)
                {
                    result.Success = false;
                    result.StatusCode = 400;
                    result.Message = "Invalid amount";
                    return result;
                }

                var options = new Stripe.Checkout.SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    Mode = "payment",
                    LineItems = new List<Stripe.Checkout.SessionLineItemOptions>
                {
                    new()
                    {
                        Quantity = 1,
                        PriceData = new Stripe.Checkout.SessionLineItemPriceDataOptions
                        {
                            Currency = "inr",
                            UnitAmount = (long)(amount * 100),
                            ProductData = new Stripe.Checkout.SessionLineItemPriceDataProductDataOptions
                            {
                                Name = "Wallet Top-up"
                            }
                        }
                    }
                },
                    SuccessUrl = "https://your-frontend/success",
                    CancelUrl = "https://your-frontend/cancel",
                    Metadata = new Dictionary<string, string>
                {
                    { "userId", userId.ToString() },
                    { "amount", amount.ToString() }
                }
                };

                var service = new Stripe.Checkout.SessionService();
                var session = await service.CreateAsync(options);

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Stripe session created";
                result.Data = session.Url;
            }
            catch (Exception ex)
            {

                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to create payment session";
            }

            return result;
        }

        // ===============================
        // STRIPE WEBHOOK HANDLER
        // ===============================
        public async Task HandleStripeWebhookAsync(string json, string stripeSignature)
        {
            try
            {
                var webhookSecret = _configuration["Stripe:WebhookSecret"];

                if (string.IsNullOrEmpty(webhookSecret))
                    throw new Exception("Stripe WebhookSecret is missing in configuration.");

                var stripeEvent = Stripe.EventUtility.ConstructEvent(
                    json,
                    stripeSignature,
                    webhookSecret,
                    throwOnApiVersionMismatch: false
                );


                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Stripe.Checkout.Session;

                    if (session == null)
                        throw new Exception("Stripe session is null");

                    if (session.Metadata == null || !session.Metadata.ContainsKey("userId") || !session.Metadata.ContainsKey("amount"))
                        throw new Exception("Stripe metadata missing");

                    var userId = Guid.Parse(session.Metadata["userId"]);
                    var amount = decimal.Parse(session.Metadata["amount"]);

                    // ===============================
                    // Get or create wallet
                    // ===============================
                    var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == userId);
                    if (wallet == null)
                    {
                        wallet = new Wallets
                        {
                            WalletId = Guid.NewGuid(),
                            UserId = userId,
                            Balance = 0,
                            LastUpdated = DateTime.UtcNow
                        };
                        _dbContext.Wallets.Add(wallet);
                        await _dbContext.SaveChangesAsync(); // Save first to get WalletId
                    }

                    // ===============================
                    // Prevent duplicate processing
                    // ===============================
                    var alreadyProcessed = await _dbContext.Transactions
                        .AnyAsync(x => x.ReferenceId == session.Id);

                    if (alreadyProcessed)
                    {
                        // Stripe may resend webhook — ignore duplicate
                        return;
                    }

                    // ===============================
                    // Get payment method from Stripe
                    // ===============================
                    var paymentIntentService = new PaymentIntentService();
                    var paymentIntent = await paymentIntentService.GetAsync(session.PaymentIntentId);

                    var paymentMethodService = new PaymentMethodService();
                    var paymentMethod = await paymentMethodService.GetAsync(paymentIntent.PaymentMethodId);

                    // ===============================
                    // Update wallet
                    // ===============================
                    wallet.Balance += amount;
                    wallet.LastUpdated = DateTime.UtcNow;


                    // ===============================
                    // Insert transaction
                    // ===============================
                    _dbContext.Transactions.Add(new Transactions
                    {
                        TransactionId = Guid.NewGuid(),
                        WalletId = wallet.WalletId,
                        Amount = amount,
                        TransactionType = 1, // Credit
                        Status = 1, // Success
                        ReferenceId = session.Id,
                        PaymentMethod = paymentMethod.Type,         // "card" / "upi"
                        PaymentMethodRef = paymentMethod.Id,
                        Timestamp = DateTime.UtcNow
                    });

                    await _dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Stripe Webhook ERROR: " + ex.Message);
                throw; // ⚠️ Important: Let controller return 400
            }
        }

        // ===============================
        // GET WALLET BALANCE
        // ===============================
        public async Task<ServiceResult<decimal>> GetWalletBalanceAsync(Guid userId)
        {
            var result = new ServiceResult<decimal>();

            try
            {
                var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == userId);

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Wallet loaded";
                result.Data = wallet?.Balance ?? 0;
            }
            catch (Exception ex)
            {

                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load wallet";
            }

            return result;
        }

        public async Task<ServiceResult<TransactionHistoryResponseDto>> GetMyTransactionsAsync(Guid userId, int skip, int take, DateTime? startDate = null, DateTime? endDate = null)
        {
            var result = new ServiceResult<TransactionHistoryResponseDto>();

            try
            {
                var response = new TransactionHistoryResponseDto();

                // 1. Calculate Earnings (Logic aligned with DashboardService)
                var completedSessions = await _dbContext.ConsultationSessions
                     .Include(s => s.Participants)
                     .Where(s => s.State == SessionState.Completed &&
                                 s.Participants.Any(p => p.UserId == userId))
                     .ToListAsync();

                if (completedSessions.Any())
                {
                    var sessionEarnings = completedSessions.Sum(s => s.ConsultantEarnings);

                    var sessionIds = completedSessions.Select(s => s.SessionId).ToList();
                    var refunds = await _dbContext.Disputes
                        .Where(d => sessionIds.Contains(d.SessionId) && d.Status == 1) // 1 = Resolved
                        .SumAsync(d => d.RefundAmount);

                    response.TotalEarnings = sessionEarnings - refunds;
                }

                // 2. Fetch Transactions
                var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
                
                if (wallet != null)
                {
                    var transactionQuery = _dbContext.Transactions
                        .Where(t => t.WalletId == wallet.WalletId);

                    if (startDate.HasValue)
                    {
                        transactionQuery = transactionQuery.Where(t => t.Timestamp >= startDate.Value);
                    }

                    if (endDate.HasValue)
                    {
                        transactionQuery = transactionQuery.Where(t => t.Timestamp <= endDate.Value);
                    }

                    var totalCount = await transactionQuery.CountAsync();
                    var data = await transactionQuery
                        .Join(
                            _dbContext.Users,
                            outer => wallet.UserId, 
                            u => u.UserId,
                            (t, u) => new TransactionRowDto
                            {
                                TransactionId = t.TransactionId,
                                UserId = u.UserId,
                                UserName = (u.FirstName ?? "") + " " + (u.LastName ?? ""),
                                Amount = t.Amount,
                                TransactionType = t.TransactionType,
                                Status = t.Status,
                                PaymentMethod = t.PaymentMethod,
                                Timestamp = t.Timestamp,
                                ReferenceId = t.ReferenceId
                            }
                        )
                        .OrderByDescending(x => x.Timestamp)
                        .Skip(skip)
                        .Take(take)
                        .ToListAsync();

                    response.Transactions = data;
                    response.TotalCount = totalCount;
                    response.CurrentPage = take > 0 ? (skip / take) + 1 : 1;
                    response.TotalPages = take > 0 ? (int)Math.Ceiling(totalCount / (double)take) : 1;
                }
                else
                {
                    response.Transactions = new List<TransactionRowDto>();
                }
                
                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Transactions loaded";
                result.Data = response;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load transactions: " + ex.Message;
                result.Data = null;
            }

            return result;
        }
        public async Task<ServiceResult<List<TransactionRowDto>>> GetAllTransactionsForAdminAsync(int skip, int take, Guid? userId = null)
        {
            var result = new ServiceResult<List<TransactionRowDto>>();

            try
            {
                var query = _dbContext.Transactions
                    .Join(
                        _dbContext.Wallets,
                        t => t.WalletId,
                        w => w.WalletId,
                        (t, w) => new { t, w }
                    );

                if (userId.HasValue)
                {
                    query = query.Where(x => x.w.UserId == userId.Value);
                }

                var data = await query
                    .Join(
                        _dbContext.Users,
                        tw => tw.w.UserId,
                        u => u.UserId,
                        (tw, u) => new TransactionRowDto
                        {
                            TransactionId = tw.t.TransactionId,
                            UserId = u.UserId,
                            UserName =
                                (u.FirstName ?? "") + " " +
                                (u.MiddleName ?? "") + " " +
                                (u.LastName ?? ""),

                            Amount = tw.t.Amount,
                            TransactionType = tw.t.TransactionType,
                            Status = tw.t.Status,
                            PaymentMethod = tw.t.PaymentMethod,
                            Timestamp = tw.t.Timestamp,
                            ReferenceId = tw.t.ReferenceId
                        }
                    )
                    .OrderByDescending(x => x.Timestamp)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "All transactions loaded";
                result.Data = data;
            }
            catch
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load transactions";
                result.Data = null;
            }

            return result;
        }

        public async Task<ServiceResult<bool>> RequestWithdrawalAsync(Guid consultantId, decimal amount)
        {
            var result = new ServiceResult<bool>();

            try
            {
                if (amount <= 0)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Invalid amount",
                        Data = false
                    };
                }

                var settingsResult = await _systemSettingsService.GetSystemSettingsAsync();
                if (!settingsResult.Success || settingsResult.Data == null)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 500,
                        Message = "Unable to validate minimum withdrawal amount",
                        Data = false
                    };
                }

                if (amount < settingsResult.Data.MinimumWithdrawalAmount)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = $"Minimum withdrawal amount is {settingsResult.Data.MinimumWithdrawalAmount}",
                        Data = false
                    };
                }

                var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == consultantId);
                if (wallet == null || wallet.Balance < amount)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Insufficient balance",
                        Data = false
                    };
                }

                // Get consultant bank details snapshot
                var paymentMethod = await _dbContext.UserPaymentMethods
                    .FirstOrDefaultAsync(x => x.UserId == consultantId && x.IsDefault);

                if (paymentMethod == null)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "No bank/payment method found",
                        Data = false
                    };
                }

                _dbContext.WithdrawalRequests.Add(new WithdrawalRequests
                {
                    RequestId = Guid.NewGuid(),
                    ConsultantUserId = consultantId,
                    Amount = amount,
                    BankDetailsSnapshot = paymentMethod.MaskedDisplay,
                    Status = (int)WithdrawalStatus.Pending,
                    RequestedAt = DateTime.UtcNow
                });

                await _dbContext.SaveChangesAsync();

                // Audit log
                await _auditLogService.LogAsync(
                    "WITHDRAWAL_REQUEST",
                    "WithdrawalRequests",
                    consultantId.ToString(),
                    consultantId,
                    null,
                    $"Amount: {amount}, Status: Pending"
                );

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Withdrawal request submitted";
                result.Data = true;
            }
            catch
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to request withdrawal";
                result.Data = false;
            }

            return result;
        }

        public async Task<ServiceResult<bool>> ProcessWithdrawalAsync(Guid adminId, ProcessWithdrawalDto dto)
        {
            var result = new ServiceResult<bool>();

            try
            {
                var request = await _dbContext.WithdrawalRequests
                    .FirstOrDefaultAsync(x => x.RequestId == dto.RequestId);

                if (request == null || request.Status != (int)WithdrawalStatus.Pending)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Invalid request",
                        Data = false
                    };
                }

                if (!dto.Approve)
                {
                    request.Status = (int)WithdrawalStatus.Rejected;
                    request.ProcessedAt = DateTime.UtcNow;
                    await _dbContext.SaveChangesAsync();

                    // Audit log
                    await _auditLogService.LogAsync(
                        "WITHDRAWAL_REJECTED",
                        "WithdrawalRequests",
                        request.RequestId.ToString(),
                        adminId,
                        $"Status: {WithdrawalStatus.Pending}",
                        $"Status: {WithdrawalStatus.Rejected}"
                    );

                    return new ServiceResult<bool>
                    {
                        Success = true,
                        StatusCode = 200,
                        Message = "Withdrawal rejected",
                        Data = true
                    };
                }

                // Approve flow
                var wallet = await _dbContext.Wallets
                    .FirstOrDefaultAsync(x => x.UserId == request.ConsultantUserId);

                if (wallet == null || wallet.Balance < request.Amount)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Insufficient balance",
                        Data = false
                    };
                }

                // Deduct money
                wallet.Balance -= request.Amount;
                wallet.LastUpdated = DateTime.UtcNow;

                // Insert transaction
                _dbContext.Transactions.Add(new Transactions
                {
                    TransactionId = Guid.NewGuid(),
                    WalletId = wallet.WalletId,
                    Amount = request.Amount,
                    TransactionType = 2, // Debit
                    Status = 1, // Success
                    ReferenceId = request.RequestId.ToString(),
                    PaymentMethod = "Bank",
                    PaymentMethodRef = request.BankDetailsSnapshot,
                    Timestamp = DateTime.UtcNow
                });

                // Update request
                request.Status = (int)WithdrawalStatus.Approved;
                request.ProcessedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                // Audit log
                await _auditLogService.LogAsync(
                    "WITHDRAWAL_APPROVED",
                    "WithdrawalRequests",
                    request.RequestId.ToString(),
                    adminId,
                    $"Status: {WithdrawalStatus.Pending}, Amount: {request.Amount}",
                    $"Status: {WithdrawalStatus.Approved}, Amount: {request.Amount}"
                );

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Withdrawal processed";
                result.Data = true;
            }
            catch
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to process withdrawal";
                result.Data = false;
            }

            return result;
        }

        // =========================================
        // ADMIN: Get all withdrawals
        // =========================================
        public async Task<ServiceResult<List<WithdrawalRowDto>>> GetAllWithdrawalsForAdminAsync()
        {
            var result = new ServiceResult<List<WithdrawalRowDto>>();

            try
            {
                var data = await _dbContext.WithdrawalRequests
                    .Include(x => x.User)
                    .OrderByDescending(x => x.RequestedAt)
                    .ToListAsync();

                var list = new List<WithdrawalRowDto>();

                foreach (var w in data)
                {
                    var wallet = await _dbContext.Wallets
                        .FirstOrDefaultAsync(x => x.UserId == w.ConsultantUserId);

                    var fullName = $"{w.User?.FirstName} {w.User?.MiddleName} {w.User?.LastName}"
                        .Replace("  ", " ")
                        .Trim();

                    list.Add(new WithdrawalRowDto
                    {
                        RequestId = w.RequestId,
                        ConsultantName = fullName,
                        Amount = w.Amount,
                        AvailableBalance = wallet?.Balance ?? 0,
                        BankDetails = w.BankDetailsSnapshot,
                        Status = w.Status,
                        RequestedAt = w.RequestedAt
                    });
                }

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Withdrawals loaded";
                result.Data = list;
            }
            catch
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load withdrawals";
                result.Data = null;
            }

            return result;
        }


        // =========================================
        // CONSULTANT: Get my withdrawals
        // =========================================
        public async Task<ServiceResult<PaginatedWithdrawalResponseDto>> GetMyWithdrawalsAsync(Guid userId, int skip, int take)
        {
            var result = new ServiceResult<PaginatedWithdrawalResponseDto>();

            try
            {
                var query = _dbContext.WithdrawalRequests
                    .Include(x => x.User)
                    .Where(x => x.ConsultantUserId == userId);

                var totalCount = await query.CountAsync();
                var data = await query
                    .OrderByDescending(x => x.RequestedAt)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == userId);

                var list = data.Select(w =>
                {
                    var fullName = $"{w.User?.FirstName} {w.User?.MiddleName} {w.User?.LastName}".Replace("  ", " ").Trim();

                    return new WithdrawalRowDto
                    {
                        RequestId = w.RequestId,
                        ConsultantUserId = w.ConsultantUserId,
                        ConsultantName = fullName,
                        ConsultantEmail = w.User?.Email,
                        ConsultantPhone = w.User?.PhoneNumber,
                        Amount = w.Amount,
                        AvailableBalance = wallet?.Balance ?? 0,
                        BankDetails = w.BankDetailsSnapshot,
                        Status = w.Status,
                        RequestedAt = w.RequestedAt
                    };
                }).ToList();

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "My withdrawals loaded";
                result.Data = new PaginatedWithdrawalResponseDto
                {
                    Withdrawals = list,
                    TotalCount = totalCount,
                    TotalPages = take > 0 ? (int)Math.Ceiling(totalCount / (double)take) : 1,
                    CurrentPage = take > 0 ? (skip / take) + 1 : 1
                };
            }
            catch
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load my withdrawals";
                result.Data = null;
            }

            return result;
        }

        public async Task<ServiceResult<WithdrawalDetailsDto>> GetWithdrawalDetailsAsync(Guid requestId)
        {
            var result = new ServiceResult<WithdrawalDetailsDto>();

            try
            {
                var w = await _dbContext.WithdrawalRequests
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x => x.RequestId == requestId);

                if (w == null)
                {
                    result.Success = false;
                    result.StatusCode = 404;
                    result.Message = "Request not found";
                    result.Data = null;
                    return result;
                }

                var wallet = await _dbContext.Wallets
                    .FirstOrDefaultAsync(x => x.UserId == w.ConsultantUserId);

                // ============================
                // Recent withdrawals
                // ============================
                var recent = await _dbContext.WithdrawalRequests
                    .Where(x => x.ConsultantUserId == w.ConsultantUserId && x.RequestId != requestId)
                    .OrderByDescending(x => x.RequestedAt)
                    .Take(5)
                    .ToListAsync();

                // ============================
                // Payment methods
                // ============================
                var paymentMethods = await _dbContext.UserPaymentMethods
                    .Where(x => x.UserId == w.ConsultantUserId)
                    .OrderByDescending(x => x.IsDefault)
                    .ToListAsync();

                var fullName = $"{w.User?.FirstName} {w.User?.MiddleName} {w.User?.LastName}"
                    .Replace("  ", " ")
                    .Trim();

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Withdrawal details loaded";
                result.Data = new WithdrawalDetailsDto
                {
                    RequestId = w.RequestId,
                    ConsultantUserId = w.ConsultantUserId,
                    ConsultantName = fullName,
                    ConsultantEmail = w.User?.Email,
                    ConsultantPhone = w.User?.PhoneNumber,
                    Amount = w.Amount,
                    AvailableBalance = wallet?.Balance ?? 0,
                    BankDetails = w.BankDetailsSnapshot,
                    Status = w.Status,
                    RequestedAt = w.RequestedAt,

                    RecentHistory = recent.Select(r => new RecentWithdrawalDto
                    {
                        Amount = r.Amount,
                        Date = r.RequestedAt,
                        Status = r.Status
                    }).ToList(),

                    PaymentMethods = paymentMethods.Select(p => new PaymentMethodDto
                    {
                        MethodType = p.MethodType,
                        MaskedDisplay = p.MaskedDisplay,
                        IsDefault = p.IsDefault
                    }).ToList()
                };

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load withdrawal details";
                result.Data = null;
                return result;
            }
        }


        public async Task<ServiceResult<ConsultantBankDetailsDto>> GetConsultantBankDetailsAsync(Guid consultantId)
        {
            var result = new ServiceResult<ConsultantBankDetailsDto>();
            try
            {
                var details = await _dbContext.ConsultantBankDetails
                    .FirstOrDefaultAsync(x => x.ConsultantId == consultantId);

                if (details == null)
                {
                    result.Success = true;
                    result.StatusCode = 200;
                    result.Message = "No bank details found";
                    result.Data = null;
                    return result;
                }

                result.Success = true;
                result.StatusCode = 200;
                result.Data = new ConsultantBankDetailsDto
                {
                    Id = details.Id,
                    ConsultantId = details.ConsultantId,
                    AccountHolderName = details.AccountHolderName,
                    BankName = details.BankName,
                    AccountNumber = details.AccountNumber,
                    IFSCCode = details.IFSCCode,
                    BranchName = details.BranchName,
                    IsDefault = details.IsDefault,
                    IsVerified = details.IsVerified
                };
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Error fetching bank details: " + ex.Message;
            }
            return result;
        }

        public async Task<ServiceResult<bool>> UpdateConsultantBankDetailsAsync(Guid consultantId, ConsultantBankDetailsDto dto)
        {
            var result = new ServiceResult<bool>();
            try
            {
                var details = await _dbContext.ConsultantBankDetails
                    .FirstOrDefaultAsync(x => x.ConsultantId == consultantId);

                if (details == null)
                {
                    details = new ConsultantBankDetails
                    {
                        Id = Guid.NewGuid(),
                        ConsultantId = consultantId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.ConsultantBankDetails.Add(details);
                }

                details.AccountHolderName = dto.AccountHolderName;
                details.BankName = dto.BankName;
                details.AccountNumber = dto.AccountNumber;
                details.IFSCCode = dto.IFSCCode;
                details.BranchName = dto.BranchName;
                details.IsDefault = true;
                details.UpdatedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Bank details updated successfully";
                result.Data = true;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Error updating bank details: " + ex.Message;
                result.Data = false;
            }
            return result;
        }

    }
}
