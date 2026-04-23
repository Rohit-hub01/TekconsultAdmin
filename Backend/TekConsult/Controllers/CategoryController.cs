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
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        public CategoryController(ICategoryService categoryService)
        {
            _categoryService=categoryService;
        }

        [HttpGet("get-all-categories")]
        public async Task<IActionResult> GetAllCategories()
        {
            try
            {
                var result = await _categoryService.GetAllCategoriesAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        [HttpGet("get-all-consultants")]
        public async Task<IActionResult> GetAllConsultants()
        {
            try
            {
                var result = await _categoryService.GetAllConsultantsAsync();
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error."
                });
            }
        }

        // ✅ Admin only
        [Authorize(Roles = "Admin")]
        [HttpPost("add-category")]
        public async Task<IActionResult> AddCategory(AddCategoryDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _categoryService.AddCategoryAsync(dto, adminId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string> { Success = false, StatusCode = 500, Message = "Internal server error." });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("add-subcategory")]
        public async Task<IActionResult> AddSubCategory(AddSubCategoryDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _categoryService.AddSubCategoryAsync(dto, adminId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string> { Success = false, StatusCode = 500, Message = "Internal server error." });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("update-category")]
        public async Task<IActionResult> Update(UpdateCategoryDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _categoryService.UpdateCategoryAsync(dto, adminId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string> { Success = false, StatusCode = 500, Message = "Internal server error." });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("toggle-status-category")]
        public async Task<IActionResult> Toggle(ToggleCategoryStatusDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _categoryService.ToggleCategoryStatusAsync(dto, adminId);
                return StatusCode(result.StatusCode, result);
            }
            catch
            {
                return StatusCode(500, new ServiceResult<string> { Success = false, StatusCode = 500, Message = "Internal server error." });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create-category-with-subcategories")]
        public async Task<IActionResult> CreateCategoryWithSubCategories([FromBody] CreateCategoryWithSubDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var result = await _categoryService.CreateCategoryWithSubCategoriesAsync(dto, adminId);

                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {

                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error"
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("update-category-with-subcategories")]
        public async Task<IActionResult> UpdateCategoryWithSubCategories([FromBody] UpdateCategoryWithSubDto dto)
        {
            try
            {
                var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var result = await _categoryService.UpdateCategoryWithSubCategoriesAsync(dto, adminId);

                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {

                return StatusCode(500, new ServiceResult<string>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Internal server error"
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("stats/{categoryId}")]
        public async Task<IActionResult> GetStats(Guid categoryId)
        {
            try
            {
                var result = await _categoryService.GetCategoryStatsAsync(categoryId);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResult<string> { Success = false, StatusCode = 500, Message = "Internal server error: " + ex.Message });
            }
        }

        [HttpGet("/api/categories-with-subcategories")]
        public async Task<IActionResult> GetCategoriesWithSubcategories()
        {
            var result = await _categoryService.GetAllCategoriesAsync();
            return StatusCode(result.StatusCode, result);
        }

        [Authorize]
        [HttpPut("/api/consultants/{id}/expertise")]
        public async Task<IActionResult> UpdateExpertise(Guid id, [FromBody] UpdateExpertiseDto dto)
        {
            var result = await _categoryService.UpdateConsultantExpertiseAsync(id, dto);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("/api/consultants/{id}/expertise")]
        public async Task<IActionResult> GetExpertise(Guid id)
        {
            var result = await _categoryService.GetConsultantExpertiseAsync(id);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("/api/consultants/{id}/expertise-selection")]
        public async Task<IActionResult> GetExpertiseSelection(Guid id)
        {
            var result = await _categoryService.GetConsultantExpertiseSelectionAsync(id);
            return StatusCode(result.StatusCode, result);
        }
    }
}
