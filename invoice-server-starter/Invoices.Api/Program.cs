using System.IO;
using System.Text;
using System.Text.Json.Serialization;

using Invoices.Api;
using Invoices.Api.Interfaces;
using Invoices.Api.Managers;
using Invoices.Data;
using Invoices.Data.Interfaces;
using Invoices.Data.Repositories;

using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

// ---------- bootstrap logger ----------
var logger = LoggerFactory.Create(b => b.AddConsole()).CreateLogger("Startup");
logger.LogInformation("🚀 Starting app...");

var builder = WebApplication.CreateBuilder(args);
var isDev   = builder.Environment.IsDevelopment();

// ---------- security flags ----------
var security = builder.Configuration.GetSection("Security");
bool enableCookieAuth     = security.GetValue("EnableCookieAuth",     true);
bool enableCsrfValidation = security.GetValue("EnableCsrfValidation", false);
logger.LogInformation("Flags at runtime: EnableCookieAuth={EnableCookieAuth}, EnableCsrfValidation={EnableCsrfValidation}",
    enableCookieAuth, enableCsrfValidation);

// ---------- DB ----------
var connectionString = builder.Configuration.GetConnectionString("AzureConnection");
builder.Services.AddDbContext<InvoicesDbContext>(opt =>
    opt.UseSqlServer(connectionString)
       .UseLazyLoadingProxies()
       .ConfigureWarnings(x => x.Ignore(CoreEventId.LazyLoadOnDisposedContextWarning)));

// ---------- MVC + JSON ----------
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

// ---------- Swagger ----------
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("browser",      new() { Title = "Invoices – Browser",      Version = "v1" });
    c.SwaggerDoc("integrations", new() { Title = "Invoices – Integrations", Version = "v1" });
    c.DocInclusionPredicate((doc, desc) => desc.GroupName == doc);
});

// ---------- Repositories & Managers ----------
builder.Services.AddScoped<IPersonRepository, PersonRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IPersonManager,  PersonManager>();
builder.Services.AddScoped<IInvoiceManager, InvoiceManager>();
builder.Services.AddScoped<IJwtTokenManager, JwtTokenManager>();

// ---------- AutoMapper ----------
builder.Services.AddAutoMapper(typeof(AutomapperConfigurationProfile));

// ---------- Identity ----------
builder.Services.AddIdentity<IdentityUser, IdentityRole>(o =>
{
    o.Password.RequiredLength = 8;
    o.Password.RequireNonAlphanumeric = false;
    o.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<InvoicesDbContext>();

builder.Services.AddHttpContextAccessor(); // for SignInManager etc.

// ---------- JWT (default for integrations / Postman / clean DEV) ----------
var jwtKey    = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer))
    throw new InvalidOperationException("JWT config missing.");

builder.Services.AddAuthentication(o =>
{
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

// ---------- Cookies ----------
builder.Services.Configure<CookieSettings>(builder.Configuration.GetSection("Cookies"));

if (enableCookieAuth)
{
    builder.Services.AddAuthentication()
        .AddCookie("AppCookie", opt =>
        {
            var cfg = builder.Configuration.GetSection("Cookies").Get<CookieSettings>() ?? new CookieSettings();

            opt.Cookie.Name = cfg.AuthCookieName ?? "app_auth";

            if (!string.IsNullOrWhiteSpace(cfg.Domain))
                opt.Cookie.Domain = cfg.Domain;

            opt.Cookie.HttpOnly     = true;
            opt.Cookie.SecurePolicy = cfg.Secure ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
            opt.Cookie.SameSite     = ToSameSite(cfg.SameSite);
            opt.SlidingExpiration   = true;
            opt.ExpireTimeSpan      = TimeSpan.FromDays(7);

            opt.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin        = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; },
                OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; }
            };
        });
}

// ---------- Authorization ----------
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

// ---------- Data Protection ----------
var configuredDpPath = builder.Configuration["DP_KEYS_PATH"];
if (!string.IsNullOrWhiteSpace(configuredDpPath))
    configuredDpPath = Environment.ExpandEnvironmentVariables(configuredDpPath);

string? home = Environment.GetEnvironmentVariable("HOME");
var keysPath = !string.IsNullOrWhiteSpace(configuredDpPath)
    ? configuredDpPath
    : !string.IsNullOrWhiteSpace(home)
        ? Path.Combine(home!, "dp-keys")
        : Path.Combine(Path.GetTempPath(), "dp-keys");

Directory.CreateDirectory(keysPath);
logger.LogInformation("🔐 DataProtection keys path: {Path}", keysPath);

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
    .SetApplicationName("InvoiceApi");

// ---------- Antiforgery ----------
builder.Services.AddAntiforgery(o =>
{
    var cfg = builder.Configuration.GetSection("Cookies").Get<CookieSettings>() ?? new CookieSettings();

    o.HeaderName = cfg.XsrfHeaderName ?? "X-CSRF-TOKEN";
    o.Cookie.Name = cfg.XsrfCookieName ?? "XSRF-TOKEN-v2";

    if (!string.IsNullOrWhiteSpace(cfg.Domain))
        o.Cookie.Domain = cfg.Domain;

    o.Cookie.HttpOnly = false;              // FE čte do hlavičky
    o.Cookie.SameSite = SameSiteMode.None;  // cross-site
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

// ---------- for debugging only ----------
var cs = builder.Configuration.GetSection("Cookies").Get<CookieSettings>() ?? new CookieSettings();
logger.LogInformation("Cookies.Domain='{Domain}', Name='{Name}'", cs.Domain, cs.AuthCookieName ?? "app_auth");


// ---------- CORS ----------
var feOrigins = builder.Configuration.GetSection("Security:FeOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddSingleton(new FeOriginsHolder(feOrigins));

builder.Services.AddCors(o =>
{
    o.AddPolicy("FeCors", p => p
        .WithOrigins(feOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// ---------- Logging ----------
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var app = builder.Build();

// ---------- DB quick check ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InvoicesDbContext>();
    if (db.Database.IsRelational())
    {
        logger.LogInformation("✅ DB loaded");
        var canConnect = await db.Database.CanConnectAsync();
        logger.LogInformation("🧪 Can connect to DB: {CanConnect}", canConnect);
    }
    else
    {
        await db.Database.EnsureCreatedAsync();
    }
}

// ---------- Pipeline ----------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();       // DEV
}
else if (app.Environment.IsEnvironment("ProdSim"))
{
    app.UseHsts();                         // ProdSim = “prod-like”
}
app.UseHttpsRedirection();

app.UseCors("FeCors");                 

// CSRF valiadtion only for mutations out of login/CSRF endpoint
if (enableCsrfValidation)
{
    app.Use(async (ctx, next) =>
    {
        bool isMutating =
            HttpMethods.IsPost(ctx.Request.Method) ||
            HttpMethods.IsPut(ctx.Request.Method) ||
            HttpMethods.IsPatch(ctx.Request.Method) ||
            HttpMethods.IsDelete(ctx.Request.Method);

        bool skip =
            ctx.Request.Path.StartsWithSegments("/api/csrf", StringComparison.OrdinalIgnoreCase) ||
            ctx.Request.Path.Equals("/api/auth", StringComparison.OrdinalIgnoreCase);

        if (isMutating && !skip)
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

app.UseAuthentication();
app.UseAuthorization();

// Swagger jen v DEV
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/swagger/browser/swagger.json",      "Invoices – Browser");
        o.SwaggerEndpoint("/swagger/integrations/swagger.json", "Invoices – Integrations");
    });
}

app.MapControllers();

// Health/diag
app.MapGet("/health", () => Results.Ok(new { status = "ok - server runs" }));
app.MapGet("/",       () => Results.Ok(new { server_started = true }));
app.MapGet("/diag/anti", (IServiceProvider sp) => Results.Ok(new { antiforgeryRegistered = sp.GetService<IAntiforgery>() != null }));
app.MapGet("/diag/endpoints", (IEnumerable<EndpointDataSource> sources) =>
{
    var list = sources.SelectMany(s => s.Endpoints)
                      .OfType<RouteEndpoint>()
                      .Select(e => e.RoutePattern.RawText)
                      .OrderBy(x => x);
    return Results.Json(list);
});

logger.LogInformation("✅ App is starting...");
try { app.Run(); }
catch (Exception ex) { logger.LogError(ex, "❌ Error by app start"); throw; }

// ---------- helpers ----------
public partial class Program
{
    internal static SameSiteMode ToSameSite(string? v) =>
        string.Equals(v, "None",   StringComparison.OrdinalIgnoreCase) ? SameSiteMode.None  :
        string.Equals(v, "Strict", StringComparison.OrdinalIgnoreCase) ? SameSiteMode.Strict:
        SameSiteMode.Lax;
}

public sealed class CookieSettings
{
    public string? Domain { get; set; }            // .local.test (DEV) / api.local.test (ProdSim)
    public string? AuthCookieName { get; set; }    // ".InvoiceAuth" apod.
    public string? XsrfCookieName { get; set; }    // "XSRF-TOKEN-v2"
    public string? XsrfHeaderName { get; set; }    // "X-CSRF-TOKEN"
    public bool   Secure    { get; set; } = true;
    public string SameSite  { get; set; } = "None";
}
