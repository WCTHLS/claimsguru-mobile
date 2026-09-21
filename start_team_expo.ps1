<#
.SYNOPSIS
    Starts ClaimsGuru Mobile Expo Dev Server for Team Testing with Azure Pre-Prod Cloud Backend.
#>

param (
    [switch]$Tunnel = $false,
    [switch]$Clear = $true,
    [switch]$Local = $false,
    [string]$ApiUrl = "",
    [switch]$ForceEnv = $false
)

$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ClaimsGuru Mobile Stack - Team Expo Server" -ForegroundColor Cyan
if ($Local) {
    Write-Host " (Mode: Local Docker Stack)" -ForegroundColor Yellow
} elseif ($ApiUrl) {
    Write-Host " (Mode: Custom API URL)" -ForegroundColor Yellow
} else {
    Write-Host " (Mode: Azure Pre-Prod Cloud Backend)" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Cyan

# Detect physical Wi-Fi IP for direct LAN connectivity (ignoring WSL/Hyper-V virtual adapters)
$wifiEntry = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -like "*Wi-Fi*" -and 
    $_.InterfaceAlias -notlike "*vEthernet*" -and 
    $_.InterfaceAlias -notlike "*WSL*" -and
    $_.IPAddress -notlike "169.254*" -and 
    $_.IPAddress -notlike "127.*" 
} | Select-Object -First 1

$wifiIp = if ($wifiEntry) { $wifiEntry.IPAddress } else { "192.168.0.110" }
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $wifiIp

$envPath = Join-Path $ProjectRoot ".env"
$defaultPreprodUrl = "https://cg-preprod-cin-ingress.purpleocean-4441f644.centralindia.azurecontainerapps.io"
$activeApiUrl = $defaultPreprodUrl

if ($ApiUrl) {
    $activeApiUrl = $ApiUrl
    $envContent = @"
# ClaimsGuru Mobile Environment Configuration
EXPO_PUBLIC_ENABLE_ENTRA_ID=false
EXPO_PUBLIC_API_URL=$activeApiUrl
"@
    Set-Content -Path $envPath -Value $envContent -Force
} elseif ($Local) {
    $activeApiUrl = "http://$($wifiIp):8000"
    $envContent = @"
# ClaimsGuru Mobile Environment Configuration
EXPO_PUBLIC_ENABLE_ENTRA_ID=false
EXPO_PUBLIC_API_URL=$activeApiUrl
"@
    Set-Content -Path $envPath -Value $envContent -Force
} elseif ($ForceEnv -or -not (Test-Path $envPath)) {
    $activeApiUrl = $defaultPreprodUrl
    $envContent = @"
# ClaimsGuru Mobile Environment Configuration
EXPO_PUBLIC_ENABLE_ENTRA_ID=false
EXPO_PUBLIC_API_URL=$activeApiUrl
"@
    Set-Content -Path $envPath -Value $envContent -Force
} else {
    # .env exists: preserve user's manual edits (do not overwrite!)
    $envLines = Get-Content $envPath
    foreach ($line in $envLines) {
        if ($line -match '^\s*EXPO_PUBLIC_API_URL\s*=\s*(.+)$') {
            $activeApiUrl = $matches[1].Trim()
        }
    }
}

Write-Host "Active Backend API: $activeApiUrl" -ForegroundColor Green
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

