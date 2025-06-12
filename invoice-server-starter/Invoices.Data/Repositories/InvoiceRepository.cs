using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Invoices.Data.Interfaces;
using Invoices.Data.Models;

namespace Invoices.Data.Repositories
{
    public class InvoiceRepository : BaseRepository<Invoice>, IInvoiceRepository
    {
        public InvoiceRepository(InvoicesDbContext invoicesDbContext) : base(invoicesDbContext)
        {
        }
        // Add methods specific to InvoiceRepository here
        // For example, you might want to add methods to get invoices by status, date range, etc.
    }
}
