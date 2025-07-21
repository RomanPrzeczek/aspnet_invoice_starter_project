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

logger.LogInformation("🚀 Spouštím aplikaci...");

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

foreach (var kv in builder.Configuration.AsEnumerable())
{
    logger.LogInformation($"{kv.Key} = {kv.Value}");
}

if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer))
{
    logger.LogInformation("❌ JWT konfigurace chybí. Jwt:Key nebo Jwt:Issuer nejsou definovány.");
    throw new InvalidOperationException("JWT konfigurace chybí.");
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
    logger.LogInformation("✅ Databáze načtena: " + dbContext.Database.GetConnectionString());
    var canConnect = await dbContext.Database.CanConnectAsync();
    logger.LogInformation($"🧪 Can connect to DB: {canConnect}");
}

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        logger.LogInformation($"❌ Výjimka za běhu: {ex.Message}");
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

app.MapGet("/", () => "Server runs.");

/// <summary>
/// Calls the helper CreateAllRoles below to create all roles defined in UserRoles class.
/// </summary>
using (var scope = app.Services.CreateScope())
{
    RoleManager<IdentityRole> roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    // await CreateAllRoles(roleManager);
}

logger.LogInformation("✅ Aplikace se spouští...");

try
{
    app.Run();
}
catch (Exception ex)
{
    logger.LogInformation($"❌ CHYBA při startu aplikace: {ex.Message}");
    logger.LogInformation(ex.StackTrace);
    throw; // důležité pro Azure, aby vrátil 500
}

/// <summary>
/// Helper method to create all roles defined in UserRoles class.
/// </summary>
async Task CreateAllRoles(RoleManager<IdentityRole> roleManager)
{
    FieldInfo[] constants = typeof(UserRoles)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(fieldInfo => fieldInfo.IsLiteral
            && !fieldInfo.IsInitOnly
            && fieldInfo.FieldType == typeof(string))
        .ToArray();

    string[] roles = constants
        .Select(fieldInfo => fieldInfo.GetRawConstantValue())
        .OfType<string>()
        .ToArray();

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }
}