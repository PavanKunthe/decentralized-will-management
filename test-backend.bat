@echo off
echo === Testing Backend Certificate Upload ===
echo.

set CERT_PATH=C:\Users\Hemanth B\.gemini\antigravity\brain\a5cd9986-6013-4962-b89b-e955ba2c8be9\sample_death_certificate_1765869095118.png

if not exist "%CERT_PATH%" (
    echo Certificate not found at: %CERT_PATH%
    exit /b 1
)

echo Certificate found: %CERT_PATH%
echo.
echo Uploading to backend...
echo.

curl -X POST http://localhost:5000/upload-death-certificate -F "certificate=@%CERT_PATH%" -H "Content-Type: multipart/form-data"

echo.
echo.
echo Test complete!
