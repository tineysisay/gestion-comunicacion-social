@echo off
REM ============================================================
REM  BACKUP DE LA BASE DE DATOS - Gestion de Comunicacion Social
REM  Doble clic para generar la copia.
REM  El archivo queda en la carpeta backups\ con fecha y hora.
REM ============================================================

setlocal

REM Configuracion (igual que backend\.env)
set MYSQLDUMP=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe
set USUARIO=root
set CONTRASENA=12345678
set BASEDATOS=gestion_comunicacion_social

REM Fecha y hora en el nombre del archivo
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmmss"') do set FECHA=%%i

if not exist "%~dp0backups" mkdir "%~dp0backups"

echo Generando backup de %BASEDATOS% ...
"%MYSQLDUMP%" -u %USUARIO% -p%CONTRASENA% --single-transaction --routines --triggers %BASEDATOS% > "%~dp0backups\backup_%BASEDATOS%_%FECHA%.sql"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo generar el backup. Verifique que MySQL este instalado en:
    echo        %MYSQLDUMP%
    echo.
    pause
    exit /b 1
)

echo.
echo Backup creado: backups\backup_%BASEDATOS%_%FECHA%.sql
echo.
pause
endlocal
