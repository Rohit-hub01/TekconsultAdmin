using Microsoft.AspNetCore.Http;

namespace TekConsult.Dto
{
    public class UploadProfilePhotoDto
    {
        public IFormFile File { get; set; }
    }
}
