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
        public ulong InvoiceId { get; set; }

        [Required]
        public int InvoiceNumber { get; set; }

        [Required]
        public DateTime Issued { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public string Product { get; set; } = string.Empty;

        [Required]
        public decimal Price { get; set; }

        public int Vat { get; set; }

        public string? Note { get; set; }

        public ulong? BuyerId { get; set; }

        public ulong? SellerId { get; set; }

        [ForeignKey(nameof(BuyerId))]
        public virtual Person? Buyer { get; set; }

        [ForeignKey(nameof(SellerId))]
        public virtual Person? Seller { get; set; }
    }
}
