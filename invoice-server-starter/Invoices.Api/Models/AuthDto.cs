using System.ComponentModel.DataAnnotations;

namespace Invoices.Api.Models
{
    public class AuthDto
    {
        [EmailAddress]
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";

        public bool? UseCookie { get; set; }
    }
}
