@echo off
echo Starting backend server...

:: Check if port 3001 is in use and kill the process if needed
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Found process using port 3001: %%a
    taskkill /F /PID %%a
    echo Process killed
    timeout /t 1 /nobreak >nul
)

:: Set the path to the Python executable from .venv
set PYTHON_PATH=%~dp0\.venv\Scripts\python.exe

:: Verify Python path exists
if not exist "%PYTHON_PATH%" (
    echo ERROR: Python executable not found at %PYTHON_PATH%
    echo Please make sure the virtual environment is set up correctly.
    exit /b 1
)

echo Using Python from: %PYTHON_PATH%

:: Set environment variable for the Node.js process to use
set PYTHON_EXECUTABLE=%PYTHON_PATH%

:: Start the Node.js server
echo Starting Node.js server...
npm run dev
