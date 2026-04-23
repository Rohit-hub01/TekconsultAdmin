using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TekConsult.Migrations
{
    /// <inheritdoc />
    public partial class AddChatConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ============================================================
            // All steps are IDEMPOTENT – safe to run even if partially done
            // ============================================================

            // 1. Create Conversations table only if it doesn't already exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Conversations')
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
                END
            ");

            // 2. Make SessionId nullable in ChatMessages (was NOT NULL in original migration)
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'ChatMessages'
                      AND COLUMN_NAME = 'SessionId'
                      AND IS_NULLABLE = 'NO'
                )
                BEGIN
                    -- Drop existing FK and index first
                    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ChatMessages_ConsultationSessions_SessionId')
                        ALTER TABLE [ChatMessages] DROP CONSTRAINT [FK_ChatMessages_ConsultationSessions_SessionId];

                    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ChatMessages_SessionId' AND object_id = OBJECT_ID('ChatMessages'))
                        DROP INDEX [IX_ChatMessages_SessionId] ON [ChatMessages];

                    ALTER TABLE [ChatMessages] ALTER COLUMN [SessionId] UNIQUEIDENTIFIER NULL;
                    
                    CREATE INDEX [IX_ChatMessages_SessionId] ON [ChatMessages]([SessionId]);
                    ALTER TABLE [ChatMessages] ADD CONSTRAINT [FK_ChatMessages_ConsultationSessions_SessionId]
                        FOREIGN KEY ([SessionId]) REFERENCES [ConsultationSessions]([SessionId]);
                END
            ");

            // 3. Add ConversationId column to ChatMessages only if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'ChatMessages' AND COLUMN_NAME = 'ConversationId'
                )
                BEGIN
                    ALTER TABLE [ChatMessages] ADD [ConversationId] UNIQUEIDENTIFIER NULL;
                    CREATE INDEX [IX_ChatMessages_ConversationId] ON [ChatMessages]([ConversationId]);
                    ALTER TABLE [ChatMessages] ADD CONSTRAINT [FK_ChatMessages_Conversations_ConversationId]
                        FOREIGN KEY ([ConversationId]) REFERENCES [Conversations]([Id]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ChatMessages_Conversations_ConversationId')
                    ALTER TABLE [ChatMessages] DROP CONSTRAINT [FK_ChatMessages_Conversations_ConversationId];

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ChatMessages_ConversationId' AND object_id = OBJECT_ID('ChatMessages'))
                    DROP INDEX [IX_ChatMessages_ConversationId] ON [ChatMessages];

                IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ChatMessages' AND COLUMN_NAME = 'ConversationId')
                    ALTER TABLE [ChatMessages] DROP COLUMN [ConversationId];

                IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Conversations')
                    DROP TABLE [Conversations];
            ");
        }
    }
}
