@echo off
setlocal
echo ===================================================
echo   Build File APK Android (Komuniva - Official Release)
echo ===================================================
echo.
echo Menyiapkan proses kompilasi APK Standalone (Offline Bundle)...
echo Menggunakan Google Play Services Auth dan Plus Jakarta Sans...
echo.

cd /d "%~dp0react-native-salmon\android"

call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo    BUILD BERHASIL! Standalone APK Siap Pakai
    echo ===================================================
    copy /y "%~dp0react-native-salmon\android\app\build\outputs\apk\release\app-release.apk" "%~dp0Komuniva-Official.apk" >nul
    copy /y "%~dp0react-native-salmon\android\app\build\outputs\apk\release\app-release.apk" "%~dp0Komuniva-v2.0.1.apk" >nul
    copy /y "%~dp0react-native-salmon\android\app\build\outputs\apk\release\app-release.apk" "%~dp0Komuniva.apk" >nul
    echo.
    echo File APK sudah siap di folder utama:
    echo --^> Komuniva-Official.apk
    echo --^> Komuniva-v2.0.1.apk
    echo --^> Komuniva.apk
    echo.
    echo Anda dapat langsung menyalin file ini ke HP dan menginstallnya!
) else (
    echo.
    echo [ERROR] Terjadi kesalahan saat build APK.
)

echo.
pause
