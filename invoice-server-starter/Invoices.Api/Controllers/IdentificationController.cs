using AutoMapper;
using Invoices.Api.Interfaces;
using Invoices.Api.Managers;
using Invoices.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Invoices.Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class IdentificationController : ControllerBase
    {
        private readonly IInvoiceManager invoiceManager;
        private readonly IMapper mapper;
        public IdentificationController(IInvoiceManager invoiceManager, IMapper mapper) 
        {
            this.invoiceManager = invoiceManager;
            this.mapper = mapper;
        }

        [HttpGet("identification/{ico}/sales")]
        public IActionResult GetInvoicesBySellerIco(string ico)
        {
            var invoices = invoiceManager.GetInvoicesBySellerIco(ico);
            return Ok(invoices);
        }

        [HttpGet("identification/{ico}/purchases")]
        public IActionResult GetInvoicesByBuyerIco(string ico)
        {
            var invoices = invoiceManager.GetInvoicesByBuyerIco(ico);
            return Ok(invoices);
        }
    }
}
