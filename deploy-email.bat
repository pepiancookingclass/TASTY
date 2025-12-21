@echo off
echo ========================================
echo    DESPLEGANDO FUNCION DE EMAIL
echo ========================================

echo.
echo 1. Verificando Supabase CLI...
supabase --version
if %errorlevel% neq 0 (
    echo ERROR: Supabase CLI no esta instalado
    echo Instala con: npm install -g supabase
    pause
    exit /b 1
)

echo.
echo 2. Verificando login...
supabase projects list >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No estas logueado en Supabase
    echo Ejecuta: supabase login
    pause
    exit /b 1
)

echo.
echo 3. Desplegando funcion send-email...
supabase functions deploy send-email --project-ref aitmxnfljglwpkpibgek

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    FUNCION DESPLEGADA EXITOSAMENTE!
    echo ========================================
    echo.
    echo SIGUIENTE PASO:
    echo 1. Ve a: https://supabase.com/dashboard/project/aitmxnfljglwpkpibgek/settings/edge-functions
    echo 2. Agrega la variable: RESEND_API_KEY=tu_api_key
    echo 3. Prueba la funcion con el comando curl del archivo
    echo.
    echo URL de la funcion:
    echo https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email
    echo.
) else (
    echo.
    echo ERROR: No se pudo desplegar la funcion
    echo Verifica tu conexion y permisos
)

pause
