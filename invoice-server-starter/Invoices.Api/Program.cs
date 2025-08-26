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
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Options;

var logger = LoggerFactory
    .Create(builder => builder.AddConsole())
    .CreateLogger("Startup");

logger.LogInformation("🚀 Starting app...");

var builder = WebApplication.CreateBuilder(args);

// Configuration of cookie authentication and CSRF protection
var security = builder.Configuration.GetSection("Security");    // get the Security section from aspnet core configuration
bool enableCookieAuth = security.GetValue<bool>("EnableCookieAuth",true); // get EnableCookieAuth value, default to true if not set for cookie authentication
bool enableCsrfValidation = security.GetValue<bool>("EnableCsrfValidation",false); // get value and default to false if not set for CSRF protection

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
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("browser", new() { Title = "Invoices – Browser", Version = "v1" });
    c.SwaggerDoc("integrations", new() { Title = "Invoices – Integrations", Version = "v1" });
    c.DocInclusionPredicate((doc, desc) => desc.GroupName == doc);
});

// Repositories registration
builder.Services.AddScoped<IPersonRepository, PersonRepository>(); 
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();

// Managers registration
builder.Services.AddScoped<IPersonManager, PersonManager>();
builder.Services.AddScoped<IInvoiceManager,InvoiceManager>();
builder.Services.AddScoped<IJwtTokenManager, JwtTokenManager>();

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
    });

if (enableCookieAuth)
{
    builder.Services.AddAuthentication()
        .AddCookie("AppCookie", opt =>
        {
            opt.Cookie.Name = "app_auth";
            opt.Cookie.HttpOnly = true;
            opt.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            opt.Cookie.SameSite = SameSiteMode.None; // or strict, beware of external redirects !
            opt.SlidingExpiration = true;
            opt.ExpireTimeSpan = TimeSpan.FromDays(7);

            // API chování: žádné redirecty, ale 401/403
            opt.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; },
                OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; }
            };
        });
}

// Adding Authorization policies to distinguish between JWT and Cookie auth, farther in controllers (JWT only for debugging)
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("BrowserOnly", p => p
        .AddAuthenticationSchemes("AppCookie")
        .RequireAuthenticatedUser());

    o.AddPolicy("JwtOnly", p => p
        .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
        .RequireAuthenticatedUser());

    o.AddPolicy("AdminOnly", p => p
    .AddAuthenticationSchemes("AppCookie")
    .RequireRole("Admin"));
});

var isDev = builder.Environment.IsDevelopment();

// Antiforgery – jen registrace pro F1 (validaci zapneme ve F3)
if (enableCookieAuth)
{
    builder.Services.AddAntiforgery(o =>
    {
        o.HeaderName = "X-CSRF-TOKEN";
        o.Cookie.Name = "XSRF-TOKEN";
        o.Cookie.HttpOnly = false; // FE musí cookie přečíst (double-submit pattern ve F3)
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.Cookie.SecurePolicy = isDev
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
    });
}

// CORS – dvě pojmenované policy
var feOrigins = builder.Configuration.GetSection("Cors:FeOrigins").Get<string[]>()
                ?? new[] {
                    "https://aspnetinvoicestarterproject-production-4f5c.up.railway.app",
                    "http://localhost:3000",
                    "https://localhost:5173"
                };

builder.Services.AddCors(options =>
{
    // FE (browser, cookies)
    options.AddPolicy("FeCors", p => p
        .WithOrigins(feOrigins)       // nutně přesné originy (scheme + port)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());         // kvůli cookies

    // Integrace (JWT, žádné cookies)
    options.AddPolicy("IntegrationsCors", p => p
        .AllowAnyOrigin()             // nebo konkrétní seznam, ale bez credentials
        .AllowAnyHeader()
        .AllowAnyMethod());
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
app.UseCors("FeCors"); // Enable CORS (cookie variant) for the application

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
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/swagger/browser/swagger.json", "Invoices – Browser");
        o.SwaggerEndpoint("/swagger/integrations/swagger.json", "Invoices – Integrations");
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