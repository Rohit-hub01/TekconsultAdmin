namespace TekConsult.Dto
{
    public class CategoryResponseDto
    {
        public Guid CategoryId { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int ConsultantCount { get; set; }
        public List<CategoryResponseDto> SubCategories { get; set; } = new();
    }

    public class AddCategoryDto
    {
        public string Name { get; set; }
    }

    public class AddSubCategoryDto
    {
        public string Name { get; set; }
        public Guid ParentCategoryId { get; set; }
    }

    public class UpdateCategoryDto
    {
        public Guid CategoryId { get; set; }
        public string Name { get; set; }
    }

    public class ToggleCategoryStatusDto
    {
        public Guid CategoryId { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCategoryWithSubDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }

        public List<CreateSubCategoryDto> SubCategories { get; set; } = new();
    }

    public class CreateSubCategoryDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateCategoryWithSubDto
    {
        public Guid CategoryId { get; set; }   // Parent ID
        public string Name { get; set; }
        public string? Description { get; set; }

        public List<UpdateSubCategoryDto> SubCategories { get; set; } = new();
    }

    public class UpdateSubCategoryDto
    {
        public Guid? CategoryId { get; set; } // null = new subcategory
        public string Name { get; set; }
        public string? Description { get; set; }
    }

}
