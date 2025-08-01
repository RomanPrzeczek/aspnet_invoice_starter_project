﻿using AutoMapper;
using Invoices.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Invoices.Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class IdentificationController : ControllerBase
    {
        private readonly IInvoiceManager invoiceManager;
        public IdentificationController(IInvoiceManager invoiceManager, IMapper mapper) 
        {
            this.invoiceManager = invoiceManager;
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
