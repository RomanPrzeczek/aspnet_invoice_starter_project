using Invoices.Data.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics.Metrics;
using System.IO;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace Invoices.Data;

public class InvoicesDbContext : IdentityDbContext // if Identity, add IdentityDbContext<Person>
{
    public DbSet<Person>? Persons { get; set; }
    public DbSet<Invoice>? Invoices { get; set; }

    public InvoicesDbContext(DbContextOptions<InvoicesDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        //AddTestingData(modelBuilder);

        modelBuilder.Entity<Invoice>()
            .Property(x => x.Price)
            .HasColumnType("decimal(10,2)");

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Buyer)
            .WithMany(p => p.Purchases)
            .HasForeignKey(i => i.BuyerId);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Seller)
            .WithMany(p => p.Sales)
            .HasForeignKey(i => i.SellerId);
    }

    private void AddTestingData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Person>().HasData(
            new Person
            {
                PersonId = 1, // musíš specifikovat primární klíč ručně
                Name = "ITnetwork s.r.o.",
                IdentificationNumber = "CZ12345678",
                TaxNumber = "CZ14025582",
                AccountNumber = "12345678",
                BankCode = "5500",
                Iban = "CZ0801000000001234567899",
                Telephone = "+420 123 123 123",
                Mail = "redakce@itnetwork.cz",
                Street = "Havlíčkovo náměstí 290/16, Nové Město (Praha 2)",
                Zip = "120 00",
                City = "Praha",
                Country = Country.CZECHIA,
                Note = "Největší IT akademie v Česku."
            }
            ,new Person
            {
                PersonId = 2, // musíš specifikovat primární klíč ručně
                Name = "Romino",
                IdentificationNumber = "CZ12345679",
                TaxNumber = "CZ14025583",
                AccountNumber = "12345678",
                BankCode = "0100",
                Iban = "CZ0801000000001234560000",
                Telephone = "+420 123 123 456",
                Mail = "romino@example.cz",
                Street = "Havlíčkovo náměstí 300/30, Nové Město (Praha 2)",
                Zip = "120 00",
                City = "Praha",
                Country = Country.CZECHIA,
                Note = "Student největší IT akademie v Česku."
            }
            );
    }
}