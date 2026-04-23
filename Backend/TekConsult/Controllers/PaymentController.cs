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
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }
        

        [HttpPost("wallet/add-money")]
        [Authorize(Roles = "User,Consultant")]
        public async Task<IActionResult> CreateAddMoney([FromBody] CreateAddMoneyDto dto)
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
                        Message = "Unauthorized",
                        Data = null
                    });
                }

                var userId = Guid.Parse(userIdStr);

                var result = await _paymentService.CreateAddMoneySessionAsync(userId, dto.Amount);
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

        // ===============================
        // STRIPE WEBHOOK
        // ===============================
        [HttpPost("stripe/webhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();

            try
            {
                var signature = Request.Headers["Stripe-Signature"];

                await _paymentService.HandleStripeWebhookAsync(json, signature);

                // ⚠️ VERY IMPORTANT: Always return 200 OK to Stripe
                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Stripe Webhook ERROR: " + ex.Message);
                return BadRequest();
            }
        }

        

        // ===============================
        // GET WALLET BALANCE
        // ===============================
        [HttpGet("wallet/balance")]
        public async Task<IActionResult> GetWalletBalance()
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr))
                {
                    return Unauthorized(new ServiceResult<decimal>
                    {
                        Success = false,
                        StatusCode = 401,
                        Message = "Unauthorized",
                        Data = 0
                    });
                }

                var userId = Guid.Parse(userIdStr);

                var result = await _paymentService.GetWalletBalanceAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<decimal>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = 0
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/wallet/balance/{userId}")]
        public async Task<IActionResult> GetUserWalletBalance(Guid userId)
        {
            try
            {
                var result = await _paymentService.GetWalletBalanceAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<decimal>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error",
                    Data = 0
                });
            }
        }

        [Authorize(Roles = "User,Consultant")]
        [HttpGet("wallet/my-transactions")]
        public async Task<IActionResult> GetMyTransactions([FromQuery] int skip = 0, [FromQuery] int take = 50, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
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
                        Message = "Unauthorized",
                        Data = null
                    });
                }
 
                var userId = Guid.Parse(userIdStr);
 
                var result = await _paymentService.GetMyTransactionsAsync(userId, skip, take, startDate, endDate);
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

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all-transactions")]
        public async Task<IActionResult> GetAllTransactions(int skip = 0, int take = 100, Guid? userId = null)
        {
            try
            {
                var result = await _paymentService.GetAllTransactionsForAdminAsync(skip, take, userId);
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

        [Authorize(Roles = "Consultant")]
        [HttpPost("wallet/request-withdrawal")]
        public async Task<IActionResult> RequestWithdrawal([FromBody] RequestWithdrawalDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _paymentService.RequestWithdrawalAsync(userId, dto.Amount);
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
        [HttpPost("admin/process-withdrawal")]
        public async Task<IActionResult> ProcessWithdrawal([FromBody] ProcessWithdrawalDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _paymentService.ProcessWithdrawalAsync(adminId, dto);
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
        [HttpGet("admin/all-withdrawals")]
        public async Task<IActionResult> GetAllWithdrawalsForAdmin()
        {
            try
            {
                var result = await _paymentService.GetAllWithdrawalsForAdminAsync();
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

        // =========================================
        // CONSULTANT: Get my withdrawals
        // =========================================
        [Authorize(Roles = "Consultant")]
        [HttpGet("my/Withdrawls")]
        public async Task<IActionResult> GetMyWithdrawals([FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var result = await _paymentService.GetMyWithdrawalsAsync(userId, skip, take);
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

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/withdrawals/{requestId}")]
        public async Task<IActionResult> GetWithdrawalDetails(Guid requestId)
        {
            try
            {
                var result = await _paymentService.GetWithdrawalDetailsAsync(requestId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error"
                });
            }
        }

        [Authorize(Roles = "Consultant")]
        [HttpGet("bank-details")]
        public async Task<IActionResult> GetMyBankDetails()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _paymentService.GetConsultantBankDetailsAsync(userId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<ConsultantBankDetailsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/bank-details/{consultantId}")]
        public async Task<IActionResult> GetConsultantBankDetails(Guid consultantId)
        {
            try
            {
                var result = await _paymentService.GetConsultantBankDetailsAsync(consultantId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<ConsultantBankDetailsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error: " + ex.Message
                });
            }
        }

        [Authorize(Roles = "Consultant")]
        [HttpPost("bank-details")]
        public async Task<IActionResult> UpdateBankDetails([FromBody] ConsultantBankDetailsDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _paymentService.UpdateConsultantBankDetailsAsync(userId, dto);
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
