using Invoices.Api.Models;

namespace Invoices.Api.Interfaces
{
    public interface IInvoiceManager
    {
        IList<InvoiceDto> GetAllInvoices();
        InvoiceDto AddInvoice(InvoiceDto invoiceDto);
        InvoiceDto? DeleteInvoice(uint invoiceId);
        InvoiceDto? GetInvoice(ulong invoiceId);
    }
}
