using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TekConsult.Entities
{
    public class ConsultantSubCategories
    {
        [ForeignKey("ConsultantProfiles")]
        public Guid ConsultantProfileId { get; set; }

        [ForeignKey("Categories")]
        public Guid SubCategoryId { get; set; }

        public ConsultantProfiles? ConsultantProfiles { get; set; }
        public Categories? Categories { get; set; }
    }
}
