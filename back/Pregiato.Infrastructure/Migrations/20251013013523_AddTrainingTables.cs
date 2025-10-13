using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pregiato.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTrainingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateTable(
                name: "TrainingCourses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "LONGTEXT", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ThumbnailUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ThumbnailObjectName = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Difficulty = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    TotalLessons = table.Column<int>(type: "int", nullable: false),
                    TotalDurationMinutes = table.Column<int>(type: "int", nullable: false),
                    TotalLikes = table.Column<int>(type: "int", nullable: false),
                    TotalDislikes = table.Column<int>(type: "int", nullable: false),
                    AverageRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
                    DeletedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingCourses", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TrainingEnrollments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CourseId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EnrolledAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    StartedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    LastAccessedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ProgressPercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    CompletedLessons = table.Column<int>(type: "int", nullable: false),
                    TotalTimeWatchedMinutes = table.Column<int>(type: "int", nullable: false),
                    CertificateIssued = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CertificateIssuedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    CertificateUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CertificateObjectName = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingEnrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingEnrollments_TrainingCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "TrainingCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TrainingLessons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CourseId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "LONGTEXT", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    VideoUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VideoObjectName = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VideoSize = table.Column<long>(type: "bigint", nullable: false),
                    VideoDurationSeconds = table.Column<int>(type: "int", nullable: true),
                    VideoMimeType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AttachmentsJson = table.Column<string>(type: "LONGTEXT", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingLessons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingLessons_TrainingCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "TrainingCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TrainingRatings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CourseId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RatingType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Stars = table.Column<int>(type: "int", nullable: true),
                    Comment = table.Column<string>(type: "LONGTEXT", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingRatings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingRatings_TrainingCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "TrainingCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TrainingCertificates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EnrollmentId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CourseId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CertificateNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserFullName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CourseName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CompletionDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    TotalHours = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    PdfUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PdfObjectName = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HtmlContent = table.Column<string>(type: "LONGTEXT", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValidationCode = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsValid = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingCertificates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingCertificates_TrainingEnrollments_EnrollmentId",
                        column: x => x.EnrollmentId,
                        principalTable: "TrainingEnrollments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TrainingLessonProgress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EnrollmentId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    LessonId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    IsCompleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    WatchedSeconds = table.Column<int>(type: "int", nullable: false),
                    LastPositionSeconds = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    LastWatchedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    WatchCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingLessonProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingLessonProgress_TrainingEnrollments_EnrollmentId",
                        column: x => x.EnrollmentId,
                        principalTable: "TrainingEnrollments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrainingLessonProgress_TrainingLessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "TrainingLessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingCertificates_CertificateNumber",
                table: "TrainingCertificates",
                column: "CertificateNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingCertificates_EnrollmentId",
                table: "TrainingCertificates",
                column: "EnrollmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingCertificates_UserId",
                table: "TrainingCertificates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingCertificates_ValidationCode",
                table: "TrainingCertificates",
                column: "ValidationCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingCourses_Category",
                table: "TrainingCourses",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingCourses_CreatedBy",
                table: "TrainingCourses",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingCourses_IsActive",
                table: "TrainingCourses",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingEnrollments_CourseId",
                table: "TrainingEnrollments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingEnrollments_UserId",
                table: "TrainingEnrollments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingEnrollments_UserId_CourseId",
                table: "TrainingEnrollments",
                columns: new[] { "UserId", "CourseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingLessonProgress_EnrollmentId",
                table: "TrainingLessonProgress",
                column: "EnrollmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingLessonProgress_EnrollmentId_LessonId",
                table: "TrainingLessonProgress",
                columns: new[] { "EnrollmentId", "LessonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingLessonProgress_LessonId",
                table: "TrainingLessonProgress",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingLessons_CourseId",
                table: "TrainingLessons",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingLessons_OrderIndex",
                table: "TrainingLessons",
                column: "OrderIndex");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingRatings_CourseId",
                table: "TrainingRatings",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingRatings_UserId",
                table: "TrainingRatings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingRatings_UserId_CourseId",
                table: "TrainingRatings",
                columns: new[] { "UserId", "CourseId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrainingCertificates");

            migrationBuilder.DropTable(
                name: "TrainingLessonProgress");

            migrationBuilder.DropTable(
                name: "TrainingRatings");

            migrationBuilder.DropTable(
                name: "TrainingEnrollments");

            migrationBuilder.DropTable(
                name: "TrainingLessons");

            migrationBuilder.DropTable(
                name: "TrainingCourses");

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
        }
    }
}
