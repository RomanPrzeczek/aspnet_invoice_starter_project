using AutoMapper;
using Invoices.Api.Interfaces;
using Invoices.Api.Models;
using Invoices.Data.Interfaces;
using Invoices.Data.Models;
using Invoices.Data.Repositories;

namespace Invoices.Api.Managers
{
    public class InvoiceManager : IInvoiceManager
    {
        private readonly IInvoiceRepository invoiceRepository;
        private readonly IMapper mapper;

        public InvoiceManager(IInvoiceRepository invoiceRepository, IMapper mapper)
        {
            this.invoiceRepository = invoiceRepository;
            this.mapper = mapper;
        }

        public InvoiceDto AddInvoice(InvoiceDto invoiceDto)
        {
            Invoice invoice = mapper.Map<Invoice>(invoiceDto);
            invoice.InvoiceId = default;
            Invoice addedInvoiice= invoiceRepository.Insert(invoice);

            return mapper.Map<InvoiceDto>(addedInvoiice);
        }

        public InvoiceDto? DeleteInvoice(uint invoiceId)
        {
            if (!invoiceRepository.ExistsWithId(invoiceId))
                return null;

            Invoice invoice = invoiceRepository.FindById(invoiceId)!;
            InvoiceDto invoiceDto = mapper.Map<InvoiceDto>(invoice);

            invoiceRepository.Delete(invoiceId);

            return invoiceDto;
        }

        public IList<InvoiceDto> GetAllInvoices()
        {
            IList<Invoice> invoices = invoiceRepository.GetAll();
            return mapper.Map<IList<InvoiceDto>>(invoices);
        }

        public InvoiceDto? GetInvoice(ulong invoiceId)
        {
            Invoice? invoice = invoiceRepository.FindById(invoiceId);

            if (invoice == null)
            {
                return null;
            }

            return mapper.Map<InvoiceDto>(invoice);
        }
    }
}
