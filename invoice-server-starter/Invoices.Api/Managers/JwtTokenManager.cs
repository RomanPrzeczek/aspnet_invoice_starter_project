using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Invoices.Api.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Invoices.Api.Managers
{
    public sealed class JwtTokenManager : IJwtTokenManager
    {
        private readonly IConfiguration _cfg;

        public JwtTokenManager(IConfiguration cfg) => _cfg = cfg;

        public string CreateToken(IdentityUser user, IList<string> roles, string? audience = null, TimeSpan? lifetime = null)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? user.Email ?? string.Empty)
            };

            foreach (var r in roles)
                claims.Add(new Claim(ClaimTypes.Role, r));

            // klíč a issuer z appsettings / ENV
            var keyBytes = Encoding.UTF8.GetBytes(_cfg["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key missing"));
            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _cfg["Jwt:Issuer"],
                audience: audience ?? _cfg["Jwt:Audience"], // může být null, pokud audience zatím nevaliduješ
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.Add(lifetime ?? TimeSpan.FromHours(1)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}