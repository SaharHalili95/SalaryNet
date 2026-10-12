# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Restore first so the dependency layer is cached between code changes.
COPY global.json Directory.Build.props Directory.Packages.props .editorconfig ./
COPY src/SalaryNet.Domain/SalaryNet.Domain.csproj src/SalaryNet.Domain/
COPY src/SalaryNet.Application/SalaryNet.Application.csproj src/SalaryNet.Application/
COPY src/SalaryNet.Infrastructure/SalaryNet.Infrastructure.csproj src/SalaryNet.Infrastructure/
COPY src/SalaryNet.API/SalaryNet.API.csproj src/SalaryNet.API/
RUN dotnet restore src/SalaryNet.API/SalaryNet.API.csproj

COPY src/ src/
RUN dotnet publish src/SalaryNet.API/SalaryNet.API.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "SalaryNet.API.dll"]
