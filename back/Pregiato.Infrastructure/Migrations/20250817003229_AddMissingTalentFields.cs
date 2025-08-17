using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pregiato.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingTalentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Adicionar campo InviteSentAt se não existir
            migrationBuilder.AddColumn<DateTime>(
                name: "InviteSentAt",
                table: "Talent",
                type: "datetime",
                nullable: true);

            // Adicionar campo InviteToken se não existir
            migrationBuilder.AddColumn<string>(
                name: "InviteToken",
                table: "Talent",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            // Adicionar campo ClerkInviteId se não existir
            migrationBuilder.AddColumn<string>(
                name: "ClerkInviteId",
                table: "Talent",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InviteSentAt",
                table: "Talent");

            migrationBuilder.DropColumn(
                name: "InviteToken",
                table: "Talent");

            migrationBuilder.DropColumn(
                name: "ClerkInviteId",
                table: "Talent");
        }
    }
}
