@echo off
cd /d "N:\Food Cart App"
echo === Building web assets ===
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo === Syncing Capacitor ===
call npx cap sync android
if %errorlevel% neq 0 exit /b %errorlevel%

echo === Building APK ===
cd android
call .\gradlew.bat assembleDebug
if %errorlevel% neq 0 exit /b %errorlevel%

echo === Installing on device ===
adb install -r "app\build\outputs\apk\debug\app-debug.apk"

echo === Done ===
