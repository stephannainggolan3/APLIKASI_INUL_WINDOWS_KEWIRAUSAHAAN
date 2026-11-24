@echo off
title BoysClub IT - Server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js belum terpasang. Unduh dari https://nodejs.org lalu jalankan file ini lagi.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Aplikasi sudah berjalan. Membuka http://localhost:3000 ...
  start "" http://localhost:3000
  ping -n 3 127.0.0.1 >nul
  exit /b 0
)

set PERLU_INSTALL=0
if not exist "node_modules\express" set PERLU_INSTALL=1
if not exist "node_modules\google-auth-library" set PERLU_INSTALL=1
if not exist ".env" copy ".env.example" ".env" >nul
if "%PERLU_INSTALL%"=="1" (
  echo Memasang dependensi, mohon tunggu...
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo [!] Gagal memasang dependensi. Periksa koneksi internet.
    pause
    exit /b 1
  )
)

echo.
echo  ==============================================
echo   BoysClub IT berjalan di http://localhost:3000
echo   JANGAN tutup jendela ini selama aplikasi dipakai.
echo  ==============================================
echo.

start "" http://localhost:3000
node --no-warnings --env-file-if-exists=.env server.js

echo.
echo Server berhenti. Jika ada pesan error di atas, kirimkan ke tim.
pause
