using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.ServiceResult;
using TekConsult.Services;
using TekConsult.Enums;
using Microsoft.AspNetCore.SignalR;
using TekConsult.Hubs;


namespace TekConsult.Controllers
{
    [ApiController]
    [Route("api/chat/test")]
    public class ChatTestController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly AppDbContext _dbContext;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<ChatHub> _hubContext;
        
        public ChatTestController(IChatService chatService, AppDbContext dbContext, INotificationService notificationService, IHubContext<ChatHub> hubContext)
        {
            _chatService = chatService;
            _dbContext = dbContext;
            _notificationService = notificationService;
            _hubContext = hubContext;
        }

        [HttpPost("create-session")]
        [Authorize(Roles = "User,Consultant,Admin")]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionDto dto)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr))
                    return Unauthorized(new ServiceResult<string> { Success = false, StatusCode = 401, Message = "Unauthorized" });

                var creatorId = Guid.Parse(userIdStr);

                if (dto.UserIds == null)
                    dto.UserIds = new List<Guid>();

                if (!dto.UserIds.Contains(creatorId))
                    dto.UserIds.Add(creatorId);

                if (dto.UserIds.Count < 2)
                {
                    return BadRequest(new ServiceResult<string>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "At least 2 participants are required"
                    });
                }

                // Create session
                var session = new ConsultationSessions
                {
                    SessionId = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    State = SessionState.Pending, // Created
                    Mode = dto.Mode
                };

                _dbContext.ConsultationSessions.Add(session);

                // Add participants
                foreach (var uid in dto.UserIds.Distinct())
                {
                    var exists = await _dbContext.Users.AnyAsync(x => x.UserId == uid);
                    if (!exists)
                    {
                        return BadRequest(new ServiceResult<string>
                        {
                            Success = false,
                            StatusCode = 400,
                            Message = $"User not found: {uid}"
                        });
                    }

                    _dbContext.SessionParticipants.Add(new SessionParticipants
                    {
                        Id = Guid.NewGuid(),
                        SessionId = session.SessionId,
                        UserId = uid,
                        JoinedAt = DateTime.UtcNow
                    });
                }

                await _dbContext.SaveChangesAsync();

                // Notification to Consultant(s)
                foreach(var uid in dto.UserIds.Distinct().Where(x => x!= creatorId))
                {
                    var user = await _dbContext.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.UserId == uid);
                    if(user != null && user.Roles.RoleName == "Consultant")
                    {
                        await _notificationService.NotifyUserAsync(
                            uid,
                            "New Session Request",
                            $"A user has requested a {dto.Mode} session with you.",
                            Enums.NotificationType.SessionRequest
                        );

                        // Real-time broadcast for Consultant Dashboard
                        var creator = await _dbContext.Users.FindAsync(creatorId);
                        var creatorName = creator != null ? $"{creator.FirstName} {creator.LastName}".Trim() : "Client";
                        
                        await _hubContext.Clients.Group($"user-{uid}").SendAsync("NewSessionRequest", new {
                            SessionId = session.SessionId,
                            UserId = creatorId,
                            UserName = creatorName,
                            Mode = dto.Mode,
                            StartTime = session.CreatedAt
                        });
                    }
                }

                return Ok(new ServiceResult<Guid>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Session created",
                    Data = session.SessionId
                });
            }
            catch (Exception ex)
            {

                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to create session"
                });
            }
        }


        // ==========================================
        // SEND MESSAGE (REST fallback)
        // ==========================================
        [HttpPost("send")]
        [Authorize(Roles = "User,Consultant,Admin")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var role = User.FindFirstValue(ClaimTypes.Role);

                if (role != "Admin")
                {
                    var isMember = await _dbContext.SessionParticipants
                        .AnyAsync(x => x.SessionId == dto.SessionId && x.UserId == userId);

                    if (!isMember)
                        return Unauthorized(new ServiceResult<string> { Success = false, StatusCode = 401, Message = "Not part of this session" });
                }

                var chat = await _chatService.SaveAndBroadcastAsync(dto.SessionId, userId, dto.Message);

                return Ok(new ServiceResult<Guid>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Message sent",
                    Data = chat.MessageId
                });
            }
            catch (Exception ex)
            {
  
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to send message"
                });
            }
        }


        // ==========================================
        // GET CHAT HISTORY
        // ==========================================
        [HttpGet("history")]
        [Authorize(Roles = "User,Consultant,Admin")]
        public async Task<IActionResult> GetHistory(Guid sessionId, int skip = 0, int take = 50)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var role = User.FindFirstValue(ClaimTypes.Role);

                if (role != "Admin")
                {
                    var isMember = await _dbContext.SessionParticipants
                        .AnyAsync(x => x.SessionId == sessionId && x.UserId == userId);

                    if (!isMember)
                        return Unauthorized(new ServiceResult<string> { Success = false, StatusCode = 401, Message = "Not allowed" });
                }

                var result = await _chatService.GetChatHistoryAsync(sessionId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to load chat: " + ex.Message
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/active-sessions")]
        public async Task<IActionResult> GetActiveSessionsForAdmin()
        {
            try
            {
                var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(adminIdStr))
                {
                    return Unauthorized(new ServiceResult<string>
                    {
                        Success = false,
                        StatusCode = 401,
                        Message = "Unauthorized",
                        Data = null
                    });
                }

                var result = await _chatService.GetActiveSessionsForAdminAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error.",
                    Data = null
                });
            }
        }

    }
}
