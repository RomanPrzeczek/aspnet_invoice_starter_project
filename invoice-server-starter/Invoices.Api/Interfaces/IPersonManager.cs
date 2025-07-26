using Invoices.Api.Models;

namespace Invoices.Api.Interfaces;

public interface IPersonManager
{
    IList<PersonDto> GetAllPersons();
    PersonDto AddPerson(PersonDto personDto);
    void DeletePerson(uint personId);
    PersonDto? GetPerson(ulong id);
    PersonDto? UpdatePerson(uint personId, PersonDto personDto);
    IEnumerable<object> GetPersonStatistics();
    bool HasActivePerson(string identityUserId);
}