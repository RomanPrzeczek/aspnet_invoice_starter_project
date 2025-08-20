namespace Invoices.Tests.Unit;

using AutoMapper;
using FluentAssertions;
using Invoices.Api; // namespace with AutomapperConfigurationProfile

public class MappingTests
{
    [Fact]
    public void Automapper_Configuration_Is_Valid()
    {
        // Arrange: creates config, adds all profiles
        var cfg = new MapperConfiguration(c =>
        {
            c.AddProfile<AutomapperConfigurationProfile>();
        });

        // Act + Assert: AutoMapper checks, if all mapas are correct
        cfg.AssertConfigurationIsValid();
    }
}


