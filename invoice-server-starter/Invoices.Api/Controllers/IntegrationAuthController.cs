using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Invoices.Api.Interfaces;

namespace Invoices.Api.Controllers
{
    [ApiController]
    [Route("api/integrations/[controller]")]
    [EnableCors("IntegrationsCors")]
    [ApiExplorerSettings(GroupName = "integrations")]
    public class IntegrationAuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IJwtTokenManager _jwtTokenManager;
        public IntegrationAuthController(UserManager<IdentityUser> userManager, IJwtTokenManager jwtTokenManager)
        {
            _userManager = userManager;
            _jwtTokenManager = jwtTokenManager;
        }

        public record AuthJwtDto
        {
            public string Email { get; set; } = "";
            public string Password { get; set; } = "";
        }

        // JWT only – no cookies - only for debugging in Postman, not for FE
        [HttpPost("token")]
        [AllowAnonymous]
        public async Task<IActionResult> IssueToken([FromBody] AuthJwtDto dto)
        {
            var u = await  _userManager.FindByEmailAsync(dto.Email);
            if (u is null || !await _userManager.CheckPasswordAsync(u, dto.Password))
                return Unauthorized();

            var roles = await _userManager.GetRolesAsync(u);
            
            // aud differs acc. integration:
            var token = _jwtTokenManager.CreateToken(u, roles, audience: "integrations", lifetime: TimeSpan.FromHours(1));
            
            return Ok(new { token, auth = "jwt" });
        }
    }
}
