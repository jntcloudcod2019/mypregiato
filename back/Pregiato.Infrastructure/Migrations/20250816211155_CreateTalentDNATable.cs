using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pregiato.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CreateTalentDNATable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Talents_TalentId",
                table: "Contracts");

            migrationBuilder.DropForeignKey(
                name: "FK_FileUploads_Talents_TalentId",
                table: "FileUploads");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Talents",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Availability",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Bust",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Ethnicity",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Experience",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "EyeColor",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "HairColor",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Hip",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Instagram",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Languages",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Nationality",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "OtherSocialMedia",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Rate",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "ShoeSize",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Skills",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "SkinTone",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "State",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "TikTok",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "TravelAvailability",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Waist",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "YouTube",
                table: "Talents");

            migrationBuilder.DropColumn(
                name: "ZipCode",
                table: "Talents");

            migrationBuilder.RenameTable(
                name: "Talents",
                newName: "Talent");

            migrationBuilder.RenameIndex(
                name: "IX_Talents_Email",
                table: "Talent",
                newName: "IX_Talent_Email");

            migrationBuilder.RenameIndex(
                name: "IX_Talents_Document",
                table: "Talent",
                newName: "IX_Talent_Document");

            migrationBuilder.AlterColumn<DateTime>(
                name: "RowVersion",
                table: "ModuleRecords",
                type: "timestamp(6)",
                rowVersion: true,
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp(6)",
                oldRowVersion: true,
                oldNullable: true)
                .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Talent",
                table: "Talent",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "TalentDNA",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TalentId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Height = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Weight = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HairColor = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HairType = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HairLength = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EyeColor = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SkinTone = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChestSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    WaistSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HipSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ShoeSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DressSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PantsSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ShirtSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    JacketSize = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FaceShape = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EthnicFeatures = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BodyType = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SpecialFeatures = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Accent = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Languages = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IntellectualDisability = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PhysicalDisability = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Religion = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TravelAvailability = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    VisualDisability = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TalentDNA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TalentDNA_Talent_TalentId",
                        column: x => x.TalentId,
                        principalTable: "Talent",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TalentDNA_TalentId",
                table: "TalentDNA",
                column: "TalentId",
                unique: true);

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
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Talent_TalentId",
                table: "Contracts");

            migrationBuilder.DropForeignKey(
                name: "FK_FileUploads_Talent_TalentId",
                table: "FileUploads");

            migrationBuilder.DropTable(
                name: "TalentDNA");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Talent",
                table: "Talent");

            migrationBuilder.RenameTable(
                name: "Talent",
                newName: "Talents");

            migrationBuilder.RenameIndex(
                name: "IX_Talent_Email",
                table: "Talents",
                newName: "IX_Talents_Email");

            migrationBuilder.RenameIndex(
                name: "IX_Talent_Document",
                table: "Talents",
                newName: "IX_Talents_Document");

            migrationBuilder.AlterColumn<DateTime>(
                name: "RowVersion",
                table: "ModuleRecords",
                type: "timestamp(6)",
                rowVersion: true,
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp(6)",
                oldRowVersion: true,
                oldNullable: true)
                .OldAnnotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Talents",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Availability",
                table: "Talents",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Bust",
                table: "Talents",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Ethnicity",
                table: "Talents",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Experience",
                table: "Talents",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "EyeColor",
                table: "Talents",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "HairColor",
                table: "Talents",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Height",
                table: "Talents",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Hip",
                table: "Talents",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Instagram",
                table: "Talents",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Languages",
                table: "Talents",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Nationality",
                table: "Talents",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Talents",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "OtherSocialMedia",
                table: "Talents",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Rate",
                table: "Talents",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ShoeSize",
                table: "Talents",
                type: "varchar(5)",
                maxLength: 5,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Skills",
                table: "Talents",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SkinTone",
                table: "Talents",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "Talents",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TikTok",
                table: "Talents",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TravelAvailability",
                table: "Talents",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Waist",
                table: "Talents",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Weight",
                table: "Talents",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "YouTube",
                table: "Talents",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ZipCode",
                table: "Talents",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Talents",
                table: "Talents",
                column: "Id");

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
