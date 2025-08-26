using Microsoft.AspNetCore.Identity;

namespace Invoices.Api.Interfaces
{
    public interface IJwtTokenManager
    {
        /// <summary>
        /// Generates JWT for specific user and role.
        /// </summary>
        /// <param name="user">Identity user</param>
        /// <param name="roles">Role uživatele</param>
        /// <param name="audience">Volitelně aud (např. "integrations")</param>
        /// <param name="lifetime">Volitelně doba platnosti (default 1h)</param>
        string CreateToken(IdentityUser user, IList<string> roles, string? audience = null, TimeSpan? lifetime = null);
    }
}