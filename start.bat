@echo off
echo ========================================
echo 作业管理系统 - 启动脚本
echo ========================================
echo 请选择启动模式：
echo 1. 开发模式（前端5173端口，后端8080端口）
echo 2. 生产模式（构建前端并启动后端）
echo.
set /p choice="请选择 (1 或 2): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto prod

:dev
echo.
echo 启动开发模式...
echo.

REM 启动后端
cd server
start cmd /k "title 后端服务器 && go run ."

REM 等待2秒让后端启动
timeout /t 2 >nul

REM 启动前端
cd ../client
start cmd /k "title 前端开发服务器 && npm run dev"

echo.
echo 开发环境已启动！
echo 前端: http://localhost:5173
echo 后端: http://localhost:8080
echo.
pause
goto end

:prod
echo.
echo 启动生产模式...
echo.

REM 检查并构建前端
if exist "client\package.json" (
    echo 构建前端...
    cd client
    call npm run build
    if errorlevel 1 (
        echo 前端构建失败！
        pause
        exit /b 1
    )
    cd ..
) else (
    echo 错误：未找到前端目录！
    pause
    exit /b 1
)

REM 启动后端
cd server
echo 启动后端服务...
go run .

:end