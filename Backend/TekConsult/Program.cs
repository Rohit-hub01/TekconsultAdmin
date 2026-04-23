using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.IO;
using System.Text;
using TekConsult.Data;
using TekConsult.Hubs;
using TekConsult.Services;



var builder = WebApplication.CreateBuilder(args);

Stripe.StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITwilioService, TwilioService>();
builder.Services.AddScoped<IEmailOtpService, GraphEmailService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPricingService, PricingService>();
builder.Services.AddScoped<ISystemSettingsService, SystemSettingsService>();
builder.Services.AddScoped<INotificationSettingsService, NotificationSettingsService>();
builder.Services.AddSignalR();
// Chat services
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
// SignalR user id provider
builder.Services.AddSingleton<Microsoft.AspNetCore.SignalR.IUserIdProvider, CustomUserIdProvider>();

// Agora services
builder.Services.AddScoped<IAgoraTokenService, AgoraTokenService>();

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TekConsult API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ================================
// JWT AUTHENTICATION
// ================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "")
        ),

        ClockSkew = TimeSpan.Zero
    };

    // Allow JWT token from query string for SignalR requests
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"].ToString();
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && 
                (path.StartsWithSegments("/chatHub") || path.StartsWithSegments("/notificationHub")))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("UserOrAdmin", policy =>
        policy.RequireRole( "Admin","User","Consultant"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:8080",
                "http://192.168.29.176:8080"
            )
            .AllowAnyHeader()
            .SetIsOriginAllowed(origin => true) // 👈 allow ALL origins
            .AllowAnyMethod()
            .AllowCredentials();
    });
});


builder.Services.AddScoped<IKYCService, KYCService>();

var app = builder.Build();

// Apply EF migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try 
    {
        db.Database.Migrate();
        Console.WriteLine("[Database] EF migrations applied.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database] EF Migrate warning (non-fatal): {ex.Message}");
    }

    // ── Idempotent schema patches ──────────────────────────────────────────────
    // These run EVERY startup using IF NOT EXISTS, so they are safe regardless
    // of whether EF migration tracking thinks they have already been applied.
    var sqlStatements = new[]
    {
        // 1. Conversations table
        @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Conversations')
          BEGIN
              CREATE TABLE [Conversations] (
                  [Id]           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
                  [UserId]       UNIQUEIDENTIFIER NOT NULL,
                  [ConsultantId] UNIQUEIDENTIFIER NOT NULL,
                  [CreatedAt]    DATETIME2 NOT NULL,
                  CONSTRAINT [PK_Conversations] PRIMARY KEY ([Id]),
                  CONSTRAINT [FK_Conversations_Users_UserId]       FOREIGN KEY ([UserId])       REFERENCES [Users]([UserId]),
                  CONSTRAINT [FK_Conversations_Users_ConsultantId] FOREIGN KEY ([ConsultantId]) REFERENCES [Users]([UserId])
              );
              CREATE INDEX [IX_Conversations_UserId]       ON [Conversations]([UserId]);
              CREATE INDEX [IX_Conversations_ConsultantId] ON [Conversations]([ConsultantId]);
          END",

        // 2. Make SessionId nullable in ChatMessages
        @"IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_NAME='ChatMessages' AND COLUMN_NAME='SessionId' AND IS_NULLABLE='NO')
          BEGIN
              IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_ChatMessages_ConsultationSessions_SessionId')
                  ALTER TABLE [ChatMessages] DROP CONSTRAINT [FK_ChatMessages_ConsultationSessions_SessionId];
              IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_ChatMessages_SessionId' AND object_id=OBJECT_ID('ChatMessages'))
                  DROP INDEX [IX_ChatMessages_SessionId] ON [ChatMessages];
              ALTER TABLE [ChatMessages] ALTER COLUMN [SessionId] UNIQUEIDENTIFIER NULL;
              CREATE INDEX [IX_ChatMessages_SessionId] ON [ChatMessages]([SessionId]);
              ALTER TABLE [ChatMessages] ADD CONSTRAINT [FK_ChatMessages_ConsultationSessions_SessionId]
                  FOREIGN KEY ([SessionId]) REFERENCES [ConsultationSessions]([SessionId]);
          END",

        // 3. Add ConversationId column to ChatMessages
        @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_NAME='ChatMessages' AND COLUMN_NAME='ConversationId')
          BEGIN
              ALTER TABLE [ChatMessages] ADD [ConversationId] UNIQUEIDENTIFIER NULL;
              CREATE INDEX [IX_ChatMessages_ConversationId] ON [ChatMessages]([ConversationId]);
              ALTER TABLE [ChatMessages] ADD CONSTRAINT [FK_ChatMessages_Conversations_ConversationId]
                  FOREIGN KEY ([ConversationId]) REFERENCES [Conversations]([Id]);
          END",

        // 4. Update ConsultantProfiles table for Pricing System
        @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ConsultantProfiles' AND COLUMN_NAME='DiscountedChatRate')
          BEGIN
              ALTER TABLE [ConsultantProfiles] ADD
                  [DiscountedCallRate] DECIMAL(18, 2) NULL,
                  [IsCallDiscountActive] BIT NOT NULL DEFAULT 0,
                  [DiscountedChatRate] DECIMAL(18, 2) NULL,
                  [IsChatDiscountActive] BIT NOT NULL DEFAULT 0,
                  [DiscountStart] DATETIME2 NULL,
                  [DiscountEnd] DATETIME2 NULL;
          END",

        // 5. Update ConsultationSessions table for AppliedRate
        @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ConsultationSessions' AND COLUMN_NAME='AppliedRate')
          BEGIN
              ALTER TABLE [ConsultationSessions] ADD
                  [AppliedRate] DECIMAL(18, 2) NOT NULL DEFAULT 0;
                    END",

                // 6. SystemSettings table
                @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SystemSettings')
                    BEGIN
                            CREATE TABLE [SystemSettings] (
                                    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                                    [PlatformCommissionPercent] DECIMAL(5,2) NOT NULL,
                                    [MinimumWithdrawalAmount] DECIMAL(18,2) NOT NULL,
                                    [UpdatedAt] DATETIME2 NOT NULL,
                                    [UpdatedBy] UNIQUEIDENTIFIER NULL
                            );
                    END

                    IF NOT EXISTS (SELECT 1 FROM [SystemSettings])
                    BEGIN
                            INSERT INTO [SystemSettings] ([PlatformCommissionPercent], [MinimumWithdrawalAmount], [UpdatedAt], [UpdatedBy])
                            VALUES (20, 500, SYSUTCDATETIME(), NULL);
                        END",

                    // 7. NotificationSettings table
                    @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'NotificationSettings')
                        BEGIN
                            CREATE TABLE [NotificationSettings] (
                                [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                                [NewConsultantApplications] BIT NOT NULL,
                                [DisputeAlerts] BIT NOT NULL,
                                [WithdrawalRequests] BIT NOT NULL,
                                [FailedTransactions] BIT NOT NULL,
                                [UpdatedAt] DATETIME2 NOT NULL,
                                [UpdatedBy] UNIQUEIDENTIFIER NULL
                            );
                        END

                        IF NOT EXISTS (SELECT 1 FROM [NotificationSettings])
                        BEGIN
                            INSERT INTO [NotificationSettings] ([NewConsultantApplications], [DisputeAlerts], [WithdrawalRequests], [FailedTransactions], [UpdatedAt], [UpdatedBy])
                            VALUES (1, 1, 1, 1, SYSUTCDATETIME(), NULL);
                        END",

                    // 8. Seed Admin Role and User
                    @"-- Create Admin role if not exists
                        IF NOT EXISTS (SELECT 1 FROM [Roles] WHERE [RoleName] = 'Admin')
                        BEGIN
                            INSERT INTO [Roles] ([RoleName])
                            VALUES ('Admin');
                        END

                        -- Create Admin user if not exists
                        DECLARE @AdminRoleId INT;
                        SELECT @AdminRoleId = [RoleId] FROM [Roles] WHERE [RoleName] = 'Admin';

                        IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Email] = 'admin@gmail.com')
                        BEGIN
                            INSERT INTO [Users] (
                                [UserId],
                                [FirstName],
                                [LastName],
                                [Email],
                                [PasswordHash],
                                [Status],
                                [RoleId],
                                [CreatedOn],
                                [IsPhoneVerified],
                                [IsConsultantVerified]
                            )
                            VALUES (
                                NEWID(),
                                'Admin',
                                'User',
                                'admin@gmail.com',
                                '$2a$11$c.PfL51ltaUxpgVFfRKOvOubMTEJpeL/437uTvXF8bZ8USnydDiz.',
                                1,
                                @AdminRoleId,
                                SYSUTCDATETIME(),
                                1,
                                0
                            );
                        END"
    };

    foreach (var sql in sqlStatements)
    {
        try
        {
            db.Database.ExecuteSqlRaw(sql);
            Console.WriteLine($"[Database] Schema patch applied OK.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Database] Schema patch warning: {ex.Message}");
        }
    }
    Console.WriteLine("[Database] Schema initialization complete.");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Only redirect to HTTPS in production
    app.UseHttpsRedirection();
}

app.UseStaticFiles(); // Enable static filing serving (for KYC uploads)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "uploads")),
    RequestPath = "/api/uploads"
});
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<ChatHub>("/chatHub");
app.MapHub<NotificationHub>("/notificationHub");

app.MapControllers();

app.Run();
