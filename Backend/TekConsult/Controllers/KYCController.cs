using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TekConsult.Dto;
using TekConsult.ServiceResult;
using TekConsult.Services;

namespace TekConsult.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KYCController : ControllerBase
    {
        private readonly IKYCService _kycService;

        public KYCController(IKYCService kycService)
        {
            _kycService = kycService;
        }

        [Authorize(Roles = "Consultant")]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] UploadKYCDocumentDto dto)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr))
                {
                    return Unauthorized();
                }

                var userId = Guid.Parse(userIdStr);
                var result = await _kycService.UploadDocumentAsync(userId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<KYCDocumentResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [Authorize(Roles = "Consultant")]
        [HttpGet("my-documents")]
        public async Task<IActionResult> GetMyDocuments()
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr))
                {
                    return Unauthorized();
                }

                var userId = Guid.Parse(userIdStr);
                var result = await _kycService.GetMyDocumentsAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<List<KYCDocumentResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("consultant/{consultantProfileId}")]
        public async Task<IActionResult> GetConsultantDocuments(Guid consultantProfileId)
        {
            try
            {
                var result = await _kycService.GetConsultantDocumentsAsync(consultantProfileId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<List<KYCDocumentResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("update-status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateKYCStatusDto dto)
        {
            try
            {
                var result = await _kycService.UpdateDocumentStatusAsync(dto);
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
    }
}
