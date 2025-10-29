@echo off
echo ========================================
echo        WalletCare - Servidor Mobile
echo ========================================
echo.

echo Verificando Python...
python --version
if %errorlevel% neq 0 (
    echo ERRO: Python nao encontrado!
    echo Instale Python 3.8+ em https://python.org
    pause
    exit /b 1
)

echo.
echo Verificando dependencias...
pip show flask >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando dependencias...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo     Obtendo IP da maquina...
echo ========================================

for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        echo IP Local: %%j:5000
        echo.
        echo Para acessar do celular, use:
        echo http://%%j:5000
        echo.
    )
)

echo ========================================
echo     WalletCare iniciado com sucesso!
echo ========================================
echo.
echo IMPORTANTE: Certifique-se de que:
echo 1. O celular esta na mesma rede WiFi
echo 2. O firewall permite conexoes na porta 5000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

python app.py
