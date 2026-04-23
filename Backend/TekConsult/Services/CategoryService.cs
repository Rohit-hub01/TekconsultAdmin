using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.ServiceResult;

namespace TekConsult.Services
{
    public interface ICategoryService
    {
        Task<ServiceResult<List<CategoryResponseDto>>> GetAllCategoriesAsync();
        Task<ServiceResult<List<UserFullProfileResponseDto>>> GetAllConsultantsAsync();
        Task<ServiceResult<CategoryResponseDto>> AddCategoryAsync(AddCategoryDto dto, Guid adminId);
        Task<ServiceResult<CategoryResponseDto>> AddSubCategoryAsync(AddSubCategoryDto dto, Guid adminId);
        Task<ServiceResult<CategoryResponseDto>> UpdateCategoryAsync(UpdateCategoryDto dto, Guid adminId);
        Task<ServiceResult<CategoryResponseDto>> ToggleCategoryStatusAsync(ToggleCategoryStatusDto dto, Guid adminId);
        Task<ServiceResult<CategoryResponseDto>> CreateCategoryWithSubCategoriesAsync(CreateCategoryWithSubDto dto, Guid adminId);
        Task<ServiceResult<CategoryResponseDto>> UpdateCategoryWithSubCategoriesAsync(
    UpdateCategoryWithSubDto dto,
    Guid adminId);
        Task<ServiceResult<CategoryStatsDto>> GetCategoryStatsAsync(Guid categoryId);
        Task<ServiceResult<bool>> UpdateConsultantExpertiseAsync(Guid userId, UpdateExpertiseDto dto);
        Task<ServiceResult<ConsultantExpertiseResponseDto>> GetConsultantExpertiseAsync(Guid userId);
        Task<ServiceResult<ConsultantExpertiseSelectionDto>> GetConsultantExpertiseSelectionAsync(Guid userId);
    }

    public class CategoryService : ICategoryService
    {
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        private readonly AppDbContext _dbContext;
        private readonly IAuditLogService _auditLogService;
        private readonly ITwilioService _twilioService;

        public CategoryService(IConfiguration configuration, IMemoryCache memoryCache, AppDbContext dbContext, IAuditLogService auditLogService, ITwilioService twilioService)
        {
            _configuration = configuration;
            _cache = memoryCache;
            _dbContext = dbContext;
            _auditLogService = auditLogService;
            _twilioService=twilioService;
        }

        public async Task<ServiceResult<List<CategoryResponseDto>>> GetAllCategoriesAsync()
        {
            try
            {
                var all = await _dbContext.Categories
                    .Where(c => c.IsActive)
                    .ToListAsync();

                var main = all.Where(c => c.ParentCategoryId == null).ToList();

                var consultantCategories = await _dbContext.ConsultantProfiles
                    .Where(cp => cp.ConsultantCategory != null)
                    .Select(cp => cp.ConsultantCategory)
                    .ToListAsync();

                var result = main.Select(c => new CategoryResponseDto
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive,
                    ConsultantCount = consultantCategories.Count(cc => cc.Contains(c.Name)),
                    SubCategories = all
                        .Where(sc => sc.ParentCategoryId == c.CategoryId)
                        .Select(sc => new CategoryResponseDto
                        {
                            CategoryId = sc.CategoryId,
                            Name = sc.Name,
                            Description = sc.Description,
                            IsActive = sc.IsActive,
                            ConsultantCount = consultantCategories.Count(cc => cc.Contains(sc.Name))
                        }).ToList()
                }).ToList();

                return new ServiceResult<List<CategoryResponseDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Categories fetched successfully.",
                    Data = result
                };
            }
            catch
            {
                return new ServiceResult<List<CategoryResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to fetch categories."
                };
            }
        }

        public async Task<ServiceResult<List<UserFullProfileResponseDto>>> GetAllConsultantsAsync()
        {
            try
            {
                var query = _dbContext.Users
                    .Include(u => u.ConsultantProfiles)
                    .Include(u => u.Addresses)
                    .Include(u => u.Roles)
                    .Where(u => u.Status && u.Roles.RoleName == "Consultant" && u.IsConsultantVerified);
                var consultants = await query.Select(u => new UserFullProfileResponseDto
                    {
                        UserId = u.UserId,
                        FirstName = u.FirstName,
                        MiddleName = u.MiddleName,
                        LastName = u.LastName,
                        CountryCode = u.CountryCode,
                        PhoneNumber = u.PhoneNumber,
                        Email = u.Email,
                        Status = u.Status,
                        IsPhoneVerified = u.IsPhoneVerified,
                        RoleName = u.Roles!.RoleName,

                        CreatedOn = u.CreatedOn,
                        ConsultantProfileId = u.ConsultantProfiles != null ? u.ConsultantProfiles.ConsultantProfileId : (Guid?)null,
                        Bio = u.ConsultantProfiles != null ? u.ConsultantProfiles.Bio : null,
                        ExperienceYears = u.ConsultantProfiles != null ? u.ConsultantProfiles.ExperienceYears : null,
                        ConsultantCategory = u.ConsultantProfiles != null ? u.ConsultantProfiles.ConsultantCategory : null,
                        ChatRatePerMinute = u.ConsultantProfiles != null ? u.ConsultantProfiles.ChatRatePerMinute : null,
                        CallRatePerMinute = u.ConsultantProfiles != null ? u.ConsultantProfiles.CallRatePerMinute : null,
                        DiscountedChatRate = u.ConsultantProfiles != null ? u.ConsultantProfiles.DiscountedChatRate : null,
                        IsChatDiscountActive = u.ConsultantProfiles != null ? u.ConsultantProfiles.IsChatDiscountActive : (bool?)null,
                        DiscountedCallRate = u.ConsultantProfiles != null ? u.ConsultantProfiles.DiscountedCallRate : null,
                        IsCallDiscountActive = u.ConsultantProfiles != null ? u.ConsultantProfiles.IsCallDiscountActive : (bool?)null,
                        DiscountStart = u.ConsultantProfiles != null ? u.ConsultantProfiles.DiscountStart : null,
                        DiscountEnd = u.ConsultantProfiles != null ? u.ConsultantProfiles.DiscountEnd : null,
                        IsOnline = u.ConsultantProfiles != null ? u.ConsultantProfiles.IsOnline : false,
                        FreeMinutesOffer = u.ConsultantProfiles != null ? u.ConsultantProfiles.FreeMinutesOffer : 0,
                        AverageRating = u.ConsultantProfiles != null ? u.ConsultantProfiles.AverageRating : 0,
                        TotalSessionsCompleted = u.ConsultantProfiles != null ? u.ConsultantProfiles.TotalSessionsCompleted : 0,
                        Gender = u.ConsultantProfiles != null ? u.ConsultantProfiles.Gender : null,
                        Languages = u.ConsultantProfiles != null ? u.ConsultantProfiles.Languages : null,
                        IsConsultantVerified = u.IsConsultantVerified,
                        ProfilePhotoUrl = u.ConsultantProfiles != null ? u.ConsultantProfiles.ProfilePhotoUrl : u.ProfilePhotoUrl,
                        Address = u.Addresses != null ? new AddressResponseDto
                        {
                            AddressId = u.Addresses.AddressId,
                            AddressLine = u.Addresses.AddressLine,
                            City = u.Addresses.City,
                            State = u.Addresses.State,
                            Zipcode = u.Addresses.Zipcode,
                            Country = u.Addresses.Country
                        } : null
                    })
                    .ToListAsync();

                // Populate ExpertiseNames (safe - won't crash if table doesn't exist yet)
                try
                {
                    var profileIds = consultants.Where(c => c.ConsultantProfileId != null)
                                                .Select(c => c.ConsultantProfileId.Value)
                                                .ToList();

                    if (profileIds.Any())
                    {
                        var expertiseMappings = await _dbContext.ConsultantSubCategories
                            .Where(csc => profileIds.Contains(csc.ConsultantProfileId))
                            .Join(_dbContext.Categories,
                                csc => csc.SubCategoryId,
                                c => c.CategoryId,
                                (csc, c) => new { csc.ConsultantProfileId, c.Name })
                            .ToListAsync();

                        foreach (var consultant in consultants)
                        {
                            if (consultant.ConsultantProfileId != null)
                            {
                                consultant.ExpertiseNames = expertiseMappings
                                    .Where(m => m.ConsultantProfileId == consultant.ConsultantProfileId)
                                    .Select(m => m.Name)
                                    .ToList();
                            }
                        }
                    }
                }
                catch (Exception exInner)
                {
                    // Log but don't fail - migration may not have run yet
                    Console.WriteLine($"[ExpertiseNames] Skipped: {exInner.Message}");
                }

                return new ServiceResult<List<UserFullProfileResponseDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Consultants fetched successfully.",
                    Data = consultants
                };
            }
            catch
            {
                return new ServiceResult<List<UserFullProfileResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to fetch consultants."
                };
            }
        }

        public async Task<ServiceResult<CategoryResponseDto>> AddCategoryAsync(AddCategoryDto dto, Guid adminId)
        {
            try
            {
                var category = new Categories
                {
                    CategoryId = Guid.NewGuid(),
                    Name = dto.Name,
                    ParentCategoryId = null,
                    IsActive = true
                };

                _dbContext.Categories.Add(category);
                await _dbContext.SaveChangesAsync();

                await _auditLogService.LogAsync(
                    "ADD_CATEGORY",
                    "Categories",
                    category.CategoryId.ToString(),
                    adminId,
                    null,
                    dto.Name
                );

                var all = await _dbContext.Categories.ToListAsync();
                var response = BuildSingleCategory(category.CategoryId, all);

                return new ServiceResult<CategoryResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category added successfully.",
                    Data = response
                };
            }
            catch
            {
                return new ServiceResult<CategoryResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to add category."
                };
            }
        }



        public async Task<ServiceResult<CategoryResponseDto>> AddSubCategoryAsync(AddSubCategoryDto dto, Guid adminId)
        {
            try
            {
                var sub = new Categories
                {
                    CategoryId = Guid.NewGuid(),
                    Name = dto.Name,
                    ParentCategoryId = dto.ParentCategoryId,
                    IsActive = true
                };

                _dbContext.Categories.Add(sub);
                await _dbContext.SaveChangesAsync();

                await _auditLogService.LogAsync(
                    "ADD_SUBCATEGORY",
                    "Categories",
                    sub.CategoryId.ToString(),
                    adminId,
                    null,
                    dto.Name
                );

                var all = await _dbContext.Categories.ToListAsync();
                var response = BuildSingleCategory(dto.ParentCategoryId, all);

                return new ServiceResult<CategoryResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "SubCategory added successfully.",
                    Data = response
                };
            }
            catch
            {
                return new ServiceResult<CategoryResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to add subcategory."
                };
            }
        }



        public async Task<ServiceResult<CategoryResponseDto>> UpdateCategoryAsync(UpdateCategoryDto dto, Guid adminId)
        {
            try
            {
                var cat = await _dbContext.Categories.FirstOrDefaultAsync(x => x.CategoryId == dto.CategoryId);
                if (cat == null)
                    return new ServiceResult<CategoryResponseDto>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found."
                    };

                var old = cat.Name;
                cat.Name = dto.Name;

                await _dbContext.SaveChangesAsync();

                await _auditLogService.LogAsync(
                    "UPDATE_CATEGORY",
                    "Categories",
                    cat.CategoryId.ToString(),
                    adminId,
                    old,
                    dto.Name
                );

                var all = await _dbContext.Categories.ToListAsync();

                Guid mainCategoryId = cat.ParentCategoryId ?? cat.CategoryId;

                var response = BuildSingleCategory(mainCategoryId, all);

                return new ServiceResult<CategoryResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category updated successfully.",
                    Data = response
                };
            }
            catch
            {
                return new ServiceResult<CategoryResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to update category."
                };
            }
        }



        public async Task<ServiceResult<CategoryResponseDto>> ToggleCategoryStatusAsync(ToggleCategoryStatusDto dto, Guid adminId)
        {
            try
            {
                var cat = await _dbContext.Categories.FirstOrDefaultAsync(x => x.CategoryId == dto.CategoryId);
                if (cat == null)
                    return new ServiceResult<CategoryResponseDto>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found."
                    };

                cat.IsActive = dto.IsActive;
                await _dbContext.SaveChangesAsync();

                await _auditLogService.LogAsync(
                    "TOGGLE_CATEGORY",
                    "Categories",
                    cat.CategoryId.ToString(),
                    adminId,
                    null,
                    dto.IsActive.ToString()
                );

                var all = await _dbContext.Categories.ToListAsync();

                Guid mainCategoryId = cat.ParentCategoryId ?? cat.CategoryId;

                var response = BuildSingleCategory(mainCategoryId, all);

                return new ServiceResult<CategoryResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category status updated.",
                    Data = response
                };
            }
            catch
            {
                return new ServiceResult<CategoryResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to update status."
                };
            }
        }



        private CategoryResponseDto BuildSingleCategory(Guid categoryId, List<Categories> all)
        {
            var category = all.First(x => x.CategoryId == categoryId);

            var consultantCategories = _dbContext.ConsultantProfiles
                .Where(cp => cp.ConsultantCategory != null)
                .Select(cp => cp.ConsultantCategory)
                .ToList();

            return new CategoryResponseDto
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                Description = category.Description,
                IsActive = category.IsActive,
                ConsultantCount = consultantCategories.Count(cc => cc.Contains(category.Name)),
                SubCategories = all
                    .Where(sc => sc.ParentCategoryId == category.CategoryId)
                    .Select(sc => new CategoryResponseDto
                    {
                        CategoryId = sc.CategoryId,
                        Name = sc.Name,
                        Description = sc.Description,
                        IsActive = sc.IsActive,
                        ConsultantCount = consultantCategories.Count(cc => cc.Contains(sc.Name))
                    }).ToList()
            };
        }

        public async Task<ServiceResult<CategoryResponseDto>> CreateCategoryWithSubCategoriesAsync(CreateCategoryWithSubDto dto,Guid adminId)
        {
            try
            {
                // 1. Create Parent Category
                var parent = new Categories
                {
                    CategoryId = Guid.NewGuid(),
                    Name = dto.Name,
                    Description = dto.Description,
                    ParentCategoryId = null,
                    IsActive = true
                };

                _dbContext.Categories.Add(parent);
                await _dbContext.SaveChangesAsync();

                // 🔍 Audit Parent
                await _auditLogService.LogAsync(
                    "ADD_CATEGORY",
                    "Categories",
                    parent.CategoryId.ToString(),
                    adminId,
                    null,
                    parent.Name
                );

                // 2. Create SubCategories
                if (dto.SubCategories != null && dto.SubCategories.Any())
                {
                    var subCategories = dto.SubCategories.Select(sc => new Categories
                    {
                        CategoryId = Guid.NewGuid(),
                        Name = sc.Name,
                        Description = sc.Description,
                        ParentCategoryId = parent.CategoryId,
                        IsActive = true
                    }).ToList();

                    _dbContext.Categories.AddRange(subCategories);
                    await _dbContext.SaveChangesAsync();

                    // 🔍 Audit SubCategories
                    foreach (var sub in subCategories)
                    {
                        await _auditLogService.LogAsync(
                            "ADD_SUBCATEGORY",
                            "Categories",
                            sub.CategoryId.ToString(),
                            adminId,
                            null,
                            $"{parent.Name} -> {sub.Name}"
                        );
                    }
                }

                // 3. Build Response (using your existing logic)
                var all = await _dbContext.Categories.ToListAsync();
                var response = BuildSingleCategory(parent.CategoryId, all);

                return new ServiceResult<CategoryResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category and subcategories added successfully.",
                    Data = response
                };
            }
            catch (Exception ex)
            {

                return new ServiceResult<CategoryResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to add category."
                };
            }
        }
        public async Task<ServiceResult<CategoryResponseDto>> UpdateCategoryWithSubCategoriesAsync(
       UpdateCategoryWithSubDto dto,
       Guid adminId)
        {
            try
            {
                // 1. Load Parent
                var parent = await _dbContext.Categories
                    .FirstOrDefaultAsync(x => x.CategoryId == dto.CategoryId && x.ParentCategoryId == null);

                if (parent == null)
                {
                    return new ServiceResult<CategoryResponseDto>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found."
                    };
                }

                var oldParentName = parent.Name;

                // 2. Update Parent
                parent.Name = dto.Name;
                parent.Description = dto.Description;
                await _dbContext.SaveChangesAsync();

                // 🔍 Audit Parent Update
                await _auditLogService.LogAsync(
                    "UPDATE_CATEGORY",
                    "Categories",
                    parent.CategoryId.ToString(),
                    adminId,
                    oldParentName,
                    parent.Name
                );

                // 3. Load Existing SubCategories
                var existingSubs = await _dbContext.Categories
                    .Where(x => x.ParentCategoryId == parent.CategoryId)
                    .ToListAsync();

                // 4. Handle SubCategories (ONLY UPDATE / ADD)
                foreach (var subDto in dto.SubCategories)
                {
                    // ➕ Add New SubCategory
                    if (subDto.CategoryId == null || subDto.CategoryId == Guid.Empty)
                    {
                        var newSub = new Categories
                        {
                            CategoryId = Guid.NewGuid(),
                            Name = subDto.Name,
                            Description = subDto.Description,
                            ParentCategoryId = parent.CategoryId,
                            IsActive = true
                        };

                        _dbContext.Categories.Add(newSub);
                        await _dbContext.SaveChangesAsync();

                        // 🔍 Audit Add
                        await _auditLogService.LogAsync(
                            "ADD_SUBCATEGORY",
                            "Categories",
                            newSub.CategoryId.ToString(),
                            adminId,
                            null,
                            $"{parent.Name} -> {newSub.Name}"
                        );
                    }
                    else
                    {
                        // ✏️ Update Existing SubCategory
                        var existing = existingSubs.FirstOrDefault(x => x.CategoryId == subDto.CategoryId);

                        if (existing != null)
                        {
                            var oldName = existing.Name;

                            existing.Name = subDto.Name;
                            existing.Description = subDto.Description;
                            await _dbContext.SaveChangesAsync();

                            // 🔍 Audit Update
                            await _auditLogService.LogAsync(
                                "UPDATE_SUBCATEGORY",
                                "Categories",
                                existing.CategoryId.ToString(),
                                adminId,
                                oldName,
                                existing.Name
                            );
                        }
                    }
                }

                // ❌ NO DELETE LOGIC HERE (SAFE)

                // 5. Build Response
                var all = await _dbContext.Categories.ToListAsync();
                var response = BuildSingleCategory(parent.CategoryId, all);

                return new ServiceResult<CategoryResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category updated successfully.",
                    Data = response
                };
            }
            catch (Exception ex)
            {
              
                return new ServiceResult<CategoryResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Failed to update category."
                };
            }
        }




        public async Task<ServiceResult<CategoryStatsDto>> GetCategoryStatsAsync(Guid categoryId)
        {
            try
            {
                var category = await _dbContext.Categories.FirstOrDefaultAsync(c => c.CategoryId == categoryId);
                if (category == null)
                {
                    return new ServiceResult<CategoryStatsDto>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found."
                    };
                }

                var categoryName = category.Name;

                // 1. Get Consultant User IDs for this category
                var consultantUserIds = await _dbContext.ConsultantProfiles
                    .Where(cp => cp.ConsultantCategory != null && cp.ConsultantCategory.Contains(categoryName))
                    .Select(cp => cp.UserId)
                    .ToListAsync();

                var totalConsultants = consultantUserIds.Count;

                // 2. Active Sessions Count
                var activeSessionsCount = await _dbContext.ConsultationSessions
                    .CountAsync(s => s.State == Enums.SessionState.Active &&
                                     s.Participants.Any(p => consultantUserIds.Contains(p.UserId)));

                // 3. Total Revenue (from Completed sessions minus refunds)
                var sessionIdsQuery = _dbContext.ConsultationSessions
                    .Where(s => s.State == Enums.SessionState.Completed &&
                                s.Participants.Any(p => consultantUserIds.Contains(p.UserId)))
                    .Select(s => s.SessionId);

                var totalBilled = await _dbContext.ConsultationSessions
                    .Where(s => sessionIdsQuery.Contains(s.SessionId))
                    .SumAsync(s => (decimal?)s.TotalChargedAmount) ?? 0;

                var totalRefunded = await _dbContext.Disputes
                    .Where(d => d.Status == (int)Enums.DisputeStatus.Resolved &&
                                sessionIdsQuery.Contains(d.SessionId))
                    .SumAsync(d => (decimal?)d.RefundAmount) ?? 0;

                var totalRevenue = totalBilled - totalRefunded;

                var stats = new CategoryStatsDto
                {
                    CategoryId = categoryId,
                    CategoryName = categoryName,
                    TotalConsultants = totalConsultants,
                    ActiveSessionsCount = activeSessionsCount,
                    TotalRevenue = totalRevenue
                };

                return new ServiceResult<CategoryStatsDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category stats fetched successfully.",
                    Data = stats
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<CategoryStatsDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"Failed to fetch category stats: {ex.Message}"
                };
            }
        }
        public async Task<ServiceResult<bool>> UpdateConsultantExpertiseAsync(Guid userId, UpdateExpertiseDto dto)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var profile = await _dbContext.ConsultantProfiles
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (profile == null)
                    return new ServiceResult<bool> { Success = false, StatusCode = 404, Message = "Consultant profile not found." };

                var consultantProfileId = profile.ConsultantProfileId;

                // 1. Validation: All SubCategories must belong to selected Categories
                if (dto.SubCategoryIds.Any())
                {
                    var subCategories = await _dbContext.Categories
                        .Where(c => dto.SubCategoryIds.Contains(c.CategoryId))
                        .ToListAsync();

                    foreach (var sub in subCategories)
                    {
                        if (sub.ParentCategoryId == null || !dto.CategoryIds.Contains(sub.ParentCategoryId.Value))
                        {
                            return new ServiceResult<bool>
                            {
                                Success = false,
                                StatusCode = 400,
                                Message = $"SubCategory {sub.Name} does not belong to any of the selected categories."
                            };
                        }
                    }
                }

                // 2. Delete old mappings
                var oldCategories = await _dbContext.ConsultantCategories
                    .Where(cc => cc.ConsultantProfileId == consultantProfileId)
                    .ToListAsync();
                _dbContext.ConsultantCategories.RemoveRange(oldCategories);

                var oldSubCategories = await _dbContext.ConsultantSubCategories
                    .Where(csc => csc.ConsultantProfileId == consultantProfileId)
                    .ToListAsync();
                _dbContext.ConsultantSubCategories.RemoveRange(oldSubCategories);

                await _dbContext.SaveChangesAsync();

                // 3. Insert new mappings
                if (dto.CategoryIds.Any())
                {
                    var newCategories = dto.CategoryIds.Distinct().Select(cid => new ConsultantCategories
                    {
                        ConsultantProfileId = consultantProfileId,
                        CategoryId = cid
                    });
                    _dbContext.ConsultantCategories.AddRange(newCategories);
                }

                if (dto.SubCategoryIds.Any())
                {
                    var newSubCategories = dto.SubCategoryIds.Distinct().Select(scid => new ConsultantSubCategories
                    {
                        ConsultantProfileId = consultantProfileId,
                        SubCategoryId = scid
                    });
                    _dbContext.ConsultantSubCategories.AddRange(newSubCategories);
                }

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ServiceResult<bool> { Success = true, StatusCode = 200, Message = "Expertise updated successfully.", Data = true };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new ServiceResult<bool> { Success = false, StatusCode = 500, Message = $"Error updating expertise: {ex.Message}" };
            }
        }

        public async Task<ServiceResult<ConsultantExpertiseResponseDto>> GetConsultantExpertiseAsync(Guid userId)
        {
            try
            {
                var profile = await _dbContext.ConsultantProfiles
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (profile == null)
                    return new ServiceResult<ConsultantExpertiseResponseDto> { Success = false, StatusCode = 404, Message = "Consultant profile not found." };

                List<string> subCategoryNames = new();
                try
                {
                    subCategoryNames = await _dbContext.ConsultantSubCategories
                        .Where(csc => csc.ConsultantProfileId == profile.ConsultantProfileId)
                        .Join(_dbContext.Categories,
                            csc => csc.SubCategoryId,
                            c => c.CategoryId,
                            (csc, c) => c.Name)
                        .ToListAsync();
                }
                catch { /* Table may not exist yet */ }

                return new ServiceResult<ConsultantExpertiseResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Expertise fetched successfully.",
                    Data = new ConsultantExpertiseResponseDto { SubCategoryNames = subCategoryNames }
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<ConsultantExpertiseResponseDto> { Success = false, StatusCode = 500, Message = $"Error fetching expertise: {ex.Message}" };
            }
        }

        public async Task<ServiceResult<ConsultantExpertiseSelectionDto>> GetConsultantExpertiseSelectionAsync(Guid userId)
        {
            try
            {
                var profile = await _dbContext.ConsultantProfiles
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (profile == null)
                    return new ServiceResult<ConsultantExpertiseSelectionDto> { Success = false, StatusCode = 404, Message = "Consultant profile not found." };

                List<Guid> categoryIds = new();
                List<Guid> subCategoryIds = new();
                try
                {
                    categoryIds = await _dbContext.ConsultantCategories
                        .Where(cc => cc.ConsultantProfileId == profile.ConsultantProfileId)
                        .Select(cc => cc.CategoryId)
                        .ToListAsync();
                }
                catch { /* Table may not exist yet */ }

                try
                {
                    subCategoryIds = await _dbContext.ConsultantSubCategories
                        .Where(csc => csc.ConsultantProfileId == profile.ConsultantProfileId)
                        .Select(csc => csc.SubCategoryId)
                        .ToListAsync();
                }
                catch { /* Table may not exist yet */ }

                return new ServiceResult<ConsultantExpertiseSelectionDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Expertise selection fetched successfully.",
                    Data = new ConsultantExpertiseSelectionDto
                    {
                        CategoryIds = categoryIds,
                        SubCategoryIds = subCategoryIds
                    }
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<ConsultantExpertiseSelectionDto> { Success = false, StatusCode = 500, Message = $"Error fetching expertise selection: {ex.Message}" };
            }
        }
    }
}
