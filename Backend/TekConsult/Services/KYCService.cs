using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TekConsult.Data;
using TekConsult.Dto;
using TekConsult.Entities;
using TekConsult.Enums;
using TekConsult.ServiceResult;

namespace TekConsult.Services
{
    public interface IKYCService
    {
        Task<ServiceResult<KYCDocumentResponseDto>> UploadDocumentAsync(Guid userId, UploadKYCDocumentDto dto);
        Task<ServiceResult<List<KYCDocumentResponseDto>>> GetMyDocumentsAsync(Guid userId);
        Task<ServiceResult<List<KYCDocumentResponseDto>>> GetConsultantDocumentsAsync(Guid consultantProfileId);
        Task<ServiceResult<bool>> UpdateDocumentStatusAsync(UpdateKYCStatusDto dto);
    }

    public class KYCService : IKYCService
    {
        private readonly AppDbContext _dbContext;
        private readonly IWebHostEnvironment _environment;
        private readonly INotificationService _notificationService;

        public KYCService(AppDbContext dbContext, IWebHostEnvironment environment, INotificationService notificationService)
        {
            _dbContext = dbContext;
            _environment = environment;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult<KYCDocumentResponseDto>> UploadDocumentAsync(Guid userId, UploadKYCDocumentDto dto)
        {
            try
            {
                var consultant = await _dbContext.ConsultantProfiles
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.UserId == userId);
                if (consultant == null)
                {
                    return new ServiceResult<KYCDocumentResponseDto>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Consultant profile not found."
                    };
                }

                if (dto.File == null || dto.File.Length == 0)
                {
                    return new ServiceResult<KYCDocumentResponseDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "No file uploaded."
                    };
                }

                // Create directory if it doesn't exist
                var rootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
                var uploadsFolder = Path.Combine(rootPath, "uploads", "kyc");
                
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate a unique filename
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.File.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Save file to disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }

                // Save record to database
                var document = new KYCDocuments
                {
                    DocId = Guid.NewGuid(),
                    ConsultantProfileId = consultant.ConsultantProfileId,
                    DocumentType = dto.DocumentType,
                    DocumentUrl = "/uploads/kyc/" + fileName,
                    VerificationStatus = (int)KYCStatus.Pending,
                    UploadedAt = DateTime.UtcNow
                };

                _dbContext.KYCDocuments.Add(document);
                await _dbContext.SaveChangesAsync();

                // Notify Admin
                if (consultant.User != null)
                {
                    string consultantName = $"{consultant.User.FirstName} {consultant.User.LastName}".Trim();
                    await _notificationService.NotifyAdminAsync(
                        "New KYC Document Uploaded",
                        $"Consultant {consultantName} has uploaded a new {dto.DocumentType} document for verification.",
                        NotificationType.NewKYCUploaded
                    );
                }

                return new ServiceResult<KYCDocumentResponseDto>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Document uploaded successfully.",
                    Data = MapToDto(document)
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<KYCDocumentResponseDto>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Error uploading document: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<List<KYCDocumentResponseDto>>> GetMyDocumentsAsync(Guid userId)
        {
            try
            {
                var consultant = await _dbContext.ConsultantProfiles.FirstOrDefaultAsync(c => c.UserId == userId);
                if (consultant == null)
                {
                    return new ServiceResult<List<KYCDocumentResponseDto>>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Consultant profile not found."
                    };
                }

                var documents = await _dbContext.KYCDocuments
                    .Where(d => d.ConsultantProfileId == consultant.ConsultantProfileId)
                    .OrderByDescending(d => d.UploadedAt)
                    .ToListAsync();

                return new ServiceResult<List<KYCDocumentResponseDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = documents.Select(MapToDto).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<KYCDocumentResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Error fetching documents: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<List<KYCDocumentResponseDto>>> GetConsultantDocumentsAsync(Guid consultantProfileId)
        {
            try
            {
                var documents = await _dbContext.KYCDocuments
                    .Where(d => d.ConsultantProfileId == consultantProfileId)
                    .OrderByDescending(d => d.UploadedAt)
                    .ToListAsync();

                return new ServiceResult<List<KYCDocumentResponseDto>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = documents.Select(MapToDto).ToList()
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<List<KYCDocumentResponseDto>>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Error fetching documents: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<bool>> UpdateDocumentStatusAsync(UpdateKYCStatusDto dto)
        {
            try
            {
                var document = await _dbContext.KYCDocuments
                    .Include(d => d.ConsultantProfiles)
                    .FirstOrDefaultAsync(d => d.DocId == dto.DocId);

                if (document == null)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Document not found.",
                        Data = false
                    };
                }

                document.VerificationStatus = dto.Status;
                document.AdminFeedback = dto.AdminFeedback;
                document.VerifiedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                // Notify Consultant
                if (document.ConsultantProfiles != null)
                {
                    string statusStr = dto.Status switch
                    {
                        (int)KYCStatus.Verified => "Verified",
                        (int)KYCStatus.Rejected => "Rejected",
                        _ => "Updated"
                    };

                    string message = $"Your {document.DocumentType} document has been {statusStr.ToLower()}.";
                    if (!string.IsNullOrEmpty(dto.AdminFeedback))
                    {
                        message += $" Feedback: {dto.AdminFeedback}";
                    }

                    await _notificationService.NotifyUserAsync(
                        document.ConsultantProfiles.UserId,
                        "KYC Status Updated",
                        message,
                        NotificationType.KYCStatusUpdated
                    );
                }

                return new ServiceResult<bool>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Document status updated.",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult<bool>
                {
                    Success = false,
                    StatusCode = 500,
                    Message = "Error updating status: " + ex.Message,
                    Data = false
                };
            }
        }

        private KYCDocumentResponseDto MapToDto(KYCDocuments doc)
        {
            return new KYCDocumentResponseDto
            {
                DocId = doc.DocId,
                DocumentType = doc.DocumentType,
                DocumentUrl = doc.DocumentUrl,
                VerificationStatus = doc.VerificationStatus,
                AdminFeedback = doc.AdminFeedback,
                UploadedAt = doc.UploadedAt,
                VerifiedAt = doc.VerifiedAt
            };
        }
    }
}
