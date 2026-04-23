using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.ServiceResult;
using TekConsult.Services;

namespace TekConsult.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DisputeController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly ISessionService _sessionService;
        public DisputeController(AppDbContext dbContext, ISessionService sessionService)
        {
            _dbContext = dbContext;
            _sessionService = sessionService;
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all-disputes")]
        public async Task<IActionResult> GetAllDisputes()
        {
            try
            {
                var result = await _sessionService.GetAllDisputesForAdminAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        [Authorize(Roles = "User,Consultant")]
        [HttpPost("raise-dispute")]
        public async Task<IActionResult> RaiseDispute([FromBody] RaiseDisputeDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.RaiseDisputeAsync(userId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = false
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("admin/resolve-dispute")]
        public async Task<IActionResult> ResolveDispute([FromBody] ResolveDisputeDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _sessionService.ResolveDisputeAsync(adminId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = false
                });
            }
        }

    }
}
