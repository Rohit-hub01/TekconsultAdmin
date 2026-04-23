using System;
using System.Collections.Generic;

namespace TekConsult.Dto
{
    public class UpdateExpertiseDto
    {
        public List<Guid> CategoryIds { get; set; } = new();
        public List<Guid> SubCategoryIds { get; set; } = new();
    }

    public class ConsultantExpertiseResponseDto
    {
        public List<string> SubCategoryNames { get; set; } = new();
    }

    public class ConsultantExpertiseSelectionDto
    {
        public List<Guid> CategoryIds { get; set; } = new();
        public List<Guid> SubCategoryIds { get; set; } = new();
    }
}
