using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TekConsult.Dto;
using TekConsult.ServiceResult;
using TekConsult.Services;
using TekConsult.Enums;

namespace TekConsult.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SessionController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        public SessionController(ISessionService sessionService)
        {
            _sessionService = sessionService;
        }

        [HttpPost("end-chat-session")]
        public async Task<IActionResult> End([FromBody] EndSessionDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.EndSessionAsync(dto.SessionId, userId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [HttpPost("end-call-session")]
        public async Task<IActionResult> EndCall([FromBody] EndSessionDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.EndSessionAsync(dto.SessionId, userId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [HttpPost("recalculate-time")]
        [Authorize(Roles = "User,Consultant,Admin")]
        public async Task<IActionResult> RecalculateTime([FromBody] RecalculateSessionTimeDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var result = await _sessionService.RecalculateSessionTimeAsync(dto.SessionId, userId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<DateTime>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = default
                });
            }
        }

        [HttpPost("submit-review")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.SubmitReviewAsync(userId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<ReviewResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [HttpGet("get-consultant-reviews/{consultantId}")]
        [Authorize(Roles = "Consultant,Admin,User")]
        public async Task<IActionResult> GetConsultantReviews(string consultantId, [FromQuery] int skip = 0, [FromQuery] int take = 5)
        {
            try
            {
                if (!Guid.TryParse(consultantId, out var parsedConsultantId))
                {
                    return BadRequest(new ServiceResult<ReviewListResponseDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Invalid consultant ID format",
                        Data = null
                    });
                }

                var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var currentUserRole = User.FindFirstValue(ClaimTypes.Role);

                // Consultants can only view their own reviews
                if (currentUserRole == "Consultant" && currentUserId != parsedConsultantId)
                {
                    return Forbid();
                }

                var result = await _sessionService.GetReviewsForConsultantAsync(parsedConsultantId, skip, take);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<ReviewListResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [HttpGet("get-user-reviews")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> GetUserReviews()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.GetReviewsForUserAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<ReviewListResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [HttpGet("get-all-reviews")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllReviews()
        {
            try
            {
                var result = await _sessionService.GetAllReviewsForAdminAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<ReviewListResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }


        [HttpGet("requests")]
        [Authorize(Roles = "Consultant")]
        public async Task<IActionResult> GetSessionRequests()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.GetSessionRequestsByConsultantIdAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<List<SessionRequestDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [HttpPost("handle-request")]
        [Authorize(Roles = "Consultant")]
        public async Task<IActionResult> HandleRequest([FromBody] AcceptRejectSessionDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.HandleSessionRequestAsync(dto.SessionId, userId, dto.Accept);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message,
                    Data = false
                });
            }
        }

        [HttpGet("get-session/{sessionId}")]
        [Authorize]
        public async Task<IActionResult> GetSession(Guid sessionId)
        {
            try
            {
                var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                Guid? userId = userIdValue != null ? Guid.Parse(userIdValue) : null;
                
                var result = await _sessionService.GetSessionByIdAsync(sessionId, userId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<SessionResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message,
                    Data = null
                });
            }
        }

        [HttpGet("history/{consultantId}")]
        [Authorize(Roles = "Admin,Consultant")]
        public async Task<IActionResult> GetSessionHistory(string consultantId, [FromQuery] int skip = 0, [FromQuery] int take = 10)
        {
            try
            {
                if (!Guid.TryParse(consultantId, out var parsedConsultantId))
                {
                    return BadRequest(new ServiceResult<PaginatedSessionHistoryDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Invalid consultant ID format",
                        Data = null
                    });
                }

                var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var currentUserRole = User.FindFirstValue(ClaimTypes.Role);

                // Consultants can only view their own history
                if (currentUserRole == "Consultant" && currentUserId != parsedConsultantId)
                {
                    return Forbid();
                }

                var result = await _sessionService.GetSessionHistoryByConsultantIdPaginatedAsync(parsedConsultantId, skip, take);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<PaginatedSessionHistoryDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [HttpGet("user-history")]
        [Authorize(Roles = "Admin,User,Consultant")]
        public async Task<IActionResult> GetUserSessionHistory([FromQuery] int skip = 0, [FromQuery] int take = 5, [FromQuery] SessionState? status = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.GetSessionHistoryByUserIdAsync(userId, skip, take, status, startDate, endDate);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<PaginatedSessionHistoryDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

    }
}
