using Microsoft.EntityFrameworkCore.Migrations;

namespace Pregiato.Infrastructure.Migrations
{
    public partial class FixMessagesTextColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Alterar coluna Text de VARCHAR(5000) para LONGTEXT para suportar mensagens longas
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `Text` LONGTEXT;
            ");

            // Alterar coluna Metadata para LONGTEXT para suportar metadados extensos
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `Metadata` LONGTEXT;
            ");

            // Alterar coluna PayloadJson para LONGTEXT para suportar payload completo original
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `PayloadJson` LONGTEXT;
            ");

            // Alterar coluna Body (se existir) para LONGTEXT para compatibilidade
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `Body` LONGTEXT;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverter Text para VARCHAR(5000)
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `Text` VARCHAR(5000);
            ");

            // Reverter Metadata para VARCHAR(1000)
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `Metadata` VARCHAR(1000);
            ");

            // Reverter PayloadJson para VARCHAR(4000)
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `PayloadJson` VARCHAR(4000);
            ");

            // Reverter Body para VARCHAR(1000)
            migrationBuilder.Sql(@"
                ALTER TABLE `Messages` 
                MODIFY COLUMN `Body` VARCHAR(1000);
            ");
        }
    }
}
