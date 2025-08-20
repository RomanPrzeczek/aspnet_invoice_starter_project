using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Invoices.Api;
using Invoices.Data;

namespace Invoices.Tests.Integration;

public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test"); // přehledné v logu i pro podmínky v Program.cs
        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<InvoicesDbContext>));
            services.AddDbContext<InvoicesDbContext>(o => o.UseInMemoryDatabase("Invoices_TestDb"));
        });
    }
}
