$logFile = "N:\Food Cart App\build.log"
"=== Build started at $(Get-Date) ===" | Out-File $logFile

# Step 1: Build web
try {
    Push-Location "N:\Food Cart App"
    $result = cmd /c "npm run build 2>&1"
    $result | Out-File $logFile -Append
    if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
    "Web build OK" | Out-File $logFile -Append
    
    # Step 2: Sync capacitor
    $result = cmd /c "npx cap sync android 2>&1"
    $result | Out-File $logFile -Append
    "Capacitor sync OK" | Out-File $logFile -Append
    
    # Step 3: Build APK
    Push-Location "android"
    $result = cmd /c "gradlew.bat assembleDebug 2>&1"
    $result | Out-File $logFile -Append
    Pop-Location
    if ($LASTEXITCODE -ne 0) { throw "APK build failed" }
    "APK build OK" | Out-File $logFile -Append
    
    # Step 4: Install on device
    $result = cmd /c "adb install -r android/app/build/outputs/apk/debug/app-debug.apk 2>&1"
    $result | Out-File $logFile -Append
    "Install OK" | Out-File $logFile -Append
    
    "=== Build completed successfully ===" | Out-File $logFile -Append
} catch {
    "ERROR: $_" | Out-File $logFile -Append
} finally {
    Pop-Location
    "=== Build ended at $(Get-Date) ===" | Out-File $logFile -Append
}
