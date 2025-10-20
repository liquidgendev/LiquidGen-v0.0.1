@echo off
echo Installing frontend dependencies...
cd liquidgen-app
call npm install

echo.
echo Building frontend...
call npm run build

echo.
echo Building Rust server...
cd ..\liquidgen-server
call cargo build

echo.
echo Setup complete! You can now run dev.cmd to start both servers.