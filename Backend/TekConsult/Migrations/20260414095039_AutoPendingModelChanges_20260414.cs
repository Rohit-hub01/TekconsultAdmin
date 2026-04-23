using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TekConsult.Migrations
{
    /// <inheritdoc />
    public partial class AutoPendingModelChanges_20260414 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[Conversations]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[FK_Conversations_Users_ConsultantId]', N'F') IS NOT NULL
        ALTER TABLE [Conversations] DROP CONSTRAINT [FK_Conversations_Users_ConsultantId];

    IF OBJECT_ID(N'[FK_Conversations_Users_UserId]', N'F') IS NOT NULL
        ALTER TABLE [Conversations] DROP CONSTRAINT [FK_Conversations_Users_UserId];
END");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ConsultantCategories",
                table: "ConsultantCategories");

            migrationBuilder.DropIndex(
                name: "IX_ConsultantCategories_ConsultantProfileId",
                table: "ConsultantCategories");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "ConsultantCategories");

            migrationBuilder.AddColumn<decimal>(
                name: "AppliedRate",
                table: "ConsultationSessions",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsDisputed",
                table: "ConsultationSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DiscountEnd",
                table: "ConsultantProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DiscountStart",
                table: "ConsultantProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountedCallRate",
                table: "ConsultantProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountedChatRate",
                table: "ConsultantProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCallDiscountActive",
                table: "ConsultantProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsChatDiscountActive",
                table: "ConsultantProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_ConsultantCategories",
                table: "ConsultantCategories",
                columns: new[] { "ConsultantProfileId", "CategoryId" });

            migrationBuilder.CreateTable(
                name: "ConsultantSubCategories",
                columns: table => new
                {
                    ConsultantProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsultantSubCategories", x => new { x.ConsultantProfileId, x.SubCategoryId });
                    table.ForeignKey(
                        name: "FK_ConsultantSubCategories_Categories_SubCategoryId",
                        column: x => x.SubCategoryId,
                        principalTable: "Categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConsultantSubCategories_ConsultantProfiles_ConsultantProfileId",
                        column: x => x.ConsultantProfileId,
                        principalTable: "ConsultantProfiles",
                        principalColumn: "ConsultantProfileId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NewConsultantApplications = table.Column<bool>(type: "bit", nullable: false),
                    DisputeAlerts = table.Column<bool>(type: "bit", nullable: false),
                    WithdrawalRequests = table.Column<bool>(type: "bit", nullable: false),
                    FailedTransactions = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlatformCommissionPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    MinimumWithdrawalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantSubCategories_SubCategoryId",
                table: "ConsultantSubCategories",
                column: "SubCategoryId");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[Conversations]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[FK_Conversations_Users_ConsultantId]', N'F') IS NULL
        ALTER TABLE [Conversations] ADD CONSTRAINT [FK_Conversations_Users_ConsultantId]
            FOREIGN KEY ([ConsultantId]) REFERENCES [Users]([UserId]) ON DELETE CASCADE;

    IF OBJECT_ID(N'[FK_Conversations_Users_UserId]', N'F') IS NULL
        ALTER TABLE [Conversations] ADD CONSTRAINT [FK_Conversations_Users_UserId]
            FOREIGN KEY ([UserId]) REFERENCES [Users]([UserId]) ON DELETE CASCADE;
END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[Conversations]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[FK_Conversations_Users_ConsultantId]', N'F') IS NOT NULL
        ALTER TABLE [Conversations] DROP CONSTRAINT [FK_Conversations_Users_ConsultantId];

    IF OBJECT_ID(N'[FK_Conversations_Users_UserId]', N'F') IS NOT NULL
        ALTER TABLE [Conversations] DROP CONSTRAINT [FK_Conversations_Users_UserId];
END");

            migrationBuilder.DropTable(
                name: "ConsultantSubCategories");

            migrationBuilder.DropTable(
                name: "NotificationSettings");

            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ConsultantCategories",
                table: "ConsultantCategories");

            migrationBuilder.DropColumn(
                name: "AppliedRate",
                table: "ConsultationSessions");

            migrationBuilder.DropColumn(
                name: "IsDisputed",
                table: "ConsultationSessions");

            migrationBuilder.DropColumn(
                name: "DiscountEnd",
                table: "ConsultantProfiles");

            migrationBuilder.DropColumn(
                name: "DiscountStart",
                table: "ConsultantProfiles");

            migrationBuilder.DropColumn(
                name: "DiscountedCallRate",
                table: "ConsultantProfiles");

            migrationBuilder.DropColumn(
                name: "DiscountedChatRate",
                table: "ConsultantProfiles");

            migrationBuilder.DropColumn(
                name: "IsCallDiscountActive",
                table: "ConsultantProfiles");

            migrationBuilder.DropColumn(
                name: "IsChatDiscountActive",
                table: "ConsultantProfiles");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "ConsultantCategories",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_ConsultantCategories",
                table: "ConsultantCategories",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultantCategories_ConsultantProfileId",
                table: "ConsultantCategories",
                column: "ConsultantProfileId");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[Conversations]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[FK_Conversations_Users_ConsultantId]', N'F') IS NULL
        ALTER TABLE [Conversations] ADD CONSTRAINT [FK_Conversations_Users_ConsultantId]
            FOREIGN KEY ([ConsultantId]) REFERENCES [Users]([UserId]);

    IF OBJECT_ID(N'[FK_Conversations_Users_UserId]', N'F') IS NULL
        ALTER TABLE [Conversations] ADD CONSTRAINT [FK_Conversations_Users_UserId]
            FOREIGN KEY ([UserId]) REFERENCES [Users]([UserId]);
END");
        }
    }
}
