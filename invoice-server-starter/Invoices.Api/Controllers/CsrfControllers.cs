using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;

namespace Invoices.Api.Controllers;

[EnableCors("FeCors")]
[ApiController]
[Route("api/csrf")]
public class CsrfController : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetCsrf([FromServices] IAntiforgery anti)
    {
        // 🔑 nastaví správně cookie dle AddAntiforgery(options.Cookie...)
        var tokens = anti.GetAndStoreTokens(HttpContext);

        Response.Headers["Cache-Control"] = "no-store, no-cache";
        Response.Headers["Pragma"]        = "no-cache";
        Response.Headers["Expires"]       = "0";

        // název hlavičky máš "X-CSRF-TOKEN"
        return Ok(new { csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
    }
}
