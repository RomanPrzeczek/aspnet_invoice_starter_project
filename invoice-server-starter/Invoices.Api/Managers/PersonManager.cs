using AutoMapper;
using Invoices.Api.Interfaces;
using Invoices.Api.Models;
using Invoices.Data.Interfaces;
using Invoices.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Invoices.Api.Managers;

public class PersonManager : IPersonManager
{
    private readonly IPersonRepository personRepository;
    private readonly IInvoiceRepository invoiceRepository;
    private readonly IMapper mapper;


    public PersonManager(IPersonRepository personRepository, IInvoiceRepository invoiceRepository,IMapper mapper)
    {
        this.personRepository = personRepository;
        this.invoiceRepository = invoiceRepository;
        this.mapper = mapper;
    }


    public IList<PersonDto> GetAllPersons()
    {
        IList<Person> persons = personRepository.GetAllByHidden(false);
        return mapper.Map<IList<PersonDto>>(persons);
    }

    public PersonDto? GetPerson(ulong id)
    {
        Person? person = personRepository.FindById(id);

        if (person == null)
        {
            return null;
        }

        return mapper.Map<PersonDto>(person);
    }

    public PersonDto AddPerson(PersonDto personDto)
    {
        Person person = mapper.Map<Person>(personDto);
        person.PersonId = default;
        Person addedPerson = personRepository.Insert(person);

        return mapper.Map<PersonDto>(addedPerson);
    }

    public void DeletePerson(uint personId)
    {
        HidePerson(personId);
    }

    private Person? HidePerson(uint personId)
    {
        Person? person = personRepository.FindById(personId);

        if (person is null)
            return null;

        person.Hidden = true;
        return personRepository.Update(person);
    }

    public PersonDto? UpdatePerson(uint personId, PersonDto personDto)
    {
        if (!personRepository.ExistsWithId(personId))
            return null;

        HidePerson(personId); // Hide the existing person

        //return mapper.Map<PersonDto>(updatedPerson);
        return AddPerson(personDto); // Use AddPerson to return the DTO with the new ID
    }

    public IEnumerable<object> GetPersonStatistics()
    {
        var persons = personRepository.GetQueryable(false).ToList();
        //var persons = (personRepository.GetQueryable(false) ?? Enumerable.Empty<Person>()).ToList();
        var invoices = invoiceRepository.GetQueryable().ToList();

        var result = persons.Select(p => new
        {
            personId = p.PersonId,
            personName = p.Name,
            revenue = invoices
                .Where(i => i.BuyerId == p.PersonId)
                .Sum(i => i.Price)
        });

        return result;
    }

    public bool HasActivePerson(string identityUserId)
    {
        return GetAllPersons()
            .Any(p => p.IdentityUserId == identityUserId);
    }
}