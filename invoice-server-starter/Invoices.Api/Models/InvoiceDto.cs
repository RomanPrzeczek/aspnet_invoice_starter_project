using System.Text.Json.Serialization;

namespace Invoices.Api.Models
{
    public class InvoiceDto
    {
        [JsonPropertyName("_id")]
        public ulong InvoiceId { get; set; }

        public int InvoiceNumber { get; set; }

        public DateOnly Issued { get; set; }    // change of type entity DateTime to DTO DateOnly

        public DateOnly DueDate { get; set; }   // same as above

        public string Product { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public int Vat { get; set; }

        public string Note { get; set; } = "";

        public PersonDto? Seller { get; set; }

        public PersonDto? Buyer { get; set; }
    }
}
