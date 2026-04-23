using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TekConsult.Dto;
using TekConsult.ServiceResult;
using TekConsult.Services;


namespace TekConsult.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ITwilioService _twilioService;
        private readonly IAuditLogService _auditLogService;
        private readonly IWebHostEnvironment _environment;

        public AccountController(IAuthService authService, ITwilioService twilioService, IAuditLogService auditLogService, IWebHostEnvironment environment)
        {
            _authService = authService;
            _twilioService = twilioService;
            _auditLogService = auditLogService;
            _environment = environment;
        }

        // =========================
        // OTP
        // =========================

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] LoginDto dto)
    {
        try
        {
            var result = await _authService.VerifyOtpOnlyAsync(dto.CountryCode, dto.PhoneNumber, dto.Otp);
            return StatusCode(result.StatusCode, result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResult<bool>
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error: {ex.Message}",
                Data = false
            });
        }
    }

    [HttpGet("generate-otp")]
    public async Task<IActionResult> GenerateOtp([FromQuery] string countryCode, [FromQuery] string phoneNumber)
    {
        try
        {
            var result = await _authService.GenerateOtpAsync(countryCode, phoneNumber);
            return StatusCode(result.StatusCode, result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GenerateOtp Error: {ex.GetType().Name} - {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");

            return StatusCode(500, new ServiceResult<string>
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error: {ex.GetType().Name} - {ex.Message}",
                Data = ex.StackTrace!
            });
        }

    }

    [HttpGet("generate-email-otp")]
    public async Task<IActionResult> GenerateEmailOtp([FromQuery] string email)
    {
        try
        {
            var result = await _authService.GenerateEmailOtpAsync(email);
            return StatusCode(result.StatusCode, result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResult<string>
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("verify-email-otp")]
    public async Task<IActionResult> VerifyEmailOtp([FromBody] EmailOtpVerifyDto dto)
    {
        try
        {
            var result = await _authService.VerifyEmailOtpOnlyAsync(dto.Email, dto.Otp);
            return StatusCode(result.StatusCode, result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ServiceResult<bool>
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error: {ex.Message}",
                Data = false
            });
        }
    }

        // =========================
        // SIGNUP / LOGIN
        // =========================

        [HttpPost("signup-with-phone")]
        public async Task<IActionResult> SignupWithPhone([FromBody] PhoneNumberOtpDto dto)
        {
            try
            {
                var result = await _authService.SignupWithPhoneAsync(dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<AuthResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        [HttpPost("signup-with-email")]
        public async Task<IActionResult> SignupWithEmail([FromBody] EmailSignupDto dto)
        {
            try
            {
                var result = await _authService.SignupWithEmailAsync(dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<AuthResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        [HttpPost("login-with-phone")]
        public async Task<IActionResult> LoginWithPhone([FromBody] LoginDto dto)
        {
            try
            {
                var result = await _authService.LoginWithPhoneAsync(dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<AuthResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        [HttpPost("login-with-email")]
        public async Task<IActionResult> LoginWithEmail([FromBody] EmailLoginDto dto)
        {
            try
            {
                var result = await _authService.LoginWithEmailAsync(dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<AuthResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        // Development helper endpoint to generate BCrypt hash (remove in production)
        [HttpGet("dev/generate-hash")]
        public IActionResult GeneratePasswordHash([FromQuery] string password)
        {
            try
            {
                var hash = BCrypt.Net.BCrypt.HashPassword(password);
                return Ok(new { password, hash });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("admin-login-with-password")]
        public async Task<IActionResult> AdminLoginWithPassword([FromBody] AdminLoginDto dto)
        {
            try
            {
                var result = await _authService.AdminLoginWithPasswordAsync(dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<AuthResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        // =========================
        // UPDATE PROFILE (User + Consultant)
        // =========================

        [Authorize]
        [HttpGet("recent-activities")]
        public async Task<IActionResult> GetRecentActivities()
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr))
                {
                    return Unauthorized(new ServiceResult<List<UserActivityDto>>
                    {
                        Success = false,
                        StatusCode = 401,
                        Message = "Unauthorized"
                    });
                }

                var userId = Guid.Parse(userIdStr);
                var result = await _auditLogService.GetRecentActivitiesAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<List<UserActivityDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [Authorize(Roles = "Consultant")]
        [HttpPost("update-rates")]
        public async Task<IActionResult> UpdateRates([FromBody] UpdateConsultantRatesDto dto)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr))
                {
                    return Unauthorized(new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 401,
                        Message = "Unauthorized"
                    });
                }

                var userId = Guid.Parse(userIdStr);
                var result = await _authService.UpdateConsultantRatesAsync(userId, dto);
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

        [Authorize(Roles = "User,Consultant,Admin,admin")]
        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto dto)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr))
                {
                    return Unauthorized(new ServiceResult<string>
                    {
                        Success = false,
                        StatusCode = 401,
                        Message = "Unauthorized"
                    });
                }

                var userId = Guid.Parse(userIdStr);

                // If the requester is an Admin and dto.UserId is provided, use it
                if ((User.IsInRole("Admin") || User.IsInRole("admin")) && dto.UserId.HasValue)
                {
                    userId = dto.UserId.Value;
                }

                var result = await _authService.UpdateProfileAsync(userId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<UserFullProfileResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }
 
        [Authorize]
        [HttpPost("upload-profile-photo")]
        public async Task<IActionResult> UploadProfilePhoto([FromForm] UploadProfilePhotoDto dto)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
 
                if (dto.File == null || dto.File.Length == 0)
                {
                    return BadRequest(new ServiceResult<string>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "No file uploaded."
                    });
                }
 
                var rootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
                var uploadsFolder = Path.Combine(rootPath, "uploads", "profiles");
                
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }
 
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.File.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);
 
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }
 
                var photoUrl = "/uploads/profiles/" + fileName;
 
                return Ok(new ServiceResult<string>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Photo uploaded successfully.",
                    Data = photoUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Error uploading photo: " + ex.Message
                });
            }
        }

        // =========================
        // ADMIN - VERIFY CONSULTANT
        // =========================

        [Authorize(Roles = "Admin,admin")]
        [HttpPost("admin/update-consultant-verification")]
        public async Task<IActionResult> UpdateConsultantVerification([FromBody] UpdateConsultantVerificationStatusDto dto)
        {
            try
            {
                var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(adminIdStr))
                {
                    return Unauthorized(new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 401,
                        Message = "Unauthorized",
                        Data = false
                    });
                }

                var adminId = Guid.Parse(adminIdStr);

                var result = await _authService.UpdateConsultantVerificationStatusAsync(adminId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error.",
                    Data = false
                });
            }
        }

        // =========================
        // ADMIN - GET ALL USERS / CONSULTANTS
        // =========================

        
        [Authorize(Roles = "Admin,admin")]
        [HttpGet("admin/get-all-users")]
        public async Task<IActionResult> GetAllUsersForAdmin([FromQuery] int skip, [FromQuery] int take, [FromQuery] bool isConsultant)
        {
            try
            {
                var result = await _authService.GetAllUsersAsync(skip, take, isConsultant);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<List<UserFullProfileResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        // =========================
        // GET CONSULTANTS BY CATEGORY
        // =========================

        [Authorize(Roles = "Admin,User,Consultant,admin")]
        [HttpGet("consultants-by-category")]
        public async Task<IActionResult> GetConsultantsByCategory([FromQuery] string category, [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var result = await _authService.GetConsultantsByCategoryAsync(category, skip, take);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<List<UserFullProfileResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Internal server error: {ex.Message}"
                });
            }
        }

        // =========================
        // PAYMENT METHODS
        // =========================

        [Authorize(Roles = "User,Consultant")]
        [HttpPost("payment/add")]
        public async Task<IActionResult> AddPaymentMethod([FromBody] AddPaymentMethodDto dto)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var userId = Guid.Parse(userIdStr!);

                var result = await _authService.AddPaymentMethodAsync(userId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error.",
                    Data = false
                });
            }
        }

        [Authorize(Roles = "User,Consultant")]
        [HttpPost("payment/update")]
        public async Task<IActionResult> UpdatePaymentMethod([FromBody] UpdatePaymentMethodDto dto)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var userId = Guid.Parse(userIdStr!);

                var result = await _authService.UpdatePaymentMethodAsync(userId, dto);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error.",
                    Data = false
                });
            }
        }

        [Authorize(Roles = "User,Consultant")]
        [HttpGet("payment/{paymentMethodId}")]
        public async Task<IActionResult> GetPaymentMethodById(Guid paymentMethodId)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var userId = Guid.Parse(userIdStr!);

                var result = await _authService.GetPaymentMethodByIdAsync(userId, paymentMethodId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<PaymentMethodResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        [AllowAnonymous] // or [Authorize] if you want only logged-in users
        [HttpGet("get-user/consultant-byid")]
        public async Task<IActionResult> GetUserProfileById(Guid userId)
        {
            try
            {
                var result = await _authService.GetUserProfileByIdAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<UserFullProfileResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

    }
}
