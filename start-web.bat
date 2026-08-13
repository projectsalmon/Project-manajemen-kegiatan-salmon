@echo off
setlocal
echo ===================================================
echo Membuka Aplikasi Kegiatan Kelurahan di Web Browser
echo ===================================================

set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

cd /d "%~dp0react-native-salmon"

echo.
echo Membuka http://localhost:8081 di browser...
start http://localhost:8081

call npx serve dist -p 8081 -s

pause
