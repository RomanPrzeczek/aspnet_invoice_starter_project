using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Invoices.Api.Controllers;

[ApiController]
[Route("api/csrf")]
public class CsrfController : ControllerBase
{
    private readonly IAntiforgery _anti;
    private readonly ILogger<CsrfController> _log;

    public CsrfController(IAntiforgery anti, ILogger<CsrfController> log)
    {
        _anti = anti; _log = log;
    }

    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult GetCsrf()
    {
        var tokens = _anti.GetAndStoreTokens(HttpContext); // ⬅️ cookie nastaví framework sám
        // pro FE vrátíme název hlavičky + request token
        return Ok(new { csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
    }
}