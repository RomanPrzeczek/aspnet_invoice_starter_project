using Invoices.Api.Models;

namespace Invoices.Api.Interfaces
{
    public interface IInvoiceManager
    {
        InvoiceDto AddInvoice(InvoiceDto invoiceDto);
        InvoiceDto? DeleteInvoice(uint invoiceId);
        IList<InvoiceDto> GetAllInvoices(ulong? buyerId, ulong? sellerId, string? product, decimal? minPrice, decimal? maxPrice, int? limit);
        InvoiceDto? GetInvoice(ulong invoiceId);
        IEnumerable<InvoiceDto> GetInvoicesByBuyerIco(string ico);
        IEnumerable<InvoiceDto> GetInvoicesBySellerIco(string ico);
        object GetInvoiceStatistics();
        InvoiceDto? UpdateInvoice(InvoiceDto invoiceDto);
    }
}
