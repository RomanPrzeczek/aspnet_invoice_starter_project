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
            // 1) Vygeneruj tokeny, ale NIC nezapisuj do response automaticky
            var tokens = _anti.GetTokens(HttpContext);

            // 2) Smaž starý cookie název (pokud existuje) – ať nám nevadí staré hodnoty
            Response.Cookies.Delete("XSRF-TOKEN");      // starý název (pro jistotu)
            Response.Cookies.Delete("XSRF-TOKEN-v2");   // případná předešlá verze

            // 3) Napiš náš "double-submit" cookie RUČNĚ
            Response.Cookies.Append("XSRF-TOKEN-v2", tokens.CookieToken!, new CookieOptions
            {
                HttpOnly   = false,
                Secure     = true,
                SameSite   = SameSiteMode.None,
                Path       = "/",
                IsEssential = true
            });

            // 4) Anticache
            Response.Headers.CacheControl = "no-store, must-revalidate";
            Response.Headers.Pragma = "no-cache";
            Response.Headers.Expires = "0";

            // 5) Vrať request token v JSON (to se dává do hlavičky X-CSRF-TOKEN)
            return Ok(new { csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ /api/csrf controller (manual) failed");
            return Problem("CSRF endpoint failed", statusCode: 500);
        }
    }
}
