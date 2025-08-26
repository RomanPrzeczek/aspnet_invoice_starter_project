using Invoices.Api.Models;
using Invoices.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Invoices.Api.Interfaces;
using Invoices.Api.Managers;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication;

namespace Invoices.Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly IPersonManager _personManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IJwtTokenManager _jwtTokenManager;

        public AuthController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IPersonManager personManager, IConfiguration configuration, ILogger<AuthController> logger, IJwtTokenManager jwtTokenManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _personManager = personManager;
            _configuration = configuration;
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
        /// Authenticates a user and returns a UserDTO if successful.
        /// </summary>
        /// <param name="authDto"></param>
        /// <returns></returns>
        [HttpPost("auth")]
        public async Task<IActionResult> Login([FromBody] AuthDto authDto)
        {
            Console.WriteLine("👉 Login endpoint triggered.");

            try
            {
                var user = await _userManager.FindByEmailAsync(authDto.Email);
                if (user == null || !await _userManager.CheckPasswordAsync(user, authDto.Password))
                {
                    return Unauthorized();
                }

                // 🛡 inactive person checking
                var isAdmin = await _userManager.IsInRoleAsync(user, UserRoles.Admin);
                if (!isAdmin && !_personManager.HasActivePerson(user.Id))
                {
                    return Unauthorized("Account deactivated.");
                }

                var roles = await _userManager.GetRolesAsync(user);

                // cookie login, if active and FE requested (production mode)
                var enableCookieAuth = HttpContext.RequestServices
                    .GetRequiredService<IConfiguration>()
                    .GetSection("Security").GetValue("EnableCookieAuth", true); // taken from Azure ENV (prod-mode) or appsettings.json (debug mode)

                Console.WriteLine($"EnableCookieAuth={enableCookieAuth}, UseCookie={authDto.UseCookie}");
                Console.WriteLine("🍪 Taking cookie branch");

                if (enableCookieAuth && authDto.UseCookie == true)
                {
                    var claims = new List<Claim> // sets claims (e.g. user id, email)
                    {
                        new(ClaimTypes.NameIdentifier, user.Id),
                        new(ClaimTypes.Email, user.Email!)
                    };

                    claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r))); // add roles to claims

                    var identity = new ClaimsIdentity(claims, "AppCookie"); // create identity with claims for cookie auth
                    await HttpContext.SignInAsync("AppCookie", new ClaimsPrincipal(identity));

                    return Ok(new { ok = true, auth = "cookie" });
                }

                // JWT variant for debugging in Postman
                var token = _jwtTokenManager.CreateToken(user, roles);

                return Ok(new { token, auth = "jwt" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Login error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw;
            }
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
