using System.Text.Json.Serialization;

namespace Invoices.Api.Models
{
    public class UserDto
    {
        [JsonPropertyName("_id")]
        public string UserId { get; set; } = "";
        public string Email { get; set; } = "";
        public bool IsAdmin { get; set; }
    }
}
