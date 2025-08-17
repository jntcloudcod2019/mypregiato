using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pregiato.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixTalentForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Criar foreign keys corretas que referenciam Talent
            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Talent_TalentId",
                table: "Contracts",
                column: "TalentId",
                principalTable: "Talent",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FileUploads_Talent_TalentId",
                table: "FileUploads",
                column: "TalentId",
                principalTable: "Talent",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remover foreign keys corretas
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Talent_TalentId",
                table: "Contracts");

            migrationBuilder.DropForeignKey(
                name: "FK_FileUploads_Talent_TalentId",
                table: "FileUploads");

            // Recriar foreign keys antigas
            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Talents_TalentId",
                table: "Contracts",
                column: "TalentId",
                principalTable: "Talents",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FileUploads_Talents_TalentId",
                table: "FileUploads",
                column: "TalentId",
                principalTable: "Talents",
                principalColumn: "Id");
        }
    }
}
