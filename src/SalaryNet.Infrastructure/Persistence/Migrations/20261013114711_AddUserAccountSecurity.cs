using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalaryNet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAccountSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FailedLoginCount",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "bit",
                nullable: false,
                // Existing accounts must stay usable; EF scaffolds false for a new bool column.
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LockoutEndsAt",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedLoginCount",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LockoutEndsAt",
                table: "Users");
        }
    }
}
