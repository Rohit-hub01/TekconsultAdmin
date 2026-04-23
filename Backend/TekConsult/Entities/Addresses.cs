using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TekConsult.Entities;

namespace TekConsult.Entities
{
    public class Addresses
    {
        [Key]
        public Guid AddressId { get; set; }

        [Required]
        [ForeignKey("Users")]
        public Guid UserId { get; set; }


        public string? AddressLine { get; set; }


        public string? City { get; set; }


        public string? State { get; set; }


        public string? Zipcode { get; set; }


        public string? Country { get; set; }


        public DateTime? CreatedOn { get; set; }

        public DateTime? ModifiedOn { get; set; }

        public Users? User { get; set; }
    }
}