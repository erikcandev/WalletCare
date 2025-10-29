@echo off
echo ========================================
echo        WalletCare - Iniciando...
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
echo     WalletCare iniciado com sucesso!
echo ========================================
echo.
echo Acesse: http://localhost:5000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

python app.py
