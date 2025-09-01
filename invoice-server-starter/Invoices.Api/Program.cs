using Invoices.Api;
using Invoices.Api.Interfaces;
using Invoices.Api.Managers;
using Invoices.Data;
using Invoices.Data.Interfaces;
using Invoices.Data.Repositories;

using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using System;
using System.Text;
using System.Text.Json.Serialization;
using System.IO;

var logger = LoggerFactory
    .Create(b => b.AddConsole())
    .CreateLogger("Startup");

logger.LogInformation("🚀 Starting app...");

var builder = WebApplication.CreateBuilder(args);
var isDev   = builder.Environment.IsDevelopment();

// === Security flags (appsettings / Azure App Settings) ===
var security = builder.Configuration.GetSection("Security");
bool enableCookieAuth     = security.GetValue("EnableCookieAuth",     true);
bool enableCsrfValidation = security.GetValue("EnableCsrfValidation", false);
logger.LogInformation("Flags at runtime: EnableCookieAuth={EnableCookieAuth}, EnableCsrfValidation={EnableCsrfValidation}", enableCookieAuth, enableCsrfValidation);

// === DB ===
var connectionString = builder.Configuration.GetConnectionString("AzureConnection");
builder.Services.AddDbContext<InvoicesDbContext>(opt =>
    opt.UseSqlServer(connectionString)
       .UseLazyLoadingProxies()
       .ConfigureWarnings(x => x.Ignore(CoreEventId.LazyLoadOnDisposedContextWarning)));

// === MVC + JSON ===
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

// === Swagger ===
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("browser",      new() { Title = "Invoices – Browser",      Version = "v1" });
    c.SwaggerDoc("integrations", new() { Title = "Invoices – Integrations", Version = "v1" });
    c.DocInclusionPredicate((doc, desc) => desc.GroupName == doc);
});

// === Repositories & Managers ===
builder.Services.AddScoped<IPersonRepository, PersonRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IPersonManager,  PersonManager>();
builder.Services.AddScoped<IInvoiceManager, InvoiceManager>();
builder.Services.AddScoped<IJwtTokenManager, JwtTokenManager>();

// === AutoMapper ===
builder.Services.AddAutoMapper(typeof(AutomapperConfigurationProfile));

// === Identity ===
builder.Services.AddIdentity<IdentityUser, IdentityRole>(o =>
{
    o.Password.RequiredLength = 8;
    o.Password.RequireNonAlphanumeric = false;
    o.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<InvoicesDbContext>();

// === JWT (pro Postman/integrace) ===
var jwtKey    = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer))
{
    logger.LogInformation("❌ JWT config missing. Jwt:Key or Jwt:Issuer not defined.");
    throw new InvalidOperationException("JWT config missing.");
}

builder.Services.AddAuthentication(o =>
{
    // Defaulty necháme na JWT (integrace). FE endpointy hlídej přes Authorize(Policy="BrowserOnly").
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = false,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtIssuer,
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
    };
});

// === Cookie auth (pro prohlížeč) ===
if (enableCookieAuth)
{
    builder.Services.AddAuthentication()
        .AddCookie("AppCookie", opt =>
        {
            opt.Cookie.Name        = "app_auth";
            opt.Cookie.HttpOnly    = true;
            opt.Cookie.SecurePolicy= CookieSecurePolicy.Always;
            opt.Cookie.SameSite    = SameSiteMode.None; // FE na jiné doméně
            opt.SlidingExpiration  = true;
            opt.ExpireTimeSpan     = TimeSpan.FromDays(7);

            // API chování: žádné redirecty, ale 401/403
            opt.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin        = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; },
                OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; }
            };
        });
}

// === Authorization policies ===
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

// === Data Protection (perzistentní klíče – důležité pro antiforgery na Azure) ===
// *** NEW: možnost řídit přes App Setting DP_KEYS_PATH + rozbalení %HOME%
var configuredDpPath = builder.Configuration["DP_KEYS_PATH"];
if (!string.IsNullOrWhiteSpace(configuredDpPath))
{
    configuredDpPath = Environment.ExpandEnvironmentVariables(configuredDpPath);
}

string? home = Environment.GetEnvironmentVariable("HOME"); // Azure App Service: D:\home (Windows) /home (Linux)

// *** CHANGED: bezpečný výběr cesty – preferuj DP_KEYS_PATH, jinak %HOME%\dp-keys, jinak temp
var keysPath = !string.IsNullOrWhiteSpace(configuredDpPath)
    ? configuredDpPath
    : !string.IsNullOrWhiteSpace(home)
        ? Path.Combine(home, "dp-keys")
        : Path.Combine(Path.GetTempPath(), "dp-keys"); // fallback

try
{
    Directory.CreateDirectory(keysPath);
    logger.LogInformation("🔐 DataProtection keys path: {Path}", keysPath);
}
catch (Exception ex)
{
    logger.LogError(ex, "❌ Cannot create DP keys directory at {Path}", keysPath);
    throw;
}

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
    .SetApplicationName("InvoiceApi");

// === Antiforgery: REGISTRACE VŽDY (validaci řídíme flagem níže) ===
builder.Services.AddAntiforgery(o =>
{
    o.HeaderName        = "X-CSRF-TOKEN";
    o.Cookie.Name       = "XSRF-TOKEN";
    o.Cookie.HttpOnly   = false; // token bereme z JSON /api/csrf; cookie je pro double-submit pattern
    o.Cookie.SameSite   = isDev ? SameSiteMode.Lax : SameSiteMode.None;
    o.Cookie.SecurePolicy = isDev ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
});

// === CORS (FE s cookies) ===
var feOrigins = builder.Configuration.GetSection("Cors:FeOrigins").Get<string[]>()
                ?? new[]
                {
                    "https://aspnetinvoicestarterproject-production-4f5c.up.railway.app",
                    "http://localhost:3000",
                    "https://localhost:5173"
                };

builder.Services.AddCors(o =>
{
    o.AddPolicy("FeCors", p => p
        .WithOrigins(feOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();

// === DB quick check (log) ===
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<InvoicesDbContext>();
    if (dbContext.Database.IsRelational())
    {
        logger.LogInformation("✅ DB loaded");
        var canConnect = await dbContext.Database.CanConnectAsync();
        logger.LogInformation("🧪 Can connect to DB: {CanConnect}", canConnect);
        // případně migrace: await dbContext.Database.MigrateAsync();
    }
    else
    {
        logger.LogInformation("ℹ️ Non-relational provider (InMemory) – skipping connection checks.");
        await dbContext.Database.EnsureCreatedAsync();
    }
}

// === Global try/catch logger (passthrough pro 500) ===
app.Use(async (context, next) =>
{
    try { await next(); }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Runtime exception");
        throw;
    }
});

// === Pipeline pořadí ===
app.UseCors("FeCors");          // 1) CORS

// 2) CSRF VALIDACE jen pokud zapnutá flagem (token vydáváme na /api/csrf a po loginu)
if (enableCsrfValidation)
{
    app.Use(async (ctx, next) =>
    {
        if (HttpMethods.IsPost(ctx.Request.Method) ||
            HttpMethods.IsPut(ctx.Request.Method)  ||
            HttpMethods.IsPatch(ctx.Request.Method)||
            HttpMethods.IsDelete(ctx.Request.Method))
        {
            try
            {
                var anti = ctx.RequestServices.GetRequiredService<IAntiforgery>();
                await anti.ValidateRequestAsync(ctx);
            }
            catch (AntiforgeryValidationException)
            {
                ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
                await ctx.Response.WriteAsync("CSRF validation failed");
                return;
            }
        }
        await next();
    });
}

app.UseAuthentication();        // 3) Auth
app.UseAuthorization();         // 4) AuthZ

// 5) Swagger (dev)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/swagger/browser/swagger.json",      "Invoices – Browser");
        o.SwaggerEndpoint("/swagger/integrations/swagger.json", "Invoices – Integrations");
    });
}

// 6) Endpoints
app.MapControllers(); // jen jednou – CORS globálně řeší UseCors výše

// Health/root
app.MapGet("/health", () => Results.Ok(new { status = "ok - server runs" }));
app.MapGet("/",       () => Results.Ok(new { server_started = true }));

// *** NEW: Diagnostika zápisu do DP složky (rychlé ověření na Azure)
app.MapGet("/diag/dp", () =>
{
    try
    {
        var testFile = Path.Combine(keysPath, $"probe-{Guid.NewGuid():N}.txt");
        File.WriteAllText(testFile, DateTime.UtcNow.ToString("O"));
        var xmlFiles = Directory.GetFiles(keysPath, "*.xml").Length;
        return Results.Ok(new { ok = true, keysPath, xmlKeyFiles = xmlFiles, testFileCreated = testFile });
    }
    catch (Exception ex)
    {
        return Results.Problem($"DP diag failed: {ex.Message}", statusCode: 500);
    }
});

// CSRF endpoint – nastaví cookie a vrátí token v JSON (no-store)
// app.MapGet("/api/csrf", (HttpContext ctx) =>
// {
//     try
//     {
//         var anti   = ctx.RequestServices.GetRequiredService<IAntiforgery>();
//         var tokens = anti.GetAndStoreTokens(ctx);

//         ctx.Response.Headers.CacheControl = "no-store, must-revalidate";
//         ctx.Response.Headers.Pragma      = "no-cache";
//         ctx.Response.Headers.Expires     = "0";

//         return Results.Json(new { csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
//     }
//     catch (Exception ex)
//     {
//         logger.LogError(ex, "❌ /api/csrf failed");
//         return Results.Problem("CSRF endpoint failed", statusCode: 500);
//     }
// })
// .RequireCors("FeCors");
app.MapGet("/api/csrf/ping", () => Results.Ok(new { ok = true }));

logger.LogInformation("✅ App is starting...");

try
{
    app.Run();
}
catch (Exception ex)
{
    logger.LogError(ex, "❌ Error by app start");
    throw; // důležité pro Azure, aby vrátil 500
}

// For WebApplicationFactory (integration tests)
public partial class Program { }
