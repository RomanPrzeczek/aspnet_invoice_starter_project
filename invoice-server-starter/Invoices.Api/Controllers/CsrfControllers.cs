using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Invoices.Api.Controllers;

[ApiController]
[Route("api")]
public class CsrfController : ControllerBase
{
    private readonly IAntiforgery _anti;
    private readonly ILogger<CsrfController> _logger;

    public CsrfController(IAntiforgery anti, ILogger<CsrfController> logger)
    {
        _anti = anti;
        _logger = logger;
    }

    [HttpGet("csrf")]
    [AllowAnonymous]
    public IActionResult GetCsrf()
    {
        try
        {
            var tokens = _anti.GetAndStoreTokens(HttpContext);

            Response.Headers.CacheControl = "no-store, must-revalidate";
            Response.Headers.Pragma = "no-cache";
            Response.Headers.Expires = "0";

            return Ok(new { csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ /api/csrf controller failed");
            // Vrátíme 500, ale hlavně se to zaloguje do Log Streamu
            return Problem("CSRF endpoint failed", statusCode: 500);
        }
    }
}