using Invoices.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Invoices.Api.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Cors;
using Microsoft.Extensions.Options;
using Invoices.Api.Managers;

namespace Invoices.Api.Controllers
{
    
    [EnableCors("FeCors")]  
    [ApiController]
    [Route("api")]
    [Authorize(Policy = "BrowserOnly")]   // just cookie, no Bearer
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly IPersonManager _personManager;
        private readonly ILogger<AuthController> _logger;
        private readonly IJwtTokenManager _jwtTokenManager;

        public AuthController(
            IJwtTokenManager jwtTokenManager,
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            IPersonManager personManager,
            ILogger<AuthController> logger
        )
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _personManager = personManager;
            _logger = logger;
            _jwtTokenManager = jwtTokenManager;
        }

        /// <summary>
        /// Converting IdentityUser to UserDTO.
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        private async Task<UserDto> ConvertToUserDTO(IdentityUser user)
        {
            // Check if the user is in the Admin role and if so, set IsAdmin to true, otherwise false.
            bool isAdmin = await _userManager.IsInRoleAsync(user, UserRoles.Admin.ToString());

            return new UserDto
            {
                UserId = user.Id,
                Email = user.Email ?? throw new Exception("User email could't be found."),
                IsAdmin = isAdmin
            };
        }

        /// <summary>
        /// Authenticates a user and returns a UserDTO if successful.
        /// Endpoint: api/user
        /// </summary>
        /// <param name="registerDto"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        [AllowAnonymous]
        [HttpPost("user")]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterDto registerDto)
        {
            var newUser = new IdentityUser
            {
                UserName = registerDto.Mail,
                Email = registerDto.Mail
            };

            var result = await _userManager.CreateAsync(newUser, registerDto.Password);

            if (result.Succeeded)
            {
                // Najdi uživatele z DB
                var user = await _userManager.FindByEmailAsync(registerDto.Mail)
                           ?? throw new Exception("User could not be found after creation");

                // ➕ Vytvoř Person entitu
                var personDto = new PersonDto
                {
                    Mail = registerDto.Mail,
                    Name = registerDto.Name,
                    IdentificationNumber = registerDto.IdentificationNumber,
                    TaxNumber = registerDto.TaxNumber,
                    AccountNumber = registerDto.AccountNumber,
                    BankCode = registerDto.BankCode,
                    Iban = registerDto.Iban,
                    Telephone = registerDto.Telephone,
                    Street = registerDto.Street,
                    Zip = registerDto.Zip,
                    City = registerDto.City,
                    Note = registerDto.Note,
                    Country = registerDto.Country,
                    IdentityUserId = user.Id
                };

                // ➕ Přidej Person do DB    
                PersonDto? createdPerson = _personManager.AddPerson(personDto);

                var userDto = await ConvertToUserDTO(user);
                return Ok(userDto);
            }

            return BadRequest(result.Errors);
        }

        /// <summary>
        /// Authenticates a user and returns a JWT token if successful. 
        /// Also supports cookie-based authentication.
        /// Endpoint: api/auth
        /// </summary>
        /// <param name="authDto"></param>
        /// <param name="anti"></param>
        /// <param name="cfgOpt"></param>
        /// <param name="log"></param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPost("auth")]
        public async Task<IActionResult> Login(
            [FromBody] AuthDto authDto,
            [FromServices] IAntiforgery anti,
            [FromServices] IOptions<CookieSettings> cfgOpt,
            [FromServices] ILogger<AuthController> log)
        {
            var user = await _userManager.FindByEmailAsync(authDto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, authDto.Password))
                return Unauthorized();

            var roles   = await _userManager.GetRolesAsync(user);
            var cfg     = cfgOpt.Value;
            var useCookie = authDto.UseCookie ?? true;
            var enableCookieAuth = HttpContext.RequestServices
                .GetRequiredService<IConfiguration>()
                .GetSection("Security").GetValue("EnableCookieAuth", true);

            if (enableCookieAuth && useCookie)
            {
                var claims = new List<Claim> {
                    new(ClaimTypes.NameIdentifier, user.Id),
                    new(ClaimTypes.Email, user.Email!)
                };
                claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

                var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "AppCookie"));
                await HttpContext.SignInAsync("AppCookie", principal, new AuthenticationProperties { IsPersistent = true });

                // po loginu vydej nový CSRF
                var tokens = anti.GetAndStoreTokens(HttpContext);

                // (volitelně – explicitně zajisti správnou doménu)
                Response.Cookies.Append(cfg.XsrfCookieName ?? "XSRF-TOKEN-v2", tokens.RequestToken!, new CookieOptions {
                    Domain   = cfg.Domain,      // ProdSim: api.local.test
                    HttpOnly = false,
                    Secure   = true,
                    SameSite = SameSiteMode.None,
                    Path     = "/"
                });

                return Ok(new { ok = true, auth = "cookie", csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
            }

            // JWT pro Postman/integrace
            var token = _jwtTokenManager.CreateToken(user, roles);
            return Ok(new { token, auth = "jwt" });
        }


        /// <summary>
        /// Logs out the currently authenticated user.
        /// </summary>
        /// <returns></returns>
        [HttpDelete("auth")]
        public async Task<IActionResult> LogOutUser()
        {
            await HttpContext.SignOutAsync("AppCookie"); // cookie auth – deletes 'app_auth'

            await _signInManager.SignOutAsync(); // (optional) Identity sign-out

            return NoContent(); // 204 No Content = logout respond
        }

        /// <summary>
        /// Gets the currently authenticated user's information.
        /// </summary>
        /// <returns></returns>
        [Authorize(Policy = "BrowserOnly")]
        [HttpGet("auth")]
        public async Task<IActionResult> GetUserInfo()
        {
            IdentityUser? user = await _userManager.GetUserAsync(User);

            if (user is not null)
            {
                UserDto userDto = await ConvertToUserDTO(user);

                // (optional – for debug) user authentication tool (if jwt or cookie)
                Response.Headers["X-Auth-Scheme"] = User.Identity?.AuthenticationType ?? "";

                return Ok(userDto);
            }

            return NotFound();
        }
    }
}
