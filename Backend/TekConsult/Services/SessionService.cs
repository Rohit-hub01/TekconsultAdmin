using Microsoft.EntityFrameworkCore;
using System.Linq;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.ServiceResult;
using Microsoft.AspNetCore.SignalR;
using TekConsult.Hubs;
using TekConsult.Enums;

namespace TekConsult.Services
{
    public interface ISessionService
    {
        Task<ServiceResult<bool>> EndSessionAsync(Guid sessionId, Guid endedByUserId);
        Task<ServiceResult<DateTime>> RecalculateSessionTimeAsync(Guid sessionId, Guid userId);
        Task<ServiceResult<List<DisputeRowDto>>> GetAllDisputesForAdminAsync();
        Task<ServiceResult<bool>> RaiseDisputeAsync(Guid userId, RaiseDisputeDto dto);
        Task<ServiceResult<bool>> ResolveDisputeAsync(Guid adminId, ResolveDisputeDto dto);
        Task<ServiceResult<ReviewResponseDto>> SubmitReviewAsync(Guid userId, SubmitReviewDto dto);
        Task<ServiceResult<ReviewListResponseDto>> GetReviewsForConsultantAsync(Guid consultantId, int skip = 0, int take = 5);
        Task<ServiceResult<ReviewListResponseDto>> GetReviewsForUserAsync(Guid userId);
        Task<ServiceResult<ReviewListResponseDto>> GetAllReviewsForAdminAsync();
        Task<ServiceResult<PaginatedSessionHistoryDto>> GetSessionHistoryByUserIdAsync(Guid userId, int skip, int take, SessionState? status = null, DateTime? startDate = null, DateTime? endDate = null);
        Task<ServiceResult<PaginatedSessionHistoryDto>> GetSessionHistoryByConsultantIdPaginatedAsync(Guid consultantId, int skip, int take);
        Task<ServiceResult<List<SessionRequestDto>>> GetSessionRequestsByConsultantIdAsync(Guid consultantId);
        Task<ServiceResult<bool>> HandleSessionRequestAsync(Guid sessionId, Guid consultantId, bool accept);
        Task<ServiceResult<SessionResponseDto>> GetSessionByIdAsync(Guid sessionId, Guid? userId = null);

    }
    public class SessionService : ISessionService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;
        private readonly IAuditLogService _auditLogService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IAgoraTokenService _agoraTokenService;
        private readonly IPricingService _pricingService;
        
        public SessionService(AppDbContext dbContext, IConfiguration configuration, IAuditLogService auditLogService, INotificationService notificationService, IHubContext<ChatHub> hubContext, IAgoraTokenService agoraTokenService, IPricingService pricingService)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _auditLogService = auditLogService;
            _notificationService = notificationService;
            _hubContext = hubContext;
            _agoraTokenService = agoraTokenService;
            _pricingService = pricingService;
        }
        // =========================================
        // END SESSION
        // =========================================
        public async Task<ServiceResult<bool>> EndSessionAsync(Guid sessionId, Guid endedByUserId)
        {
            var result = new ServiceResult<bool>();

            try
            {
                var session = await _dbContext.ConsultationSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                if (session == null)
                    return Fail<bool>(404, "Session not found");

                if (session.State != SessionState.Active)
                    return Fail<bool>(400, "Session not active");

                var endTime = DateTime.UtcNow;

                if (session.MaxAllowedEndTime.HasValue && endTime > session.MaxAllowedEndTime.Value)
                    endTime = session.MaxAllowedEndTime.Value;

                session.EndTime = endTime;
                session.State = SessionState.Completed;

                // Validate that the session was properly started
                if (!session.StartTime.HasValue)
                    return Fail<bool>(400, "Session was not properly started (StartTime is null)");

                var durationSeconds = (int)(endTime - session.StartTime.Value).TotalSeconds;
                session.TotalDurationSeconds = durationSeconds;

                // Load participants WITHOUT casting to User immediately to ensure Includes work
                var participants = await _dbContext.SessionParticipants
                    .Where(x => x.SessionId == sessionId)
                    .Include(x => x.User)
                        .ThenInclude(u => u.ConsultantProfiles)
                    .Include(x => x.User)
                        .ThenInclude(u => u.Roles)
                    .ToListAsync();


                Users user = null;
                Users consultant = null;

                foreach (var p in participants)
                {
                    if (p.User?.Roles?.RoleName == "User") user = p.User;
                    if (p.User?.Roles?.RoleName == "Consultant") consultant = p.User;
                }

                if (user == null || consultant == null)
                    return Fail<bool>(500, "Missing User or Consultant in session participants");

                var profile = await _dbContext.ConsultantProfiles.FirstOrDefaultAsync(x => x.UserId == consultant.UserId);
                if (profile == null) profile = consultant.ConsultantProfiles; // Fallback

                if (profile == null)
                     return Fail<bool>(500, "Consultant profile not found");

                // Check if this is the first session between user and consultant
                var previousSessionsCount = await _dbContext.SessionParticipants
                    .Where(p => p.UserId == user.UserId && p.SessionId != sessionId)
                    .Select(p => p.SessionId)
                    .Distinct()
                    .CountAsync(sid => _dbContext.SessionParticipants
                        .Any(p2 => p2.SessionId == sid && p2.UserId == consultant.UserId) &&
                        _dbContext.ConsultationSessions.Any(s => s.SessionId == sid && s.State == SessionState.Completed));

                var isFirstSession = previousSessionsCount == 0;

                var freeSeconds = isFirstSession ? (profile.FreeMinutesOffer * 60) : 0;
                var billableSeconds = Math.Max(0, durationSeconds - freeSeconds);

                var ratePerMinute = session.AppliedRate > 0 ? session.AppliedRate : (session.Mode == 0 ? profile.ChatRatePerMinute : profile.CallRatePerMinute);
                var amount = (billableSeconds / 60m) * ratePerMinute;

                var userWallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == user.UserId);
                if (userWallet == null) 
                     return Fail<bool>(500, "User wallet not found");

                var consultantWallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == consultant.UserId);

                if (consultantWallet == null)
                {
                    consultantWallet = new Wallets
                    {
                        WalletId = Guid.NewGuid(),
                        UserId = consultant.UserId,
                        Balance = 0,
                        LastUpdated = DateTime.UtcNow
                    };
                    _dbContext.Wallets.Add(consultantWallet);
                }

                // Deduct user
                userWallet.Balance -= amount;
                userWallet.LastUpdated = DateTime.UtcNow;

                // Credit consultant
                consultantWallet.Balance += amount;
                consultantWallet.LastUpdated = DateTime.UtcNow;

                session.TotalChargedAmount = amount;
                session.ConsultantEarnings = amount;

                // Insert billing tick
                _dbContext.SessionBillingTicks.Add(new SessionBillingTicks
                {
                    TickId = Guid.NewGuid(),
                    SessionId = sessionId,
                    AmountDeducted = amount,
                    BalanceAfterDeduction = userWallet.Balance,
                    Timestamp = DateTime.UtcNow
                });

                // Record Transaction for User (Debit)
                _dbContext.Transactions.Add(new Transactions
                {
                    TransactionId = Guid.NewGuid(),
                    WalletId = userWallet.WalletId,
                    Amount = amount,
                    TransactionType = 2, // Debit
                    Status = 1, // Success
                    ReferenceId = sessionId.ToString(),
                    PaymentMethod = "Session Payment",
                    PaymentMethodRef = sessionId.ToString(),
                    Timestamp = DateTime.UtcNow
                });

                // Record Transaction for Consultant (Credit)
                _dbContext.Transactions.Add(new Transactions
                {
                    TransactionId = Guid.NewGuid(),
                    WalletId = consultantWallet.WalletId,
                    Amount = amount,
                    TransactionType = 1, // Credit
                    Status = 1, // Success
                    ReferenceId = sessionId.ToString(),
                    PaymentMethod = "Session Earning",
                    PaymentMethodRef = sessionId.ToString(),
                    Timestamp = DateTime.UtcNow
                });

                await _dbContext.SaveChangesAsync();

                // 🔥 BROADCAST SessionEnded event to all participants
                var sessionEndedPayload = new
                {
                    SessionId = sessionId,
                    EndTime = endTime,
                    DurationSeconds = durationSeconds,
                    TotalChargedAmount = amount,
                    Message = "Session has ended"
                };

                // Send to session group
                await _hubContext.Clients.Group(sessionId.ToString())
                    .SendAsync("SessionEnded", sessionEndedPayload);

                // 🔥 Also send to each participant's personal group for guaranteed delivery
                foreach (var p in participants)
                {
                    await _hubContext.Clients.Group($"user-{p.UserId}")
                        .SendAsync("SessionEnded", sessionEndedPayload);
                }

                // Audit log
                await _auditLogService.LogAsync(
                    "SESSION_ENDED",
                    "ConsultationSessions",
                    sessionId.ToString(),
                    endedByUserId,
                    $"State: 1 (Active)",
                    $"State: 2 (Completed), Duration: {durationSeconds}s, Amount: {amount}"
                );

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Session ended and billed";
                result.Data = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EndSessionAsync ERROR] {ex}");
                return Fail<bool>(500, $"Failed to end session: {ex.Message}");
            }

            return result;
        }

        private ServiceResult<T> Fail<T>(int code, string msg)
        {
            return new ServiceResult<T>
            {
                Success = false,
                StatusCode = code,
                Message = msg,
                Data = default
            };
        }

        public async Task<ServiceResult<DateTime>> RecalculateSessionTimeAsync(Guid sessionId, Guid userId)
        {
            try
            {
                var session = await _dbContext.ConsultationSessions
                    .FirstOrDefaultAsync(x => x.SessionId == sessionId);

                if (session == null)
                    return Fail<DateTime>(404, "Session not found");

                if (session.State != SessionState.Active)
                    return Fail<DateTime>(400, "Session not active");

                // Must be participant or admin
                var isParticipant = await _dbContext.SessionParticipants
                    .AnyAsync(x => x.SessionId == sessionId && x.UserId == userId);

                if (!isParticipant)
                    return Fail<DateTime>(403, "You are not part of this session");

                // =========================
                // Load participants
                // =========================
                var participants = await _dbContext.SessionParticipants
    .Where(x => x.SessionId == sessionId)
    .Include(x => x.User)
        .ThenInclude(u => u.Roles)
    .Include(x => x.User)
        .ThenInclude(u => u.ConsultantProfiles)
    .Select(x => x.User)   // ✅ SELECT MUST BE LAST
    .ToListAsync();


                var user = participants.First(x => x.Roles.RoleName == "User");
                var consultant = participants.First(x => x.Roles.RoleName == "Consultant");

                // =========================
                // Load wallet & profile
                // =========================
                var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == user.UserId);
                if (wallet == null || wallet.Balance <= 0)
                    return Fail<DateTime>(400, "Insufficient balance");

                var profile = consultant.ConsultantProfiles!;
                var rate = session.Mode == 0 ? profile.ChatRatePerMinute : profile.CallRatePerMinute;

                if (rate <= 0)
                    return Fail<DateTime>(400, "Invalid rate");

                // =========================
                // Calculate new allowed time
                // =========================
                var freeSeconds = profile.FreeMinutesOffer * 60;
                var paidSeconds = (int)((wallet.Balance / rate) * 60);

                var maxSeconds = freeSeconds + paidSeconds;

                // Check for low balance (e.g., less than 5 minutes of paid time remaining)
                if (paidSeconds < 300 && paidSeconds > 0)
                {
                    await _notificationService.NotifyUserAsync(
                        user.UserId,
                        "Low Balance",
                        "Your balance is low. Please recharge to continue the session without interruption.",
                        Enums.NotificationType.LowBalance
                    );
                }

                var now = DateTime.UtcNow;

                // IMPORTANT: Remaining time from now
                var newMaxTime = now.AddSeconds(maxSeconds);

                // Only EXTEND, never shorten
                if (!session.MaxAllowedEndTime.HasValue || newMaxTime > session.MaxAllowedEndTime.Value)
                {
                    session.MaxAllowedEndTime = newMaxTime;
                    await _dbContext.SaveChangesAsync();
                }

                return new ServiceResult<DateTime>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Session time recalculated",
                    Data = session.MaxAllowedEndTime.Value
                };
            }
            catch
            {
                return Fail<DateTime>(500, "Failed to recalculate time");
            }
        }

        public async Task<ServiceResult<List<DisputeRowDto>>> GetAllDisputesForAdminAsync()
        {
            var result = new ServiceResult<List<DisputeRowDto>>();

            try
            {
                var disputes = await _dbContext.Disputes
                    .Include(x => x.Session)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                var list = new List<DisputeRowDto>();

                foreach (var d in disputes)
                {
                    // Find participants
                    var participants = await _dbContext.SessionParticipants
                        .Where(p => p.SessionId == d.SessionId)
                        .Include(p => p.User)
                            .ThenInclude(u => u.Roles)
                        .ToListAsync();

                    // Safely find user and consultant with null checks
                    var user = participants.FirstOrDefault(u => u.User?.Roles?.RoleName == "User")?.User;
                    var consultant = participants.FirstOrDefault(u => u.User?.Roles?.RoleName == "Consultant")?.User;

                    // Get category from consultant profile if available
                    string category = "";
                    if (consultant != null)
                    {
                        var profile = await _dbContext.ConsultantProfiles
                            .FirstOrDefaultAsync(p => p.UserId == consultant.UserId);
                        category = profile?.ConsultantCategory ?? "";
                    }

                    string userName = user != null ? $"{user.FirstName} {user.MiddleName} {user.LastName}".Replace("  ", " ").Trim() : "Unknown User";
                    string consultantName = consultant != null ? $"{consultant.FirstName} {consultant.MiddleName} {consultant.LastName}".Replace("  ", " ").Trim() : "Unknown Consultant";

                    list.Add(new DisputeRowDto
                    {
                        DisputeId = d.DisputeId,
                        SessionId = d.SessionId,
                        UserName = userName,
                        ConsultantName = consultantName,
                        Category = category,
                        Amount = d.RefundAmount,
                        Status = d.Status,
                        CreatedAt = d.CreatedAt,
                        Description = d.Description
                    });
                }

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Disputes loaded";
                result.Data = list;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load disputes: " + ex.Message;
                result.Data = null;
            }

            return result;
        }


        public async Task<ServiceResult<bool>> RaiseDisputeAsync(Guid userId, RaiseDisputeDto dto)
        {
            var result = new ServiceResult<bool>();

            try
            {
                // 1. Verify session exists
                var session = await _dbContext.ConsultationSessions
                    .FirstOrDefaultAsync(x => x.SessionId == dto.SessionId);

                if (session == null)
                    return Fail<bool>(404, "Session not found");

                // 2. Verify user is a participant
                var isParticipant = await _dbContext.SessionParticipants
                    .AnyAsync(x => x.SessionId == dto.SessionId && x.UserId == userId);

                if (!isParticipant)
                    return Fail<bool>(403, "You were not part of this session");

                // 3. Check if dispute already exists
                if (session.IsDisputed)
                    return Fail<bool>(400, "A dispute has already been raised for this session");

                // 4. Create dispute
                var dispute = new Disputes
                {
                    DisputeId = Guid.NewGuid(),
                    SessionId = dto.SessionId,
                    RaisedByUserId = userId,
                    Description = dto.Description,
                    RefundAmount = dto.RefundAmount,
                    Status = 0, // Pending
                    CreatedAt = DateTime.UtcNow
                };

                // 5. Update session flag
                session.IsDisputed = true;

                _dbContext.Disputes.Add(dispute);
                await _dbContext.SaveChangesAsync();

                // Notification to Admin
                await _notificationService.NotifyAdminAsync(
                    "New Dispute Raised",
                    $"A new dispute has been raised for Session {dto.SessionId}.",
                    Enums.NotificationType.NewDisputeRaised
                );

                // Notification to Consultant involved
                var consultant = await _dbContext.SessionParticipants
                    .Where(p => p.SessionId == dto.SessionId)
                    .Include(p => p.User)
                        .ThenInclude(u => u.Roles)
                    .FirstOrDefaultAsync(p => p.User.Roles.RoleName == "Consultant");

                if (consultant != null)
                {
                    await _notificationService.NotifyUserAsync(
                        consultant.UserId,
                        "Dispute Raised",
                        $"A user has raised a dispute for your session {dto.SessionId}.",
                        Enums.NotificationType.DisputeAgainstConsultant
                    );
                }

                // Audit log
                await _auditLogService.LogAsync(
                    "DISPUTE_RAISED",
                    "Disputes",
                    dispute.DisputeId.ToString(),
                    userId,
                    null,
                    $"Status: Pending, RefundAmount: {dto.RefundAmount}, Description: {dto.Description}"
                );

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Dispute raised successfully";
                result.Data = true;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to raise dispute: " + ex.Message;
                result.Data = false;
            }

            return result;
        }

        public async Task<ServiceResult<bool>> ResolveDisputeAsync(Guid adminId, ResolveDisputeDto dto)
        {
            var result = new ServiceResult<bool>();

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                // 1. Load Dispute
                var dispute = await _dbContext.Disputes
                    .FirstOrDefaultAsync(x => x.DisputeId == dto.DisputeId);

                if (dispute == null)
                    return Fail<bool>(404, "Dispute not found");

                if (dispute.Status != 0) // Not Pending
                    return Fail<bool>(400, "Dispute is already resolved or rejected");

                // 2. If Rejected
                if (!dto.Approve)
                {
                    dispute.Status = 2; // Rejected
                    dispute.ResolvedAt = DateTime.UtcNow;

                    await _dbContext.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Audit log
                    await _auditLogService.LogAsync(
                        "DISPUTE_REJECTED",
                        "Disputes",
                        dispute.DisputeId.ToString(),
                        adminId,
                        $"Status: Pending, RefundAmount: {dispute.RefundAmount}",
                        $"Status: Rejected"
                    );

                    result.Success = true;
                    result.StatusCode = 200;
                    result.Message = "Dispute rejected by admin";
                    result.Data = true;
                    return result;
                }

                // 3. 🔥 Determine Refund Amount (FULL or PARTIAL)
                decimal refundAmount;

                if (dto.PartialAmount.HasValue)
                {
                    if (dto.PartialAmount.Value <= 0)
                        return Fail<bool>(400, "Partial refund amount must be greater than 0");

                    if (dto.PartialAmount.Value > dispute.RefundAmount)
                        return Fail<bool>(400, "Partial refund amount cannot exceed original amount");

                    refundAmount = dto.PartialAmount.Value;
                }
                else
                {
                    refundAmount = dispute.RefundAmount;
                }

                // 4. Find participants to identify User and Consultant
                var participants = await _dbContext.SessionParticipants
                    .Where(p => p.SessionId == dispute.SessionId)
                    .Include(p => p.User)
                        .ThenInclude(u => u.Roles)
                    .ToListAsync();

                var customer = participants.FirstOrDefault(u => u.User?.Roles?.RoleName == "User")?.User;
                var consultant = participants.FirstOrDefault(u => u.User?.Roles?.RoleName == "Consultant")?.User;

                if (customer == null || consultant == null)
                    return Fail<bool>(400, "Could not identify session participants for refund");

                // 5. Load Wallets
                var userWallet = await _dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == customer.UserId);
                var consultantWallet = await _dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == consultant.UserId);

                if (userWallet == null || consultantWallet == null)
                    return Fail<bool>(400, "Wallet not found for one or more participants");

                // 6. Safety Check: Consultant must have enough balance
                if (consultantWallet.Balance < refundAmount)
                    return Fail<bool>(400, "Consultant does not have enough balance for refund");

                // 7. Process Money Transfer
                userWallet.Balance += refundAmount;
                consultantWallet.Balance -= refundAmount;

                userWallet.LastUpdated = DateTime.UtcNow;
                consultantWallet.LastUpdated = DateTime.UtcNow;

                // 8. Records Transactions
                _dbContext.Transactions.Add(new Transactions
                {
                    TransactionId = Guid.NewGuid(),
                    WalletId = userWallet.WalletId,
                    Amount = refundAmount,
                    TransactionType = 1, // Credit
                    Status = 1, // Success
                    ReferenceId = dispute.DisputeId.ToString(),
                    PaymentMethod = "Dispute Refund",
                    Timestamp = DateTime.UtcNow
                });

                _dbContext.Transactions.Add(new Transactions
                {
                    TransactionId = Guid.NewGuid(),
                    WalletId = consultantWallet.WalletId,
                    Amount = refundAmount,
                    TransactionType = 2, // Debit
                    Status = 1, // Success
                    ReferenceId = dispute.DisputeId.ToString(),
                    PaymentMethod = "Dispute Refund",
                    Timestamp = DateTime.UtcNow
                });

                // 9. Update Dispute
                dispute.Status = 1; // Resolved
                dispute.ResolvedAt = DateTime.UtcNow;

                // (Optional but recommended)
                dispute.RefundAmount = refundAmount; // Store actual refunded amount

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notification to User
                await _notificationService.NotifyUserAsync(
                    customer.UserId,
                    "Dispute Resolved",
                    $"Your dispute for session {dispute.SessionId} has been resolved. Refund amount: {refundAmount} INR.",
                    Enums.NotificationType.DisputeResolved
                );

                // Audit log
                await _auditLogService.LogAsync(
                    "DISPUTE_RESOLVED",
                    "Disputes",
                    dispute.DisputeId.ToString(),
                    adminId,
                    $"Status: Pending, RefundAmount: {dispute.RefundAmount}",
                    $"Status: Resolved, ActualRefund: {refundAmount}"
                );

                result.Success = true;
                result.StatusCode = 200;
                result.Message = dto.PartialAmount.HasValue
                    ? "Dispute resolved with partial refund"
                    : "Dispute resolved and full refund processed";

                result.Data = true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to resolve dispute: " + ex.Message;
                result.Data = false;
            }

            return result;
        }

        public async Task<ServiceResult<ReviewResponseDto>> SubmitReviewAsync(Guid userId, SubmitReviewDto dto)
        {
            var result = new ServiceResult<ReviewResponseDto>();

            try
            {
                // 0. Parse SessionId from string
                if (string.IsNullOrEmpty(dto.SessionId) || !Guid.TryParse(dto.SessionId, out var sessionId))
                {
                    return new ServiceResult<ReviewResponseDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Invalid session ID format",
                        Data = null
                    };
                }

                // 1. Validate rating (1-5)
                if (dto.Rating < 1 || dto.Rating > 5)
                {
                    return new ServiceResult<ReviewResponseDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Rating must be between 1 and 5",
                        Data = null
                    };
                }

                // 2. Verify session exists and is completed
                var session = await _dbContext.ConsultationSessions
                    .FirstOrDefaultAsync(x => x.SessionId == sessionId);

                if (session == null)
                {
                    return new ServiceResult<ReviewResponseDto>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Session not found",
                        Data = null
                    };
                }

                if (session.State != SessionState.Completed) // Not Completed
                {
                    return new ServiceResult<ReviewResponseDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Can only review completed sessions",
                        Data = null
                    };
                }

                // 3. Verify user is a participant in the session
                var isParticipant = await _dbContext.SessionParticipants
                    .AnyAsync(x => x.SessionId == sessionId && x.UserId == userId);

                if (!isParticipant)
                {
                    return new ServiceResult<ReviewResponseDto>
                    {
                        Success = false,
                        StatusCode = 403,
                        Message = "You were not part of this session",
                        Data = null
                    };
                }

                // 4. Check if review already exists
                var existingReview = await _dbContext.Reviews
                    .FirstOrDefaultAsync(x => x.SessionId == sessionId && x.UserId == userId);

                if (existingReview != null)
                {
                    return new ServiceResult<ReviewResponseDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "You have already reviewed this session",
                        Data = null
                    };
                }

                // 5. Get consultant ID from session participants
                var consultantParticipant = await _dbContext.SessionParticipants
                    .Where(x => x.SessionId == sessionId)
                    .Include(x => x.User)
                        .ThenInclude(u => u.Roles)
                    .FirstOrDefaultAsync(x => x.User.Roles.RoleName == "Consultant");

                if (consultantParticipant == null)
                {
                    return new ServiceResult<ReviewResponseDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Could not find consultant for this session",
                        Data = null
                    };
                }

                // 6. Create review
                var review = new Reviews
                {
                    ReviewId = Guid.NewGuid(),
                    SessionId = sessionId,
                    UserId = userId,
                    ConsultantId = consultantParticipant.UserId,
                    Rating = dto.Rating,
                    Comment = dto.Comment,
                    IsModerated = false,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Reviews.Add(review);
                await _dbContext.SaveChangesAsync();

                // 7. Update consultant's average rating
                var consultantProfile = await _dbContext.ConsultantProfiles
                    .FirstOrDefaultAsync(x => x.UserId == consultantParticipant.UserId);

                if (consultantProfile != null)
                {
                    // Get all reviews for this consultant
                    var allReviews = await _dbContext.Reviews
                        .Where(x => x.ConsultantId == consultantParticipant.UserId)
                        .ToListAsync();

                    // Calculate average rating
                    if (allReviews.Any())
                    {
                        consultantProfile.AverageRating = Math.Round((decimal)allReviews.Average(x => x.Rating), 1);
                        consultantProfile.ModifiedAt = DateTime.UtcNow;
                        await _dbContext.SaveChangesAsync();
                    }
                }

                // 8. Send Notification to Consultant
                var reviewer = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                var reviewerName = reviewer != null ? $"{reviewer.FirstName} {reviewer.LastName}".Trim() : "A user";
                
                await _notificationService.NotifyUserAsync(
                    consultantParticipant.UserId,
                    "New Review Received",
                    $"{reviewerName} gave you a {dto.Rating}-star review.",
                    NotificationType.NewReviewReceived
                );

                // 9. Audit log
                await _auditLogService.LogAsync(
                    "REVIEW_SUBMITTED",
                    "Reviews",
                    review.ReviewId.ToString(),
                    userId,
                    null,
                    $"Rating: {dto.Rating}, ConsultantId: {consultantParticipant.UserId}, Comment Length: {dto.Comment?.Length ?? 0}"
                );

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Review submitted successfully";
                result.Data = new ReviewResponseDto
                {
                    ReviewId = review.ReviewId,
                    SessionId = review.SessionId,
                    UserId = review.UserId,
                    ConsultantId = review.ConsultantId,
                    Rating = review.Rating,
                    Comment = review.Comment,
                    IsModerated = review.IsModerated,
                    CreatedAt = review.CreatedAt
                };
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to submit review: " + ex.Message;
                result.Data = null;
            }

            return result;
        }

        /// <summary>
        /// Get all reviews for a specific consultant (viewed by the consultant themselves)
        /// </summary>
        public async Task<ServiceResult<ReviewListResponseDto>> GetReviewsForConsultantAsync(Guid consultantId, int skip = 0, int take = 5)
        {
            var result = new ServiceResult<ReviewListResponseDto>
            {
                Success = true,
                StatusCode = 200,
                Message = "Reviews retrieved successfully",
                Data = new ReviewListResponseDto()
            };

            try
            {
                var reviews = await _dbContext.Reviews
                    .Where(r => r.ConsultantId == consultantId)
                    .Include(r => r.ConsultationSessions)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                if (!reviews.Any())
                {
                    result.Data.Reviews = new List<ReviewDetailsDto>();
                    result.Data.TotalCount = 0;
                    result.Data.AverageRating = 0;
                    return result;
                }

                result.Data.TotalCount = reviews.Count;
                result.Data.AverageRating = Math.Round((decimal)reviews.Average(r => r.Rating), 1);

                var pagedReviews = reviews.Skip(skip).Take(take).ToList();

                var reviewDetailsList = new List<ReviewDetailsDto>();
                foreach (var review in pagedReviews)
                {
                    var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == review.UserId);
                    var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Anonymous";

                    reviewDetailsList.Add(new ReviewDetailsDto
                    {
                        ReviewId = review.ReviewId,
                        SessionId = review.SessionId,
                        UserId = review.UserId,
                        UserName = userName,
                        ConsultantId = review.ConsultantId,
                        ConsultantName = "", // Consultant viewing their own reviews, so we don't need this
                        Rating = review.Rating,
                        Comment = review.Comment,
                        IsModerated = review.IsModerated,
                        CreatedAt = review.CreatedAt,
                        UserProfilePhotoUrl = user?.ProfilePhotoUrl
                    });
                }

                result.Data.Reviews = reviewDetailsList;
                result.Data.TotalCount = reviews.Count;
                result.Data.AverageRating = Math.Round((decimal)reviews.Average(r => r.Rating), 1);

                await _auditLogService.LogAsync("VIEW", "Reviews", null, consultantId, null, $"Consultant viewed reviews. Count: {reviewDetailsList.Count}");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to retrieve consultant reviews: " + ex.Message;
                result.Data = null;
            }

            return result;
        }

        /// <summary>
        /// Get all reviews submitted by a user
        /// </summary>
        public async Task<ServiceResult<ReviewListResponseDto>> GetReviewsForUserAsync(Guid userId)
        {
            var result = new ServiceResult<ReviewListResponseDto>
            {
                Success = true,
                StatusCode = 200,
                Message = "Reviews retrieved successfully",
                Data = new ReviewListResponseDto()
            };

            try
            {
                var reviews = await _dbContext.Reviews
                    .Where(r => r.UserId == userId)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                if (!reviews.Any())
                {
                    result.Data.Reviews = new List<ReviewDetailsDto>();
                    result.Data.TotalCount = 0;
                    result.Data.AverageRating = 0;
                    return result;
                }

                var reviewDetailsList = new List<ReviewDetailsDto>();
                foreach (var review in reviews)
                {
                    var consultant = await _dbContext.ConsultantProfiles
                        .Include(cp => cp.User)
                        .FirstOrDefaultAsync(cp => cp.UserId == review.ConsultantId);
                    var consultantName = consultant?.User != null 
                        ? $"{consultant.User.FirstName} {consultant.User.LastName}".Trim() 
                        : "Unknown Consultant";

                    reviewDetailsList.Add(new ReviewDetailsDto
                    {
                        ReviewId = review.ReviewId,
                        SessionId = review.SessionId,
                        UserId = review.UserId,
                        UserName = "", // User viewing their own reviews, so we don't need this
                        ConsultantId = review.ConsultantId,
                        ConsultantName = consultantName,
                        Rating = review.Rating,
                        Comment = review.Comment,
                        IsModerated = review.IsModerated,
                        CreatedAt = review.CreatedAt,
                        ConsultantProfilePhotoUrl = consultant?.ProfilePhotoUrl
                    });
                }

                result.Data.Reviews = reviewDetailsList;
                result.Data.TotalCount = reviewDetailsList.Count;
                result.Data.AverageRating = Math.Round((decimal)reviews.Average(r => r.Rating), 1);

                await _auditLogService.LogAsync("VIEW", "Reviews", null, userId, null, $"User viewed reviews submitted. Count: {reviewDetailsList.Count}");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to retrieve user reviews: " + ex.Message;
                result.Data = null;
            }

            return result;
        }

        /// <summary>
        /// Get all reviews in the system (admin only)
        /// </summary>
        public async Task<ServiceResult<ReviewListResponseDto>> GetAllReviewsForAdminAsync()
        {
            var result = new ServiceResult<ReviewListResponseDto>
            {
                Success = true,
                StatusCode = 200,
                Message = "All reviews retrieved successfully",
                Data = new ReviewListResponseDto()
            };

            try
            {
                var reviews = await _dbContext.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                if (!reviews.Any())
                {
                    result.Data.Reviews = new List<ReviewDetailsDto>();
                    result.Data.TotalCount = 0;
                    result.Data.AverageRating = 0;
                    return result;
                }

                var reviewDetailsList = new List<ReviewDetailsDto>();
                foreach (var review in reviews)
                {
                    var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == review.UserId);
                    var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Anonymous";

                    var consultant = await _dbContext.ConsultantProfiles
                        .Include(cp => cp.User)
                        .FirstOrDefaultAsync(cp => cp.UserId == review.ConsultantId);
                    var consultantName = consultant?.User != null 
                        ? $"{consultant.User.FirstName} {consultant.User.LastName}".Trim() 
                        : "Unknown Consultant";

                    reviewDetailsList.Add(new ReviewDetailsDto
                    {
                        ReviewId = review.ReviewId,
                        SessionId = review.SessionId,
                        UserId = review.UserId,
                        UserName = userName,
                        ConsultantId = review.ConsultantId,
                        ConsultantName = consultantName,
                        Rating = review.Rating,
                        Comment = review.Comment,
                        IsModerated = review.IsModerated,
                        CreatedAt = review.CreatedAt,
                        UserProfilePhotoUrl = user?.ProfilePhotoUrl,
                        ConsultantProfilePhotoUrl = consultant?.ProfilePhotoUrl
                    });
                }

                result.Data.Reviews = reviewDetailsList;
                result.Data.TotalCount = reviewDetailsList.Count;
                result.Data.AverageRating = (decimal)reviews.Average(r => r.Rating);

                // Audit log the admin viewing all reviews
                await _auditLogService.LogAsync("VIEW", "Reviews", null, null, null, $"Admin viewed all reviews. Total: {reviewDetailsList.Count}");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to retrieve all reviews: " + ex.Message;
                result.Data = null;
            }

            return result;
        }


        public async Task<ServiceResult<PaginatedSessionHistoryDto>> GetSessionHistoryByConsultantIdPaginatedAsync(Guid consultantId, int skip, int take)
        {
            var result = new ServiceResult<PaginatedSessionHistoryDto>();

            try
            {
                var query = _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                        .ThenInclude(p => p.User)
                    .Where(s => s.Participants.Any(p => p.UserId == consultantId));

                var totalCount = await query.CountAsync();
                var pagedSessions = await query
                    .OrderByDescending(s => s.StartTime ?? s.CreatedAt)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                var sessionIds = pagedSessions.Select(s => s.SessionId).ToList();
                var reviews = await _dbContext.Reviews
                    .Where(r => sessionIds.Contains(r.SessionId))
                    .ToListAsync();

                var history = new List<SessionHistoryDto>();

                foreach (var session in pagedSessions)
                {
                    var userParticipant = session.Participants
                        .FirstOrDefault(p => p.UserId != consultantId);

                    var review = reviews.FirstOrDefault(r => r.SessionId == session.SessionId);

                    history.Add(new SessionHistoryDto
                    {
                        SessionId = session.SessionId,
                        UserId = userParticipant?.UserId ?? Guid.Empty,
                        UserName = userParticipant?.User != null 
                            ? $"{userParticipant.User.FirstName} {userParticipant.User.LastName}".Trim() 
                            : "Unknown User",
                        Mode = session.Mode,
                        StartTime = session.StartTime ?? session.CreatedAt,
                        EndTime = session.EndTime,
                        DurationSeconds = session.TotalDurationSeconds ?? 0,
                        TotalChargedAmount = session.TotalChargedAmount,
                        ConsultantEarnings = session.ConsultantEarnings,
                        State = session.State,
                        Rating = review?.Rating,
                        ReviewComment = review?.Comment,
                        ProfilePhotoUrl = userParticipant?.User?.ProfilePhotoUrl,
                        IsDisputed = session.IsDisputed
                    });
                }

                var currentPage = take > 0 ? (skip / take) + 1 : 1;
                var totalPages = take > 0 ? (int)Math.Ceiling(totalCount / (double)take) : 1;

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Session history retrieved";
                result.Data = new PaginatedSessionHistoryDto
                {
                    Sessions = history,
                    TotalCount = totalCount,
                    CurrentPage = currentPage,
                    PageSize = take,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load session history: " + ex.Message;
                result.Data = null;
            }

            return result;
        }

        public async Task<ServiceResult<List<SessionHistoryDto>>> GetSessionHistoryByConsultantIdAsync(Guid consultantId)
        {
            var result = await GetSessionHistoryByConsultantIdPaginatedAsync(consultantId, 0, 1000);
            return new ServiceResult<List<SessionHistoryDto>>
            {
                Success = result.Success,
                StatusCode = result.StatusCode,
                Message = result.Message,
                Data = result.Data?.Sessions
            };
        }

        public async Task<ServiceResult<PaginatedSessionHistoryDto>> GetSessionHistoryByUserIdAsync(Guid userId, int skip, int take, SessionState? status = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var result = new ServiceResult<PaginatedSessionHistoryDto>();

            try
            {
                var query = _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                        .ThenInclude(p => p.User)
                            .ThenInclude(u => u.ConsultantProfiles)
                    .Where(s => s.Participants.Any(p => p.UserId == userId));

                if (status.HasValue)
                {
                    query = query.Where(s => s.State == status.Value);
                }

                if (startDate.HasValue)
                {
                    query = query.Where(s => (s.StartTime ?? s.CreatedAt) >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(s => (s.StartTime ?? s.CreatedAt) <= endDate.Value);
                }

                var totalCount = await query.CountAsync();
                var pagedSessions = await query
                    .OrderByDescending(s => s.StartTime ?? s.CreatedAt)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                var sessionIds = pagedSessions.Select(s => s.SessionId).ToList();
                var reviews = await _dbContext.Reviews
                    .Where(r => sessionIds.Contains(r.SessionId))
                    .ToListAsync();

                var history = new List<SessionHistoryDto>();

                foreach (var session in pagedSessions)
                {
                    var consultantParticipant = session.Participants
                        .FirstOrDefault(p => p.UserId != userId);

                    var review = reviews.FirstOrDefault(r => r.SessionId == session.SessionId);

                    history.Add(new SessionHistoryDto
                    {
                        SessionId = session.SessionId,
                        UserId = consultantParticipant?.UserId ?? Guid.Empty,
                        UserName = consultantParticipant?.User != null 
                            ? $"{consultantParticipant.User.FirstName} {consultantParticipant.User.LastName}".Trim() 
                            : "Unknown Consultant",
                        Mode = session.Mode,
                        StartTime = session.StartTime ?? session.CreatedAt,
                        EndTime = session.EndTime,
                        DurationSeconds = session.TotalDurationSeconds ?? 0,
                        TotalChargedAmount = session.TotalChargedAmount,
                        ConsultantEarnings = session.ConsultantEarnings,
                        State = session.State,
                        Rating = review?.Rating,
                        ReviewComment = review?.Comment,
                        ProfilePhotoUrl = consultantParticipant?.User != null 
                            ? (consultantParticipant.User.ConsultantProfiles != null 
                                ? consultantParticipant.User.ConsultantProfiles.ProfilePhotoUrl 
                                : consultantParticipant.User.ProfilePhotoUrl) 
                            : null,
                        IsDisputed = session.IsDisputed
                    });
                }

                var currentPage = take > 0 ? (skip / take) + 1 : 1;
                var totalPages = take > 0 ? (int)Math.Ceiling(totalCount / (double)take) : 1;

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Session history retrieved";
                result.Data = new PaginatedSessionHistoryDto
                {
                    Sessions = history,
                    TotalCount = totalCount,
                    CurrentPage = currentPage,
                    PageSize = take,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load session history: " + ex.Message;
                result.Data = null;
            }

            return result;
        }

        public async Task<ServiceResult<List<SessionRequestDto>>> GetSessionRequestsByConsultantIdAsync(Guid consultantId)
        {
            var result = new ServiceResult<List<SessionRequestDto>>();

            try
            {
                // Find all sessions where this consultant is a participant AND state is 0 (Created/Requested)
                var sessions = await _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                        .ThenInclude(p => p.User)
                    .Where(s => s.State == SessionState.Pending && s.Participants.Any(p => p.UserId == consultantId))
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();

                var requests = new List<SessionRequestDto>();

                foreach (var session in sessions)
                {
                    // The other participant is the User
                    var userParticipant = session.Participants
                        .FirstOrDefault(p => p.UserId != consultantId);

                    if (userParticipant == null) continue; // Should not happen if data is correct

                    var user = userParticipant.User;
                    string userName = user != null
                        ? $"{user.FirstName} {user.LastName}".Trim()
                        : "Unknown User";

                    requests.Add(new SessionRequestDto
                    {
                        SessionId = session.SessionId,
                        UserId = userParticipant.UserId,
                        UserName = userName,
                        Mode = session.Mode,
                        RequestedAt = session.CreatedAt,
                        State = session.State,
                        ProfilePhotoUrl = userParticipant.User?.ProfilePhotoUrl
                    });
                }

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Session requests retrieved";
                result.Data = requests;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load session requests: " + ex.Message;
                result.Data = null;
            }

            return result;
        }

        public async Task<ServiceResult<bool>> HandleSessionRequestAsync(Guid sessionId, Guid consultantId, bool accept)
        {
            var result = new ServiceResult<bool>();
            try
            {
                var session = await _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                    .FirstOrDefaultAsync(s => s.SessionId == sessionId);

                if (session == null)
                {
                    Console.WriteLine($"[HandleSessionRequest] Session not found: {sessionId}");
                    return Fail<bool>(404, "Session request not found");
                }

                if (session.State != SessionState.Pending)
                {
                    Console.WriteLine($"[HandleSessionRequest] Session {sessionId} is not pending. Current state: {session.State}");
                    return Fail<bool>(400, $"Session is not in a pending state. Current state: {session.State}");
                }

                // Verify consultant is a participant
                var isParticipant = session.Participants.Any(p => p.UserId == consultantId);
                if (!isParticipant)
                {
                    Console.WriteLine($"[HandleSessionRequest] Consultant {consultantId} is not a participant in session {sessionId}");
                    return Fail<bool>(403, "You are not authorized to handle this session request");
                }

                var userParticipant = session.Participants.FirstOrDefault(p => p.UserId != consultantId);
                if (userParticipant == null)
                {
                    Console.WriteLine($"[HandleSessionRequest] User participant not found in session {sessionId}");
                    return Fail<bool>(500, "User participant not found");
                }

                var consultant = await _dbContext.Users.FindAsync(consultantId);
                var now = DateTime.UtcNow;

                if (accept)
                {
                    // Calculate allowed time
                    var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(x => x.UserId == userParticipant.UserId);
                    if (wallet == null || wallet.Balance <= 0)
                    {
                        Console.WriteLine($"[HandleSessionRequest] Wallet check failed for user {userParticipant.UserId}. Wallet: {(wallet == null ? "NULL" : $"Balance={wallet.Balance}")}");
                        return Fail<bool>(400, wallet == null ? "User wallet not found" : $"User has insufficient balance (Current: ₹{wallet.Balance})");
                    }

                    var profile = await _dbContext.ConsultantProfiles.FirstOrDefaultAsync(x => x.UserId == consultantId);
                    if (profile == null)
                    {
                        Console.WriteLine($"[HandleSessionRequest] Consultant profile not found for {consultantId}");
                        return Fail<bool>(500, "Consultant profile not found");
                    }

                    var ratePerMinute = _pricingService.GetEffectiveRate(profile, session.Mode);
                    if (ratePerMinute <= 0)
                    {
                        Console.WriteLine($"[HandleSessionRequest] Rate not set for consultant {consultantId}. Mode: {session.Mode}, CallRate: {profile.CallRatePerMinute}, ChatRate: {profile.ChatRatePerMinute}");
                        return Fail<bool>(400, $"Consultant {(session.Mode == 0 ? "chat" : "call")} rate is not configured. Please update your rates in settings.");
                    }

                    // Store the rate for the entire session
                    session.AppliedRate = ratePerMinute;

                    // Check if this is the first session between user and consultant
                    var previousSessionsCount = await _dbContext.SessionParticipants
                        .Where(p => p.UserId == userParticipant.UserId && p.SessionId != sessionId)
                        .Select(p => p.SessionId)
                        .Distinct()
                        .CountAsync(sid => _dbContext.SessionParticipants
                            .Any(p2 => p2.SessionId == sid && p2.UserId == consultantId) &&
                            _dbContext.ConsultationSessions.Any(s => s.SessionId == sid && s.State == SessionState.Completed));

                    var isFirstSession = previousSessionsCount == 0;
                    var freeSeconds = isFirstSession ? (profile.FreeMinutesOffer * 60) : 0;
                    var paidSeconds = (int)Math.Max(0, (wallet.Balance / ratePerMinute) * 60);
                    var maxSeconds = freeSeconds + paidSeconds;

                    Console.WriteLine($"[HandleSessionRequest] Session {sessionId} - Balance: {wallet.Balance}, Rate: {ratePerMinute}, FreeSeconds: {freeSeconds}, PaidSeconds: {paidSeconds}, MaxSeconds: {maxSeconds}");

                    if (maxSeconds < 60) // Enforce minimum 1 minute session time
                    {
                        Console.WriteLine($"[HandleSessionRequest] Insufficient session time. MaxSeconds: {maxSeconds}");
                        return Fail<bool>(400, $"User has insufficient balance for a minimum 1-minute session (Current balance: ₹{wallet.Balance}, Required: ₹{ratePerMinute})");
                    }

                    // Update session
                    session.State = SessionState.Active; 
                    session.StartTime = now;
                    session.MaxAllowedEndTime = now.AddSeconds(maxSeconds);

                    // Audit Log
                    await _auditLogService.LogAsync(
                        "SESSION_ACCEPTED",
                        "ConsultationSessions",
                        sessionId.ToString(),
                        consultantId,
                        "State: 0",
                        "State: 1 (Active)"
                    );

                    // Notify User
                    await _notificationService.NotifyUserAsync(
                        userParticipant.UserId,
                        "Session Accepted",
                        $"Consultant {consultant?.FirstName} {consultant?.LastName} has accepted your session request.",
                        Enums.NotificationType.SessionRequestAccepted
                    );

                    // 🔥 Generate Agora Token if it's a call
                    string? agoraToken = null;
                    if (session.Mode == 1) // Call
                    {
                        // Use SessionId as channel name
                        agoraToken = _agoraTokenService.GenerateRtcToken(sessionId.ToString(), userParticipant.UserId.ToString());
                    }

                    // 🔥 BROADCAST session acceptance events to all participants
                    var consultantName = $"{consultant?.FirstName} {consultant?.LastName}".Trim();
                    
                    var sessionAcceptedPayload = new
                    {
                        SessionId = sessionId,
                        ConsultantId = consultantId,
                        ConsultantName = consultantName,
                        StartTime = now,
                        MaxAllowedEndTime = session.MaxAllowedEndTime,
                        State = 1,
                        Mode = session.Mode,
                        AgoraToken = agoraToken,
                        Message = "Session has been accepted and is now active"
                    };

                    // Send to session group (for participants already in the group)
                    await _hubContext.Clients.Group(sessionId.ToString())
                        .SendAsync("SessionAccepted", sessionAcceptedPayload);

                    // 🔥 Also send directly to the user's personal ChatHub group
                    // This is the reliable fallback — user-{userId} is auto-joined in OnConnectedAsync
                    await _hubContext.Clients.Group($"user-{userParticipant.UserId}")
                        .SendAsync("SessionAccepted", sessionAcceptedPayload);

                    result.Message = "Session request accepted. Session is now active.";
                }
                else
                {
                    // Update session for REJECT
                    session.State = SessionState.Rejected; // Rejected
                    session.StartTime = now;
                    session.EndTime = now; // EndTime same as StartTime for reject

                    // Audit Log
                    await _auditLogService.LogAsync(
                        "SESSION_REJECTED",
                        "ConsultationSessions",
                        sessionId.ToString(),
                        consultantId,
                        "State: 0",
                        "State: 3 (Rejected)"
                    );

                    // Notify User
                    await _notificationService.NotifyUserAsync(
                        userParticipant.UserId,
                        "Session Rejected",
                        $"Consultant {consultant?.FirstName} {consultant?.LastName} has rejected your session request.",
                        Enums.NotificationType.SessionRequestRejected
                    );

                    // 🔥 BROADCAST session rejection events to all participants
                    var consultantName = $"{consultant?.FirstName} {consultant?.LastName}".Trim();
                    await _hubContext.Clients.Group(sessionId.ToString())
                        .SendAsync("SessionRejected", new
                        {
                            SessionId = sessionId,
                            ConsultantId = consultantId,
                            ConsultantName = consultantName,
                            Accepted = false,
                            Message = "Session request has been rejected"
                        });

                    await _hubContext.Clients.Group(sessionId.ToString())
                        .SendAsync("SessionRequestAccepted", new
                        {
                            SessionId = sessionId,
                            ConsultantId = consultantId,
                            ConsultantName = consultantName,
                            Accepted = false
                        });

                    result.Message = "Session request rejected.";
                }

                await _dbContext.SaveChangesAsync();

                result.Success = true;
                result.StatusCode = 200;
                result.Data = true;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to handle session request: " + ex.Message;
                result.Data = false;
            }
            return result;
        }

        public async Task<ServiceResult<SessionResponseDto>> GetSessionByIdAsync(Guid sessionId, Guid? userId = null)
        {
            var result = new ServiceResult<SessionResponseDto>();
            try
            {
                var session = await _dbContext.ConsultationSessions
                    .Include(s => s.Participants)
                        .ThenInclude(p => p.User)
                            .ThenInclude(u => u.Roles)
                    .Include(s => s.Participants)
                        .ThenInclude(p => p.User)
                            .ThenInclude(u => u.ConsultantProfiles)
                    .FirstOrDefaultAsync(s => s.SessionId == sessionId);

                if (session == null)
                    return Fail<SessionResponseDto>(404, "Session not found");

                var dto = new SessionResponseDto
                {
                    SessionId = session.SessionId,
                    Mode = session.Mode,
                    State = session.State,
                    StartTime = session.StartTime,
                    EndTime = session.EndTime,
                    MaxAllowedEndTime = session.MaxAllowedEndTime,
                    TotalChargedAmount = session.TotalChargedAmount,
                    ConsultantEarnings = session.ConsultantEarnings,
                    CreatedAt = session.CreatedAt,
                    IsDisputed = session.IsDisputed,
                    AppliedRate = session.AppliedRate
                };

                // 🔥 Include Agora Token if session is active and mode is call
                if (session.State == SessionState.Active && session.Mode == 1 && userId.HasValue)
                {
                    dto.AgoraToken = _agoraTokenService.GenerateRtcToken(session.SessionId.ToString(), userId.Value.ToString());
                }

                foreach (var p in session.Participants)
                {
                    var user = p.User;
                    string fullName = $"{user?.FirstName} {user?.LastName}".Trim();
                    
                    dto.Participants.Add(new SessionParticipantDto
                    {
                        UserId = p.UserId,
                        FullName = fullName,
                        Role = user?.Roles?.RoleName,
                        ProfilePhotoUrl = user?.Roles?.RoleName == "Consultant" 
                            ? user?.ConsultantProfiles?.ProfilePhotoUrl 
                            : user?.ProfilePhotoUrl
                    });
                }

                result.Success = true;
                result.StatusCode = 200;
                result.Data = dto;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to fetch session: " + ex.Message;
                result.Data = null;
            }
            return result;
        }

    }
}
