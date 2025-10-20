@echo off
REM Start the frontend development server
start npm run dev --prefix liquidgen-app

REM Start the backend development server (assuming it's a Rust server)
cd liquidgen-server
start cargo run

echo Both servers are starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:4000