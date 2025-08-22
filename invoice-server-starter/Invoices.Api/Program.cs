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
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var logger = LoggerFactory
    .Create(builder => builder.AddConsole())
    .CreateLogger("Startup");

logger.LogInformation("🚀 Starting app...");

var builder = WebApplication.CreateBuilder(args);

// Configuration of cookie authentication and CSRF protection
var security = builder.Configuration.GetSection("Security");    // get the Security section from aspnet core configuration
bool enableCookieAuth = security.GetValue<bool>("EnableCookieAuth",true); // get EnableCookieAuth value, default to true if not set for cookie authentication
bool enableCsrfValidation = security.GetValue<bool>("EnableCsrfValidation",false); // get value and default to false if not set for CSRF protection
string[] feOrigins = security.GetSection("FeOrigins").Get<string[]>() ?? new[] 
{ 
    "http://localhost:3000", 
    "https://localhost:5173" 
}; // get FE origins from configuration, default to local dev servers for development

// Configuration of DB
var connectionString = builder.Configuration.GetConnectionString("AzureConnection"); // was .GetConnectionString("LocalInvoicesConnection")
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

// Configure Identity options with JWT token
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];

if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer))
{
    logger.LogInformation("❌ JWT config missing. Jwt:Key or Jwt:Issuer not defined.");
    throw new InvalidOperationException("JWT config missing.");
}

// Add Authentication (before AddIdentity or directly behind it)
builder.Services.AddAuthentication(options =>
{
    // options for JWT authentication (in Postman)
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false, 
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
        };
    })
    .AddCookie("AppCookie",opt =>
    {
        opt.Cookie.Name = "app_auth";
        opt.Cookie.HttpOnly = true;
        opt.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        opt.Cookie.SameSite = SameSiteMode.Lax; // or strict, beware of external redirects !
        opt.SlidingExpiration = true;
        opt.ExpireTimeSpan = TimeSpan.FromMinutes(30);
    });

// Antiforgery configuration for CSRF protection and CORS setup (under flag EnableCookieAuth)
var isDev = builder.Environment.IsDevelopment();
if (enableCookieAuth)
{
    builder.Services.AddAntiforgery(o =>
    {
        o.HeaderName = "X-CSRF-TOKEN";
        o.Cookie.Name = "XSRF-TOKEN";                 // readable cookie for FE (not HttpOnly)
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.Cookie.SecurePolicy = isDev 
        ? CookieSecurePolicy.SameAsRequest // for development FE use (HTTP)
        : CookieSecurePolicy.Always; // for peoduction use (HTTPS only)
    });

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins(feOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();               // for cookies
        });
    });
}
else
{
    // former (JWT only) CORS 
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins(
                "https://aspnetinvoicestarterproject-production-4f5c.up.railway.app",
                "http://localhost:3000",
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        });
    });
}



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

// Enable Antiforgery for CSRF protection and cookie auth
if (enableCookieAuth)
{
    // GET/HEAD: raise XSRF-TOKEN cookie
    app.Use(async (ctx, next) =>
    {
        var anti = ctx.RequestServices.GetRequiredService<IAntiforgery>();
        if (HttpMethods.IsGet(ctx.Request.Method) || HttpMethods.IsHead(ctx.Request.Method))
            anti.GetAndStoreTokens(ctx);
        await next();
    });

    // validate CSRF (only when flag on)
    if (enableCsrfValidation)
    {
        app.Use(async (ctx, next) =>
        {
            if (HttpMethods.IsPost(ctx.Request.Method) ||
                HttpMethods.IsPut(ctx.Request.Method) ||
                HttpMethods.IsPatch(ctx.Request.Method) ||
                HttpMethods.IsDelete(ctx.Request.Method))
            {
                var anti = ctx.RequestServices.GetRequiredService<IAntiforgery>();
                await anti.ValidateRequestAsync(ctx);
            }
            await next();
        });
    }
}

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
app.MapGet("/", () => Results.Ok(new { server_started = true })); // root endpoint

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