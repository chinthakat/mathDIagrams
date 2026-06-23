param (
    [string]$Action = ""
)

$AppDir = Join-Path -Path $PSScriptRoot -ChildPath "app"
$Port = 5173

function Stop-App {
    Write-Host "Stopping app on port $Port..." -ForegroundColor Yellow
    # Find any listening process on Vite's default port
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill) {
                # Try to stop the process gracefully, then forcefully
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process $pidToKill listening on port $Port." -ForegroundColor Green
            }
        }
    } else {
        Write-Host "No process found running on port $Port." -ForegroundColor Gray
    }
}

function Start-App {
    Write-Host "Starting app..." -ForegroundColor Yellow
    Set-Location -Path $AppDir
    # Starts npm run dev in a new command prompt window
    Start-Process cmd.exe -ArgumentList "/k npm run dev"
    Write-Host "App started in a new window. (Port 5173)" -ForegroundColor Green
}

if ($Action -eq "") {
    Write-Host "===========================" -ForegroundColor Cyan
    Write-Host " MathsDiagrams Management" -ForegroundColor Cyan
    Write-Host "===========================" -ForegroundColor Cyan
    Write-Host "1. Start App"
    Write-Host "2. Stop App"
    Write-Host "3. Restart App"
    $choice = Read-Host "Select an option (1-3)"
    switch ($choice) {
        "1" { $Action = "start" }
        "2" { $Action = "stop" }
        "3" { $Action = "restart" }
        default { Write-Host "Invalid option"; exit }
    }
}

switch ($Action.ToLower()) {
    "start" { Start-App }
    "stop" { Stop-App }
    "restart" { Stop-App; Start-App }
    default { Write-Host "Unknown action: $Action. Use start, stop, or restart." -ForegroundColor Red }
}
