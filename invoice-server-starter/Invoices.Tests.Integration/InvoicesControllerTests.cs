using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit; 

namespace Invoices.Tests.Integration;

public class InvoicesControllerTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;

    public InvoicesControllerTests(ApiFactory factory)
    {
        // vytvoří klienta, který běží proti celé aplikaci
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task GET_Invoices_Should_Return_OK_And_Json()
    {
        // Act
        var res = await _client.GetAsync("/api/invoices?limit=1");

        // Assert
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        res.Content.Headers.ContentType!.MediaType.Should().Be("application/json");
    }
}