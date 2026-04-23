using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TekConsult.Data;
using TekConsult.ServiceResult;

namespace TekConsult.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly Services.IChatService _chatService;

        public ChatController(Services.IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("messages/{sessionId}")]
        [Authorize]
        public async Task<IActionResult> GetChatHistory(Guid sessionId)
        {
            try
            {
                var result = await _chatService.GetChatHistoryAsync(sessionId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<List<Dto.ChatMessageDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message,
                    Data = null
                });
            }
        }

        [HttpPost("conversation")]
        [Authorize]
        public async Task<IActionResult> GetOrCreateConversation([FromBody] Dto.GetOrCreateConversationDto dto)
        {
            try
            {
                var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdValue))
                {
                    return Unauthorized("User ID claim not found in token");
                }

                var userId = Guid.Parse(userIdValue);
                
                if (dto == null)
                {
                    return BadRequest("Request body is empty");
                }

                if (dto.UserId == Guid.Empty || dto.ConsultantId == Guid.Empty)
                {
                    return BadRequest($"Invalid IDs: UserId={dto.UserId}, ConsultantId={dto.ConsultantId}");
                }

                // Ensure the user is actually one of the participants
                if (userId != dto.UserId && userId != dto.ConsultantId)
                {
                    return BadRequest($"User {userId} is not part of the requested conversation between {dto.UserId} and {dto.ConsultantId}");
                }

                var result = await _chatService.GetOrCreateConversationAsync(dto.UserId, dto.ConsultantId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatController] Error in GetOrCreateConversation: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new ServiceResult<Dto.ConversationDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message,
                    Data = null
                });
            }
        }

        [HttpGet("conversation/{conversationId}/messages")]
        [Authorize]
        public async Task<IActionResult> GetConversationHistory(Guid conversationId)
        {
            try
            {
                var result = await _chatService.GetConversationHistoryAsync(conversationId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<List<Dto.ChatMessageDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message,
                    Data = null
                });
            }
        }
    }
}

