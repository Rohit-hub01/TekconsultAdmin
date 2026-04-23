using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;
using TekConsult.Data;
using TekConsult.Entities;
using TekConsult.Services;
using TekConsult.Enums;


namespace TekConsult.Hubs
{
    [Authorize] // Only logged-in users
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly AppDbContext _dbContext;

        public ChatHub(IChatService chatService, AppDbContext dbContext)
        {
            _chatService = chatService;
            _dbContext = dbContext;
        }


        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!string.IsNullOrEmpty(userId))
            {
                // each user has their own private group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            }

            await base.OnConnectedAsync();
        }

        // ================================
        // Join consultation session room
        // ================================
        public async Task JoinSession(Guid sessionId)
        {
            var userIdStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var role = Context.User?.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userIdStr))
                throw new HubException("Unauthorized");

            var userId = Guid.Parse(userIdStr);

            // Check session exists
            var sessionExists = await _dbContext.ConsultationSessions
                .AnyAsync(x => x.SessionId == sessionId);

            if (!sessionExists)
                throw new HubException("Session not found");

            // If not admin, must be participant
            if (role != "Admin")
            {
                var isMember = await _dbContext.SessionParticipants
                    .AnyAsync(x => x.SessionId == sessionId && x.UserId == userId);

                if (!isMember)
                    throw new HubException("You are not part of this session");
            }

            // Join SignalR group
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId.ToString());

            // Mark session live if needed
            await _chatService.MarkSessionLiveIfNeeded(sessionId);
        }

        public async Task JoinConversation(Guid conversationId)
        {
            var userIdStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
                throw new HubException("Unauthorized");

            var userId = Guid.Parse(userIdStr);

            var conversation = await _dbContext.Conversations.FirstOrDefaultAsync(x => x.Id == conversationId);
            if (conversation == null)
                throw new HubException("Conversation not found");

            // Check if user is participant
            if (conversation.UserId != userId && conversation.ConsultantId != userId)
                throw new HubException("You are not part of this conversation");

            // Join SignalR group
            await Groups.AddToGroupAsync(Context.ConnectionId, conversationId.ToString());
        }

      
        // ================================
        // Send message
        // ================================
        public async Task SendMessage(Guid sessionId, string message)
        {
            var userIdStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
                throw new HubException("Unauthorized");

            var senderId = Guid.Parse(userIdStr);

            // Find conversation for this session
            var participants = await _dbContext.SessionParticipants
                .Where(p => p.SessionId == sessionId)
                .Select(p => p.UserId)
                .ToListAsync();

            if (participants.Count < 2)
                 throw new HubException("Session has no participants");

            var user1 = participants[0];
            var user2 = participants[1];

            var conversation = await _dbContext.Conversations
                .FirstOrDefaultAsync(c => 
                    (c.UserId == user1 && c.ConsultantId == user2) || 
                    (c.UserId == user2 && c.ConsultantId == user1));

            if (conversation == null)
            {
                // Create if not exists (though usually it should exist by the time a session is created)
                conversation = new Conversations
                {
                    Id = Guid.NewGuid(),
                    UserId = user1,
                    ConsultantId = user2,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Conversations.Add(conversation);
                await _dbContext.SaveChangesAsync();
            }

            await _chatService.SaveAndBroadcastAsync(conversation.Id, senderId, message, sessionId);
        }

        public async Task SendMessageToConversation(Guid conversationId, string message, Guid? sessionId = null)
        {
            var userIdStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
                throw new HubException("Unauthorized");

            var senderId = Guid.Parse(userIdStr);
            Console.WriteLine($"[ChatHub] SendMessageToConversation from: {senderId}, conversation: {conversationId}, sessionId: {sessionId}");

            try
            {
                // Check if user is part of conversation
                var isMember = await _dbContext.Conversations
                    .AnyAsync(x => x.Id == conversationId && (x.UserId == senderId || x.ConsultantId == senderId));

                if (!isMember)
                {
                    Console.WriteLine($"[ChatHub] Security check failed: {senderId} not in {conversationId}");
                    throw new HubException("You are not part of this conversation");
                }

                await _chatService.SaveAndBroadcastAsync((Guid?)conversationId, senderId, message, sessionId);
                Console.WriteLine($"[ChatHub] Message sent successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatHub] CRITICAL ERROR: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw new HubException($"Server error: {ex.Message}");
            }
        }

    }
}

