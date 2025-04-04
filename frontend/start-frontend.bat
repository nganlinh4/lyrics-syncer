@echo off
echo Starting frontend server...

:: Check if port 3000 is in use and kill the process if needed
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process using port 3000: %%a
    taskkill /F /PID %%a
    echo Process killed
    timeout /t 1 /nobreak >nul
)

:: Start the React app
echo Starting React app...
npm start
