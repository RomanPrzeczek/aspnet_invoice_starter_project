using Invoices.Api.Models;
using Invoices.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Invoices.Api.Interfaces;
using Invoices.Api.Managers;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Logging;

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

        public AuthController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IPersonManager personManager, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _personManager = personManager;
            _configuration = configuration;
            _logger = logger;
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
        /// <param name="authDto"></param>
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
        /// Cookies variant of the endpoint.
        /*        public async Task<IActionResult> LogInUser(AuthDto authDto)
                {
                    IdentityUser? user = await _userManager.FindByEmailAsync(authDto.Email); // find user by email

                    if (user is null)
                        return NotFound();

                    Microsoft.AspNetCore.Identity.SignInResult result =
                        await _signInManager.PasswordSignInAsync(user, authDto.Password, true, false); // attempt to sign in the user with the provided password

                    if (result.Succeeded)
                    {
                        UserDto userDto = await ConvertToUserDTO(user); // convert IdentityUser to UserDTO
                        return Ok(userDto); // return the UserDTO
                    }

                    return BadRequest(); // if sign-in failed, return a bad request
                }*/

        ///JWT authentication endpoint for user login.
        public async Task<IActionResult> Login([FromBody] AuthDto authDto)
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
                return Unauthorized("Účet byl deaktivován.");
            }


            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return Ok(new { token });
        }


        /// <summary>
        /// Logs out the currently authenticated user.
        /// </summary>
        /// <returns></returns>
        [HttpDelete("auth")]
        public async Task<IActionResult> LogOutUser()
        {
            await _signInManager.SignOutAsync();

            return Ok(new { });
        }

        /// <summary>
        /// Gets the currently authenticated user's information.
        /// </summary>
        /// <returns></returns>
        [Authorize]
        [HttpGet("auth")]
        public async Task<IActionResult> GetUserInfo()
        {
            IdentityUser? user = await _userManager.GetUserAsync(User);

            if (user is not null)
            {
                UserDto userDto = await ConvertToUserDTO(user);
                return Ok(userDto);
            }

            return NotFound();
        }

        /// <summary>
        /// JWT authentication.
        /// </summary>
        /// 
        private string GenerateJwtToken(IdentityUser user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName!)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Checks if the user is logged in and returns their information.
        /// </summary>
        /// <param name="userManager"></param>
        /// <returns></returns>
        [Authorize]
        [HttpGet("isLogged")]
        public async Task<IActionResult> GetCurrentUser([FromServices] UserManager<IdentityUser> userManager)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null)
            {
                _logger.LogWarning("An unauthorized attempt to access /api/auth/isLogged.");
                return Unauthorized(); 
            }

            // Získání role (nepovinné, ale užitečné)
            var roles = await userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Id,
                user.Email,
                user.UserName,
                Roles = roles
            });
        }
    }
}
