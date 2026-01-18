@echo off
echo Cleaning and compiling Spring Boot Application...
cd /d "%~dp0"

echo Deleting old compiled classes...
if exist target\classes rmdir /s /q target\classes

echo Compiling with Maven...
"c:\Program Files\JetBrains\IntelliJ IDEA 2025.2\plugins\maven\lib\maven3\bin\mvn.cmd" clean compile

if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b %errorlevel%
)

echo Starting Spring Boot Application...
"c:\Program Files\JetBrains\IntelliJ IDEA 2025.2\plugins\maven\lib\maven3\bin\mvn.cmd" spring-boot:run
