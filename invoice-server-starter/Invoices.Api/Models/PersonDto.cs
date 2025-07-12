using Invoices.Data.Models;
using System.Text.Json.Serialization;

namespace Invoices.Api.Models;

public class PersonDto
{
    [JsonPropertyName("_id")]
    public ulong PersonId { get; set; }
    public string Name { get; set; } = "";
    public string IdentificationNumber { get; set; } = "";
    public string TaxNumber { get; set; } = "";
    public string AccountNumber { get; set; } = "";
    public string BankCode { get; set; } = "";
    public string Iban { get; set; } = "";
    public string Telephone { get; set; } = "";
    public string Mail { get; set; } = "";
    public string Street { get; set; } = "";
    public string Zip { get; set; } = "";
    public string City { get; set; } = "";
    public string Note { get; set; } = "";
    public Country Country { get; set; }
    public string? IdentityUserId { get; set; } = null;
}