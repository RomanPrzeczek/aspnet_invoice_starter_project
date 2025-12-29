# Local Development Certificates

This project uses HTTPS in local development with custom domains.
Next steps are for Windows OS.

## Official project page for info only.
https://github.com/FiloSottile/mkcert

## 0. Verify installation.
mkcert -version

## 1. Initialize local Certificate Authority (once per machine)
# This step installs a local development CA into the operating system trust store.
mkcert -install

## 2. Generate API certificate
# Generate a PKCS#12 certificate for the backend API domain.
mkcert -pkcs12 api.local.test
# This creates:
# -api.local.test.p12
# -default password: changeit
# Move the generated file to: Invoices.Api/certs/api.local.test.p12
# ⚠ The .p12 file is not committed to git!

## 4. Configure appsettings
# Rename: appsettings.Development.template.json → appsettings.Development.json
# Edit appsettings.Development.json and set the certificate password.

## 5. Run the backend API
# From the Invoices.Api directory:
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet build
dotnet run --no-launch-profile

# The API will start on: https://api.local.test:5001

## Notes
# Certificates are local-development only
# Each developer generates their own certificates
# No private keys or certificates are stored in the repository
# The template configuration file is safe to commit