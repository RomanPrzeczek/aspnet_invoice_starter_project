using Invoices.Api;
using Invoices.Api.Interfaces;
using Invoices.Api.Managers;
using Invoices.Data;
using Invoices.Data.Interfaces;
using Invoices.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.OpenApi.Models;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var logger = LoggerFactory
    .Create(builder => builder.AddConsole())
    .CreateLogger("Startup");

logger.LogInformation("🚀 Starting app...");

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("AzureConnection"); // was .GetConnectionString("LocalInvoicesConnection")

// Configuration of DB
builder.Services.AddDbContext<InvoicesDbContext>(options =>
    options.UseSqlServer(connectionString)
        .UseLazyLoadingProxies()
        .ConfigureWarnings(x => x.Ignore(CoreEventId.LazyLoadOnDisposedContextWarning)));

// Adding converter of C# data to JSON format for need of JS FE
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Discovers the API endpoints and their metadata for use in Swagger generation
builder.Services.AddEndpointsApiExplorer();

// Swagger configuration
builder.Services.AddSwaggerGen(options =>
    options.SwaggerDoc("invoices", new OpenApiInfo
    {
        Version = "v1",
        Title = "Invoices"
    }));

// Repositories registration
builder.Services.AddScoped<IPersonRepository, PersonRepository>(); 
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();

// Managers registration
builder.Services.AddScoped<IPersonManager, PersonManager>();
builder.Services.AddScoped<IInvoiceManager,InvoiceManager>();

// Automapper registration
builder.Services.AddAutoMapper(typeof(AutomapperConfigurationProfile));

// Registering Identity for authentication
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<InvoicesDbContext>(); // using EF Core for Identity storage

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];

//foreach (var kv in builder.Configuration.AsEnumerable())
//{
//    logger.LogInformation($"{kv.Key} = {kv.Value}");
//}

if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer))
{
    logger.LogInformation("❌ JWT cinfig missing. Jwt:Key or Jwt:Issuer not defined.");
    throw new InvalidOperationException("JWT config missing.");
}

// Add Authentication (před AddIdentity, nebo hned za tím)
builder.Services.AddAuthentication(options =>
{
    /*    // options for cookie authentication
        options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
        options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
        options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
    */

    // options for JWT authentication (in Postman)
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false, // nebo true + nastav Audience
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
        };
    });

// Configure the application cookie to return 401 Unauthorized instead of redirecting to login page in case of access denied or unauthorized requests
/*builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
});
*/

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "https://aspnetinvoicestarterproject-production-4f5c.up.railway.app", // Railway production server
            "http://localhost:3000", // React Vite server for production settings test
            "https://localhost:5173" // React Vite development server
            )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


var app = builder.Build();

// debugging
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<InvoicesDbContext>();

    if (dbContext.Database.IsRelational())
    {
        // Relational DB (SQL Server/Postgres…)
        logger.LogInformation("✅ DB loaded ");
        var canConnect = await dbContext.Database.CanConnectAsync();
        logger.LogInformation($"🧪 Can connect to DB: {canConnect}");

        // (volitelně) migrace jen pro relační provider
        // await dbContext.Database.MigrateAsync();
    }
    else
    {
        // InMemory / test – nic relačního zde nevolat
        logger.LogInformation("ℹ️ Non-relational provider (InMemory) – skipping connection checks.");
        await dbContext.Database.EnsureCreatedAsync();
    }
}


app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        logger.LogInformation($"❌ Runtime exception: {ex.Message}");
        logger.LogInformation(ex.StackTrace);
        throw;
    }
});


// Configure the HTTP request pipeline for the authentication and authorization
app.UseCors(); // Enable CORS for the application
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("invoices/swagger.json", "Invoices - v1");
    });
}

app.MapGet("/health", () => Results.Ok(new { status = "ok - server runs" })); // Health check endpoint

using (var scope = app.Services.CreateScope())
{
    RoleManager<IdentityRole> roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
}

logger.LogInformation("✅ App is starting...");

try
{
    app.Run();
}
catch (Exception ex)
{
    logger.LogInformation($"❌ Error by app start: {ex.Message}");
    logger.LogInformation(ex.StackTrace);
    throw; // důležité pro Azure, aby vrátil 500
}

public  partial class Program{} // supports WebApplicationFactory find the entry point for integration tests