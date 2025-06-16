using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Invoices.Data.Interfaces;
using Invoices.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Invoices.Data.Repositories
{
    public class InvoiceRepository : BaseRepository<Invoice>, IInvoiceRepository
    {
        private readonly InvoicesDbContext invoicesDbContext;
        public InvoiceRepository(InvoicesDbContext invoicesDbContext) : base(invoicesDbContext)
        {
            this.invoicesDbContext = invoicesDbContext ?? throw new ArgumentNullException(nameof(invoicesDbContext));
        }

        /// <summary>
        /// Overload of BaseRepository method for use in InvoiceController AddInvoice(),
        /// where needed also properties of Seller and Buyer, which not present in BasicRepo method.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public new Invoice? FindById(ulong id)
        {
            return invoicesDbContext.Invoices
                .Include(i => i.Seller)
                .Include(i => i.Buyer)
                .FirstOrDefault(i => i.InvoiceId == id);
        }

        public IQueryable<Invoice> GetQueryable()
        {
            return invoicesDbContext.Invoices;
        }
    }
}
