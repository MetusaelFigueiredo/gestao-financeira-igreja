@echo off
echo 🚀 Iniciando processo de deploy...

echo 📦 Fazendo build do frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erro no build do frontend!
    pause
    exit /b 1
)
echo ✅ Build do frontend concluído!
cd ..

echo ☁️ Fazendo deploy completo...
call firebase deploy
if %errorlevel% neq 0 (
    echo ❌ Erro no deploy!
    pause
    exit /b 1
)

echo 🎉 Deploy completo realizado com sucesso!
echo 🌐 Acesse sua aplicação no Firebase Hosting URL
pause