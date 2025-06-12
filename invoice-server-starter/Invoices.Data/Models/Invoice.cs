using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Invoices.Data.Models
{
    public class Invoice
    {
        [Key]
        public int InvoiceId { get; set; }

        [Required]
        public int InvoiceNumber { get; set; }

        [Required]
        public Person Seller { get; set; } = null!;

        [Required]
        public Person Buyer { get; set; } = null!;

        [Required]
        public DateTime Issued { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public string Product { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Vat { get; set; }

        public string? Note { get; set; }
    }
}
