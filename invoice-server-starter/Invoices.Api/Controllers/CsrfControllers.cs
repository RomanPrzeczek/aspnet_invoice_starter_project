using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Invoices.Api.Controllers;

[ApiController]
[Route("api")]
public class CsrfController : ControllerBase
{
    private readonly ILogger<CsrfController> _logger;
    public CsrfController(ILogger<CsrfController> logger) => _logger = logger;

    [HttpGet("csrf")]
    [AllowAnonymous]
    // public IActionResult GetCsrf()
    // {
    //     try
    //     {
    //         // Resolve až TADY (kdyby DI nebylo, odchytíme a zalogujeme)
    //         var anti = HttpContext.RequestServices.GetService<IAntiforgery>();
    //         if (anti == null)
    //         {
    //             _logger.LogError("IAntiforgery service not available (GetService returned null).");
    //             return Problem("Antiforgery service missing", statusCode: 500);
    //         }

    //         // Vygeneruj tokeny (bez automatického zápisu cookie)
    //         var tokens = anti.GetTokens(HttpContext);

    //         // Smaž staré cookie názvy (pro jistotu) a zapiš náš „double-submit“ cookie
    //         Response.Cookies.Delete("XSRF-TOKEN");
    //         Response.Cookies.Delete("XSRF-TOKEN-v2");

    //         Response.Cookies.Append("XSRF-TOKEN-v2", tokens.CookieToken!, new CookieOptions
    //         {
    //             HttpOnly = false,
    //             Secure = true,
    //             SameSite = SameSiteMode.None,
    //             Path = "/",
    //             IsEssential = true
    //         });

    //         Response.Headers.CacheControl = "no-store, must-revalidate";
    //         Response.Headers.Pragma = "no-cache";
    //         Response.Headers.Expires = "0";

    //         return Ok(new { csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "❌ /api/csrf controller (manual) failed");
    //         return Problem("CSRF endpoint failed", statusCode: 500);
    //     }
    // }

    public IActionResult Probe()
{
    return Ok(new { ok = true, ts = DateTime.UtcNow });
}
}
