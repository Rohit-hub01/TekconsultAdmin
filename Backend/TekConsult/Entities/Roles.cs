using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TekConsult.Entities
{
    public class Roles
    {
        [Key]
        public int RoleId { get; set; }
        [Required]
        public string RoleName { get; set; }

        public ICollection<Users> Users { get; set; }
    }
}
