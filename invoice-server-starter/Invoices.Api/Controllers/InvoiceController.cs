using Microsoft.AspNetCore.Mvc;
using Invoices.Api.Interfaces;
using Invoices.Api.Models;
using Invoices.Api.Managers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;

namespace Invoices.Api.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize(Policy = "BrowserOnly")]   // just cookie, no Bearer
    [EnableCors("FeCors")]
    [ApiExplorerSettings(GroupName = "browser")]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceManager _invoiceManager;

        public InvoiceController(IInvoiceManager invoiceManager)
        {
            _invoiceManager = invoiceManager;
        }

        [HttpPost("invoices")]
        public IActionResult AddInvoice([FromBody] InvoiceDto invoice)
        {
            InvoiceDto? createdInvoice = _invoiceManager.AddInvoice(invoice);
            return StatusCode(StatusCodes.Status201Created, createdInvoice);
        }

        [HttpGet("invoices")]
        public IActionResult GetAllInvoices(
                [FromQuery] ulong? buyerId,
                [FromQuery] ulong? sellerId,
                [FromQuery] string? product,
                [FromQuery] decimal? minPrice,
                [FromQuery] decimal? maxPrice,
                [FromQuery] int? limit            
            )
        {
            //learn: invoices was IList<InvoiceDto> invoices = _invoiceManager.GetAllInvoices();
            var invoices = _invoiceManager.GetAllInvoices(buyerId, sellerId, product, minPrice, maxPrice, limit); 
            return Ok(invoices);            
        }

        [HttpGet("invoices/{invoiceId}")]
        public IActionResult GetInvoice(ulong invoiceId)
        {
            InvoiceDto? invoice = _invoiceManager.GetInvoice(invoiceId);
            if (invoice == null)
            {
                return NotFound();
            }
            return Ok(invoice);
        }

        [HttpGet("invoices/statistics")]
        public IActionResult GetInvoiceStatistics()
        {
            var statistics = _invoiceManager.GetInvoiceStatistics();
            return Ok(statistics);
        }


        [HttpPut("invoices/{invoiceId}")]
        public IActionResult UpdateInvoice(ulong invoiceId, [FromBody] InvoiceDto invoice)
        {
            if (invoiceId != invoice.InvoiceId)
            {
                return BadRequest($"Invoice ID mismatch. Route ID = {invoiceId}, Body ID = {invoice.InvoiceId}");
            }

            InvoiceDto? updatedInvoice = _invoiceManager.UpdateInvoice(invoice);
            if (updatedInvoice == null)
            {
                return NotFound();
            }
            return Ok(updatedInvoice);
        }

        [HttpDelete("invoices/{invoiceId}")]
        public IActionResult DeleteInvoice(uint invoiceId)
        {
            InvoiceDto? deletedInvoice = _invoiceManager.DeleteInvoice(invoiceId);
            if (deletedInvoice == null)
            {
                return NotFound();
            }
            return NoContent(); // Ok(deletedInvoice);
        }
    }
}
