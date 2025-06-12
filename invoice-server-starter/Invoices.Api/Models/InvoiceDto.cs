namespace Invoices.Api.Models
{
    public class InvoiceDto
    {
        public int InvoiceId { get; set; }

        public int InvoiceNumber { get; set; }

        public PersonDto Seller { get; set; } = null!;

        public PersonDto Buyer { get; set; } = null!;

        public DateTime Issued { get; set; }

        public DateTime DueDate { get; set; }

        public string Product { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal Vat { get; set; }

        public string? Note { get; set; }
    }
}
