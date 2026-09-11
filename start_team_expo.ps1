<#
.SYNOPSIS
    Starts ClaimsGuru Mobile Expo Dev Server for Team Testing with Azure Pre-Prod Cloud Backend.
#>

param (
    [switch]$Tunnel = $false,
    [switch]$Clear = $true,
    [switch]$Local = $false
)

$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ClaimsGuru Mobile Stack - Team Expo Server" -ForegroundColor Cyan
if ($Local) {
    Write-Host " (Mode: Local Docker Stack)" -ForegroundColor Yellow
} else {
    Write-Host " (Mode: Azure Pre-Prod Cloud Backend)" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Cyan

# Default to Azure Pre-Prod Ingress Gateway
$apiUrl = "https://cg-preprod-cin-ingress.purpleocean-4441f644.centralindia.azurecontainerapps.io"

if ($Local) {
    # Detect physical Wi-Fi IP for local testing
    $wifiEntry = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.InterfaceAlias -like "*Wi-Fi*" -and 
        $_.InterfaceAlias -notlike "*vEthernet*" -and 
        $_.InterfaceAlias -notlike "*WSL*" -and
        $_.IPAddress -notlike "169.254*" -and 
        $_.IPAddress -notlike "127.*" 
    } | Select-Object -First 1

    $wifiIp = if ($wifiEntry) { $wifiEntry.IPAddress } else { "192.168.1.6" }
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $wifiIp
    $apiUrl = "http://$($wifiIp):8000"
}

# Update .env for mobile client
$envPath = Join-Path $ProjectRoot ".env"
$envContent = @"
# ClaimsGuru Mobile Environment Configuration
EXPO_PUBLIC_ENABLE_ENTRA_ID=false
EXPO_PUBLIC_API_URL=$apiUrl
"@
Set-Content -Path $envPath -Value $envContent -Force

Write-Host "Active Backend API: $apiUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Expo Go Server for your team..." -ForegroundColor Yellow
Write-Host "Scan the QR code with Expo Go on Android or Camera on iOS." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

if ($Tunnel) {
    npx expo start --go --tunnel $(if ($Clear) { "-c" })
} else {
    npx expo start --go --host lan $(if ($Clear) { "-c" })
}

