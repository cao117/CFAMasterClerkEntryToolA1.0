@echo off
REM Download Inter font files for local hosting
REM This eliminates the need for external Google Fonts dependencies

echo Downloading Inter font files...

REM Create fonts directory if it doesn't exist
if not exist "public\assets\fonts" mkdir "public\assets\fonts"

REM Download the required Inter font files using PowerShell
echo Downloading Inter-Regular.woff2...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2' -OutFile 'public\assets\fonts\Inter-Regular.woff2'"

echo Downloading Inter-Medium.woff2...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.woff2' -OutFile 'public\assets\fonts\Inter-Medium.woff2'"

echo Downloading Inter-SemiBold.woff2...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.woff2' -OutFile 'public\assets\fonts\Inter-SemiBold.woff2'"

echo Downloading Inter-Bold.woff2...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.woff2' -OutFile 'public\assets\fonts\Inter-Bold.woff2'"

echo ✅ Font files downloaded successfully!
echo The application will now use local Inter fonts instead of Google Fonts.
echo This eliminates external dependency timeouts in production.
pause 