using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.Hubs;
using TekConsult.ServiceResult;
using TekConsult.Enums;
namespace TekConsult.Services
{
    public interface IChatService
    {
        Task<ChatMessages> SaveMessageAsync(Guid? conversationId, Guid senderId, string content, Guid? sessionId = null);
        Task BroadcastMessageAsync(ChatMessages chat);
        Task<ChatMessages> SaveAndBroadcastAsync(Guid? conversationId, Guid senderId, string content, Guid? sessionId = null);
        Task MarkSessionLiveIfNeeded(Guid sessionId);
        Task<ServiceResult<List<ActiveSessionRowDto>>> GetActiveSessionsForAdminAsync();
        Task<ServiceResult<List<ChatMessageDto>>> GetChatHistoryAsync(Guid sessionId);
        Task<ServiceResult<ConversationDto>> GetOrCreateConversationAsync(Guid userId, Guid consultantId);
        Task<ServiceResult<List<ChatMessageDto>>> GetConversationHistoryAsync(Guid conversationId);
    }
    public class ChatService : IChatService
    {
        private readonly AppDbContext _dbContext;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IAuditLogService _auditLogService;
        private readonly INotificationService _notificationService;

        public ChatService(AppDbContext dbContext, IHubContext<ChatHub> hubContext, IAuditLogService auditLogService, INotificationService notificationService)
        {
            _dbContext = dbContext;
            _hubContext = hubContext;
            _auditLogService = auditLogService;
            _notificationService = notificationService;
        }

        public async Task<ChatMessages> SaveMessageAsync(Guid? conversationId, Guid senderId, string content, Guid? sessionId = null)
        {
            var chat = new ChatMessages
            {
                MessageId = Guid.NewGuid(),
                ConversationId = conversationId,
                SessionId = sessionId,
                SenderId = senderId,
                Content = content,
                MessageType = 0,
                IsRead = false,
                Timestamp = DateTime.UtcNow
            };

            _dbContext.ChatMessages.Add(chat);
            await _dbContext.SaveChangesAsync();

            return chat;
        }

        public async Task BroadcastMessageAsync(ChatMessages chat)
        {
            // Load sender info for better frontend display
            var sender = await _dbContext.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.UserId == chat.SenderId);

            var senderName = sender != null 
                ? $"{sender.FirstName} {sender.LastName}".Trim()
                : "Unknown";

            var senderRole = sender?.Roles?.RoleName ?? "Unknown";

            var senderProfilePhotoUrl = sender?.Roles?.RoleName == "Consultant" 
                ? (await _dbContext.ConsultantProfiles.FirstOrDefaultAsync(cp => cp.UserId == chat.SenderId))?.ProfilePhotoUrl
                : sender?.ProfilePhotoUrl;

            var messagePayload = new
            {
                chat.MessageId,
                chat.ConversationId,
                chat.SessionId,
                chat.SenderId,
                SenderName = senderName,
                SenderRole = senderRole,
                SenderProfilePhotoUrl = senderProfilePhotoUrl,
                chat.Content,
                chat.Timestamp
            };

            // Send to conversation group
            await _hubContext.Clients.Group(chat.ConversationId.ToString())
                .SendAsync("ReceiveMessage", messagePayload);

            // 🔥 Get participants from conversation
            var conversation = await _dbContext.Conversations
                .FirstOrDefaultAsync(c => c.Id == chat.ConversationId);
            
            if (conversation != null)
            {
                await _hubContext.Clients.Group($"user-{conversation.UserId}")
                    .SendAsync("ReceiveMessage", messagePayload);
                await _hubContext.Clients.Group($"user-{conversation.ConsultantId}")
                    .SendAsync("ReceiveMessage", messagePayload);
            }
        }

        public async Task<ChatMessages> SaveAndBroadcastAsync(Guid? conversationId, Guid senderId, string content, Guid? sessionId = null)
        {
            var chat = await SaveMessageAsync(conversationId, senderId, content, sessionId);
            
            // Audit log for chat message
            await _auditLogService.LogAsync(
                "CHAT_MESSAGE_SENT",
                "ChatMessages",
                chat.MessageId.ToString(),
                senderId,
                null,
                $"ConversationId: {conversationId}, SessionId: {sessionId}, ContentLength: {content?.Length ?? 0}"
            );
            
            await BroadcastMessageAsync(chat);

            // Find recipient
            var conversation = await _dbContext.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId);
            if (conversation != null)
            {
                var recipientId = (conversation.UserId == senderId) ? conversation.ConsultantId : conversation.UserId;
                var snippet = string.IsNullOrEmpty(content) ? "" : (content.Length > 50 ? content.Substring(0, 47) + "..." : content);
                await _notificationService.NotifyUserAsync(
                    recipientId,
                    "New Message",
                    $"You have a new message: {snippet}",
                    TekConsult.Enums.NotificationType.NewChatMessage
                );
            }

            return chat;
        }

        public async Task MarkSessionLiveIfNeeded(Guid sessionId)
        {
            // Sessions should ONLY be marked live through HandleSessionRequestAsync (Consultant Acceptance)
            // Auto-activation here was causing sessions to start without consultant approval.
            return;
        }

        public async Task<ServiceResult<List<ActiveSessionRowDto>>> GetActiveSessionsForAdminAsync()
        {
            var result = new ServiceResult<List<ActiveSessionRowDto>>();

            try
            {
                var now = DateTime.UtcNow;

                var sessions = await _dbContext.ConsultationSessions
                    .Where(s => s.State == SessionState.Active) // Active
                    .ToListAsync();

                var list = new List<ActiveSessionRowDto>();

                foreach (var session in sessions)
                {
                    // Load participants with roles
                    var participants = await _dbContext.SessionParticipants
                        .Where(p => p.SessionId == session.SessionId)
                        .Include(p => p.User)
                            .ThenInclude(u => u.Roles)
                        .Select(p => p.User)
                        .ToListAsync();

                    var user = participants.FirstOrDefault(u => u.Roles.RoleName == "User");
                    var consultant = participants.FirstOrDefault(u => u.Roles.RoleName == "Consultant");

                    if (user == null || consultant == null)
                        continue;

                    // Wallet
                    var wallet = await _dbContext.Wallets
                        .FirstOrDefaultAsync(w => w.UserId == user.UserId);

                    // Consultant profile
                    var consultantProfile = await _dbContext.ConsultantProfiles
                        .FirstOrDefaultAsync(c => c.UserId == consultant.UserId);

                    // Billing
                    var totalBilled = await _dbContext.SessionBillingTicks
                        .Where(x => x.SessionId == session.SessionId)
                        .SumAsync(x => (decimal?)x.AmountDeducted) ?? 0;

                    // Duration
                    var durationSeconds = 0;
                    if (session.StartTime.HasValue)
                    {
                        durationSeconds = (int)(now - session.StartTime.Value).TotalSeconds;
                    }

                    // Build names
                    string userName = string.Join(" ",
                        new[] { user.FirstName, user.MiddleName, user.LastName }
                        .Where(x => !string.IsNullOrWhiteSpace(x)));

                    string consultantName = string.Join(" ",
                        new[] { consultant.FirstName, consultant.MiddleName, consultant.LastName }
                        .Where(x => !string.IsNullOrWhiteSpace(x)));

                    list.Add(new ActiveSessionRowDto
                    {
                        SessionId = session.SessionId,

                        UserName = userName,
                        UserPhone = $"{user.CountryCode}{user.PhoneNumber}",

                        ConsultantName = consultantName,
                        ConsultantCategory = consultantProfile?.ConsultantCategory ?? "",

                        Mode = session.Mode,
                        DurationSeconds = durationSeconds,
                        StartTime = session.StartTime,

                        RatePerMinute = consultantProfile?.ChatRatePerMinute ?? 0,
                        TotalBilled = totalBilled,
                        UserBalance = wallet?.Balance ?? 0,

                        State = session.State
                    });
                }

                result.Success = true;
                result.StatusCode = 200;
                result.Message = "Active sessions loaded";
                result.Data = list;
            }
            catch (Exception ex)
            {

                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load active sessions";
                result.Data = null;
            }

            return result;
        }

        public async Task<ServiceResult<List<ChatMessageDto>>> GetChatHistoryAsync(Guid sessionId)
        {
            var result = new ServiceResult<List<ChatMessageDto>>();
            try
            {
                var messages = await _dbContext.ChatMessages
                    .Where(m => m.SessionId == sessionId)
                    .Include(m => m.Sender)
                        .ThenInclude(u => u.Roles)
                    .Include(m => m.Sender)
                        .ThenInclude(u => u.ConsultantProfiles)
                    .OrderBy(m => m.Timestamp)
                    .Select(m => new ChatMessageDto
                    {
                        MessageId = m.MessageId,
                        ConversationId = m.ConversationId ?? Guid.Empty,
                        SessionId = m.SessionId,
                        SenderId = m.SenderId,
                        Content = m.Content,
                        SenderName = m.Sender != null ? (m.Sender.FirstName + " " + m.Sender.LastName).Trim() : "Unknown",
                        SenderRole = m.Sender != null && m.Sender.Roles != null ? m.Sender.Roles.RoleName : "Unknown",
                        MessageType = m.MessageType,
                        IsRead = m.IsRead,
                        Timestamp = m.Timestamp,
                        ProfilePhotoUrl = m.Sender != null ? m.Sender.ProfilePhotoUrl : null
                    })
                    .ToListAsync();

                result.Success = true;
                result.StatusCode = 200;
                result.Data = messages;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load chat history: " + ex.Message;
                result.Data = null;
            }
            return result;
        }

        public async Task<ServiceResult<ConversationDto>> GetOrCreateConversationAsync(Guid userId, Guid consultantId)
        {
            var result = new ServiceResult<ConversationDto>();
            try
            {
                var conversation = await _dbContext.Conversations
                    .Include(c => c.User)
                    .Include(c => c.Consultant)
                        .ThenInclude(u => u.ConsultantProfiles)
                    .FirstOrDefaultAsync(c => 
                        (c.UserId == userId && c.ConsultantId == consultantId) || 
                        (c.UserId == consultantId && c.ConsultantId == userId));

                if (conversation == null)
                {
                    conversation = new Conversations
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        ConsultantId = consultantId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.Conversations.Add(conversation);
                    await _dbContext.SaveChangesAsync();

                    // Reload to get navigation properties
                    conversation = await _dbContext.Conversations
                        .Include(c => c.User)
                        .Include(c => c.Consultant)
                            .ThenInclude(u => u.ConsultantProfiles)
                        .FirstOrDefaultAsync(c => c.Id == conversation.Id);
                }

                result.Data = new ConversationDto
                {
                    Id = conversation.Id,
                    UserId = conversation.UserId,
                    ConsultantId = conversation.ConsultantId,
                    CreatedAt = conversation.CreatedAt,
                    UserName = $"{conversation.User?.FirstName} {conversation.User?.LastName}".Trim(),
                    ConsultantName = $"{conversation.Consultant?.FirstName} {conversation.Consultant?.LastName}".Trim(),
                    ConsultantPhotoUrl = conversation.Consultant?.ConsultantProfiles?.ProfilePhotoUrl,
                    UserPhotoUrl = conversation.User?.ProfilePhotoUrl
                };
                result.Success = true;
                result.StatusCode = 200;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to get/create conversation: " + ex.Message;
            }
            return result;
        }

        public async Task<ServiceResult<List<ChatMessageDto>>> GetConversationHistoryAsync(Guid conversationId)
        {
            var result = new ServiceResult<List<ChatMessageDto>>();
            try
            {
                // Verify conversation exists first
                var conversationExists = await _dbContext.Conversations
                    .AnyAsync(c => c.Id == conversationId);

                if (!conversationExists)
                {
                    result.Success = false;
                    result.StatusCode = 404;
                    result.Message = "Conversation not found";
                    result.Data = null;
                    return result;
                }

                // Query messages directly - returns empty list if none exist (not an error)
                var messages = await _dbContext.ChatMessages
                    .Where(m => m.ConversationId == conversationId)
                    .Include(m => m.Sender)
                        .ThenInclude(u => u.Roles)
                    .OrderBy(m => m.Timestamp)
                    .Select(m => new ChatMessageDto
                    {
                        MessageId = m.MessageId,
                        ConversationId = m.ConversationId ?? Guid.Empty,
                        SessionId = m.SessionId,
                        SenderId = m.SenderId,
                        Content = m.Content,
                        SenderName = m.Sender != null ? (m.Sender.FirstName + " " + m.Sender.LastName).Trim() : "Unknown",
                        SenderRole = m.Sender != null && m.Sender.Roles != null ? m.Sender.Roles.RoleName : "Unknown",
                        MessageType = m.MessageType,
                        IsRead = m.IsRead,
                        Timestamp = m.Timestamp,
                        ProfilePhotoUrl = m.Sender != null ? m.Sender.ProfilePhotoUrl : null
                    })
                    .ToListAsync();

                result.Success = true;
                result.StatusCode = 200;
                result.Data = messages; // Empty list is valid - means no messages yet
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.StatusCode = 500;
                result.Message = "Failed to load conversation history: " + ex.Message;
            }
            return result;
        }
    }
}
