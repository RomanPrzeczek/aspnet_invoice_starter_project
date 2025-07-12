using Invoices.Api.Interfaces;
using Invoices.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Invoices.Api.Controllers;

[Route("api")]
[ApiController]
public class PersonsController : ControllerBase
{
    private readonly IPersonManager personManager;
    private readonly ILogger<PersonsController> logger;


    public PersonsController(IPersonManager personManager, ILogger<PersonsController> logger)
    {
        this.personManager = personManager;
        this.logger = logger;
    }


    [HttpGet("persons")]
    public IEnumerable<PersonDto> GetPersons()
    {
        return personManager.GetAllPersons();
    }

    [HttpGet("persons/{personId}")]
    public IActionResult GetPerson(ulong personId)
    {
        PersonDto? person = personManager.GetPerson(personId);

        if (person is null)
        {
            return NotFound();
        }

        return Ok(person);
    }

    [HttpGet("persons/statistics")]
    public object GetPersonsStatistics()
    {
        var statistics = personManager.GetPersonStatistics();

        return Ok(statistics);
    }

/*    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("persons")]
    public IActionResult AddPerson([FromBody] PersonDto person)
    {
        PersonDto? createdPerson = personManager.AddPerson(person);
        return StatusCode(StatusCodes.Status201Created, createdPerson);
    }
*/


    [Authorize]
    [HttpPost("persons")]
    public async Task<IActionResult> AddPerson([FromBody] PersonDto personDto, [FromServices] UserManager<IdentityUser> userManager)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        personDto.IdentityUserId = user.Id;

        var result = personManager.AddPerson(personDto);
        return Ok(result);
    }



    [Authorize]
    [HttpDelete("persons/{personId}")]
    public async Task<IActionResult>DeletePerson(uint personId, [FromServices] UserManager<IdentityUser> userManager)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        PersonDto? person = personManager.GetPerson(personId);
        if (person == null) return NotFound();

        if (!User.IsInRole(UserRoles.Admin) && person.IdentityUserId != user.Id)
        {
            return Forbid();
        }

        personManager.DeletePerson(personId);
        return NoContent();
    }

    [Authorize]
    [HttpPut("persons/{id}")]
    public async Task<IActionResult> UpdatePerson(
        uint id,
        [FromBody] PersonDto personDto,
        [FromServices] UserManager<IdentityUser> userManager)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var existingPerson = personManager.GetPerson(id);
        if (existingPerson == null)
            return NotFound();

        /*        if (!User.IsInRole(UserRoles.Admin) && existingPerson.IdentityUserId != user.Id)
                    return Forbid();
        */

        if (User.IsInRole(UserRoles.Admin) || existingPerson.IdentityUserId == user.Id)
        {
            personDto.IdentityUserId = user.Id;

            var updatedDto = personManager.UpdatePerson(id, personDto);
            if (updatedDto == null)
                return BadRequest("Update failed.");

            return Ok(updatedDto);
        }
        else return Forbid();
    }
}