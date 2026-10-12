using Testcontainers.MsSql;

namespace SalaryNet.Tests.Integration.Infrastructure;

/// <summary>One SQL Server container for the whole integration run; each test class gets its own database in it.</summary>
public sealed class SqlServerContainerFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _container = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-CU16-ubuntu-22.04")
        .Build();

    public string ConnectionStringFor(string database) =>
        new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(_container.GetConnectionString())
        {
            InitialCatalog = database,
        }.ConnectionString;

    public Task InitializeAsync() => _container.StartAsync();

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();
}

[CollectionDefinition(Name)]
public sealed class IntegrationTestGroup : ICollectionFixture<SqlServerContainerFixture>
{
    public const string Name = "Integration";
}
