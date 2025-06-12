/*  _____ _______         _                      _
 * |_   _|__   __|       | |                    | |
 *   | |    | |_ __   ___| |___      _____  _ __| | __  ___ ____
 *   | |    | | '_ \ / _ \ __\ \ /\ / / _ \| '__| |/ / / __|_  /
 *  _| |_   | | | | |  __/ |_ \ V  V / (_) | |  |   < | (__ / /
 * |_____|  |_|_| |_|\___|\__| \_/\_/ \___/|_|  |_|\_(_)___/___|
 *
 *                      ___ ___ ___
 *                     | . |  _| . |  LICENCE
 *                     |  _|_| |___|
 *                     |_|
 *
 *    REKVALIFIKAČNÍ KURZY  <>  PROGRAMOVÁNÍ  <>  IT KARIÉRA
 *
 * Tento zdrojový kód je součástí profesionálních IT kurzů na
 * WWW.ITNETWORK.CZ
 *
 * Kód spadá pod licenci PRO obsahu a vznikl díky podpoře
 * našich členů. Je určen pouze pro osobní užití a nesmí být šířen.
 * Více informací na http://www.itnetwork.cz/licence
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Invoices.Data.Models;

public class Person
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public ulong PersonId { get; set; }
    [Required]
    public string Name { get; set; } = "";
    [Required]
    public string IdentificationNumber { get; set; } = "";
    [Required]
    public string TaxNumber { get; set; } = "";
    [Required]
    public string AccountNumber { get; set; } = "";
    [Required]
    public string BankCode { get; set; } = "";
    [Required]
    public string Iban { get; set; } = "";
    [Required]
    public string Telephone { get; set; } = "";
    [Required]
    public string Mail { get; set; } = "";
    [Required]
    public string Street { get; set; } = "";
    [Required]
    public string Zip { get; set; } = "";
    [Required]
    public string City { get; set; } = "";
    [Required]
    public string Note { get; set; } = "";
    [Required]
    public Country Country { get; set; }
    [Required]
    public bool Hidden { get; set; } = false;
}