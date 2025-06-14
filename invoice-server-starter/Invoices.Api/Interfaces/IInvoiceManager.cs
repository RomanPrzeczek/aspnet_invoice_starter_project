using Invoices.Api.Models;

namespace Invoices.Api.Interfaces
{
    public interface IInvoiceManager
    {
        InvoiceDto AddInvoice(InvoiceDto invoiceDto);
        InvoiceDto? DeleteInvoice(uint invoiceId);
        IList<InvoiceDto> GetAllInvoices(ulong? buyerId, ulong? sellerId, string? product, decimal? minPrice, decimal? maxPrice, int? limit);
        InvoiceDto? GetInvoice(ulong invoiceId);
        InvoiceDto? UpdateInvoice(InvoiceDto invoiceDto);
    }
}
