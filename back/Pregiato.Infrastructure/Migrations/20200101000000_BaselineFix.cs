using Microsoft.EntityFrameworkCore.Migrations;

namespace Pregiato.Infrastructure.Migrations
{
    public partial class BaselineFix : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Garantir tabela de histórico de migrations
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
                    `MigrationId` varchar(150) NOT NULL,
                    `ProductVersion` varchar(32) NOT NULL,
                    PRIMARY KEY (`MigrationId`)
                ) CHARACTER SET=utf8mb4;
            ");

            // Marcar migrations antigas como aplicadas para evitar recriação de tabelas já existentes
            migrationBuilder.Sql("INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES ('20250805034113_InitialWhatsAppTables', '8.0.0');");
            migrationBuilder.Sql("INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES ('20250806015009_AddCRMEntitiesOnly', '8.0.0');");
            migrationBuilder.Sql("INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES ('20250812070132_AddAttendanceTicket', '8.0.0');");

            // Criar ChatLogs se não existir
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `ChatLogs` (
                    `Id` char(36) NOT NULL,
                    `ContactPhoneE164` varchar(20) NOT NULL,
                    `Title` varchar(150) NOT NULL,
                    `PayloadJson` LONGTEXT NOT NULL,
                    `UnreadCount` int NOT NULL DEFAULT 0,
                    `LastMessageAt` datetime NULL,
                    `LastMessagePreview` varchar(200) NULL,
                    `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `RowVersion` longblob NOT NULL,
                    PRIMARY KEY (`Id`),
                    UNIQUE KEY `IX_ChatLogs_ContactPhoneE164` (`ContactPhoneE164`)
                ) CHARACTER SET=utf8mb4;
            ");

            // Criar AttendanceTickets se não existir
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `AttendanceTickets` (
                    `Id` char(36) NOT NULL,
                    `ChatLogId` char(36) NOT NULL,
                    `Status` int NOT NULL,
                    `Step` int NOT NULL,
                    `AssignedUserId` varchar(100) NULL,
                    `AssignedUserName` varchar(150) NULL,
                    `Description` LONGTEXT NULL,
                    `Verified` tinyint(1) NOT NULL DEFAULT 0,
                    `StartedAtUtc` datetime NULL,
                    `EndedAtUtc` datetime NULL,
                    `CreatedAtUtc` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `UpdatedAtUtc` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `RowVersion` longblob NOT NULL,
                    PRIMARY KEY (`Id`),
                    KEY `IX_AttendanceTickets_ChatLogId` (`ChatLogId`),
                    KEY `IX_AttendanceTickets_Status` (`Status`),
                    CONSTRAINT `FK_AttendanceTickets_ChatLogs_ChatLogId` FOREIGN KEY (`ChatLogId`) REFERENCES `ChatLogs` (`Id`) ON DELETE CASCADE
                ) CHARACTER SET=utf8mb4;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS `AttendanceTickets`;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS `ChatLogs`;");
        }
    }
}


