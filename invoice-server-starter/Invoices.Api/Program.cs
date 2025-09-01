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

var logger = LoggerFactory
    .Create(builder => builder.AddConsole())
    .CreateLogger("Startup");

logger.LogInformation("🚀 Starting app...");

var builder = WebApplication.CreateBuilder(args);

// === Security flags (appsettings: Security:EnableCookieAuth, Security:EnableCsrfValidation) ===
var security = builder.Configuration.GetSection("Security");
bool enableCookieAuth     = security.GetValue<bool>("EnableCookieAuth",     true);
bool enableCsrfValidation = security.GetValue<bool>("EnableCsrfValidation", false);

// === DB ===
var connectionString = builder.Configuration.GetConnectionString("AzureConnection");
builder.Services.AddDbContext<InvoicesDbContext>(options =>
    options.UseSqlServer(connectionString)
           .UseLazyLoadingProxies()
           .ConfigureWarnings(x => x.Ignore(CoreEventId.LazyLoadOnDisposedContextWarning)));

// === MVC + JSON ===
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

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
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail = true;
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

// Defaulty necháme na JWT (pro integrace). FE endpointy hlídej přes Authorize(Policy="BrowserOnly").
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
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
            opt.Cookie.Name       = "app_auth";
            opt.Cookie.HttpOnly   = true;
            opt.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            opt.Cookie.SameSite   = SameSiteMode.None;   // cross-site FE → BE
            opt.SlidingExpiration = true;
            opt.ExpireTimeSpan    = TimeSpan.FromDays(7);

            // API chování: žádné redirecty, ale 401/403
            opt.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin       = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; },
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

// === Antiforgery ===
var isDev = builder.Environment.IsDevelopment();
if (enableCookieAuth)
{
    builder.Services.AddAntiforgery(o =>
    {
        o.HeaderName       = "X-CSRF-TOKEN";
        o.Cookie.Name      = "XSRF-TOKEN";
        o.Cookie.HttpOnly  = false; // token primárně bereme z JSON /api/csrf; cookie může zůstat ne-HttpOnly
        o.Cookie.SameSite  = isDev ? SameSiteMode.Lax  : SameSiteMode.None;
        o.Cookie.SecurePolicy = isDev ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    });
}

// === CORS (FE s cookies) ===
var feOrigins = builder.Configuration.GetSection("Cors:FeOrigins").Get<string[]>()
                ?? new[]
                {
                    "https://aspnetinvoicestarterproject-production-4f5c.up.railway.app",
                    "http://localhost:3000",
                    "https://localhost:5173"
                };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FeCors", p => p
        .WithOrigins(feOrigins)                 // přesné originy (scheme + host + port)
        .AllowAnyHeader()                       // jednodušší než whitelist – bezpečné v kombinaci s WithOrigins + CSRF
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
        logger.LogInformation("✅ DB loaded ");
        var canConnect = await dbContext.Database.CanConnectAsync();
        logger.LogInformation($"🧪 Can connect to DB: {canConnect}");
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
        logger.LogInformation($"❌ Runtime exception: {ex.Message}");
        logger.LogInformation(ex.StackTrace);
        throw;
    }
});

// === Pipeline pořadí ===
app.UseCors("FeCors"); // 1) CORS (musí být před čímkoli, co vrací odpověď)

// 2) Antiforgery – vydání tokenu a validace (jen s cookie auth)
if (enableCookieAuth)
{
    // GET/HEAD: vystavit/obnovit XSRF-TOKEN cookie a vrátili token na /api/csrf endpointu
    app.Use(async (ctx, next) =>
    {
        var anti = ctx.RequestServices.GetRequiredService<IAntiforgery>();
        if (HttpMethods.IsGet(ctx.Request.Method) || HttpMethods.IsHead(ctx.Request.Method))
            anti.GetAndStoreTokens(ctx);
        await next();
    });

    // Validate CSRF pro "unsafe" metody (když zapnuto flagem)
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
}

app.UseAuthentication(); // 3) Auth
app.UseAuthorization();  // 4) AuthZ

// 5) Endpoints
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/swagger/browser/swagger.json",      "Invoices – Browser");
        o.SwaggerEndpoint("/swagger/integrations/swagger.json", "Invoices – Integrations");
    });
}

app.MapControllers(); // ⚠️ jen jednou – globální CORS řeší UseCors výše

// Health/root
app.MapGet("/health", () => Results.Ok(new { status = "ok - server runs" }));
app.MapGet("/",       () => Results.Ok(new { server_started = true }));

// CSRF endpoint – vrací token i nastaví cookie
app.MapGet("/api/csrf", (HttpContext ctx, IAntiforgery anti) =>
{
    var tokens = anti.GetAndStoreTokens(ctx);
    ctx.Response.Headers.CacheControl = "no-store, must-revalidate";
    ctx.Response.Headers.Pragma      = "no-cache";
    ctx.Response.Headers.Expires     = "0";
    return Results.Json(new { csrf = tokens.RequestToken, header = "X-CSRF-TOKEN" });
})
.RequireCors("FeCors");

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

// For WebApplicationFactory (integration tests)
public partial class Program { }