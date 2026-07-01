# Script de inicio para Yo Aprendo
# Este script automatiza la configuración e inicio del proyecto.

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Iniciando Configuración de Yo Aprendo " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verificar si Python está realmente instalado y funcionando
$pythonInstalled = $false
try {
    $version = & python --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $version) {
        $pythonInstalled = $true
    }
} catch {
    $pythonInstalled = $false
}

# Fallback en caso de que la variable PATH aún no se haya actualizado en esta sesión
if (-not $pythonInstalled) {
    $localPythonPath = "$env:LOCALAPPDATA\Programs\Python\Python311"
    if (Test-Path "$localPythonPath\python.exe") {
        $env:PATH = "$localPythonPath;" + $env:PATH
        $pythonInstalled = $true
        Write-Host "[Python] Se detectó Python en la instalación local y se configuró en el PATH." -ForegroundColor Yellow
    }
}

if (-not $pythonInstalled) {
    Write-Host "`n[ERROR] Python no está instalado, no se encuentra en el PATH o es un acceso directo vacío." -ForegroundColor Red
    Write-Host "Para solucionarlo:" -ForegroundColor Yellow
    Write-Host "1. Abre una consola de PowerShell nueva y ejecuta:" -ForegroundColor White
    Write-Host "   winget install Python.Python.3.11" -ForegroundColor Green
    Write-Host "2. Cierra y vuelve a abrir tu editor o terminal." -ForegroundColor White
    Write-Host "3. Vuelve a ejecutar este script." -ForegroundColor White
    Exit 1
}

# 2. Configurar archivo .env
$envFile = Join-Path $PSScriptRoot ".env"
$envExample = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Write-Host "`n[Configuración] Creando archivo .env a partir de .env.example..." -ForegroundColor Yellow
        $envContent = Get-Content $envExample -Raw
        $randomSecret = [System.Guid]::NewGuid().ToString("N")
        $envContent = $envContent -replace "replace-with-a-long-random-value", $randomSecret
        $envContent | Out-File $envFile -Encoding utf8
        Write-Host "Archivo .env creado con un SESSION_SECRET seguro." -ForegroundColor Green
    } else {
        Write-Host "`n[Advertencia] No se encontró .env.example. Crea tu archivo .env manualmente si es necesario." -ForegroundColor Yellow
    }
}

# 3. Crear entorno virtual
$venvPath = Join-Path $PSScriptRoot "venv"
if (Test-Path $venvPath) {
    if (-not (Test-Path (Join-Path $venvPath "Scripts\pip.exe"))) {
        Write-Host "`n[Python] Limpiando entorno virtual incompleto o fallido anterior..." -ForegroundColor Yellow
        Remove-Item -Path $venvPath -Recurse -Force
    }
}
if (-not (Test-Path $venvPath)) {
    Write-Host "`n[Python] Creando entorno virtual (venv)..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Entorno virtual creado." -ForegroundColor Green
}

# 4. Instalar dependencias
Write-Host "`n[Python] Instalando dependencias de requirements.txt..." -ForegroundColor Yellow
$pipPath = Join-Path $venvPath "Scripts\pip.exe"
& $pipPath install -r (Join-Path $PSScriptRoot "requirements.txt")
Write-Host "Dependencias instaladas." -ForegroundColor Green

# 5. Iniciar Backend (en una nueva ventana para ver sus logs)
Write-Host "`n[Servidor] Iniciando backend de FastAPI en puerto 8001..." -ForegroundColor Yellow
$pythonVenvPath = Join-Path $venvPath "Scripts\python.exe"
$backendCmd = "-NoExit -Command & '$pythonVenvPath' -m uvicorn api.index:app --host 127.0.0.1 --port 8001"
Start-Process powershell -ArgumentList $backendCmd

# 6. Iniciar Frontend (en la ventana actual)
Write-Host "`n[Servidor] Iniciando servidor de frontend..." -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C en esta ventana para detener el servidor de frontend." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "frontend\dev-server.ps1")
