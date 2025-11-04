# Script de Deploy para PowerShell
# Sistema de Gestão Financeira da Igreja

Write-Host "🚀 Iniciando processo de deploy..." -ForegroundColor Green

# 1. Fazer build do frontend
Write-Host "📦 Fazendo build do frontend..." -ForegroundColor Yellow
Set-Location "frontend"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do frontend!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build do frontend concluído!" -ForegroundColor Green
Set-Location ".."

# 2. Deploy das Cloud Functions
Write-Host "☁️ Fazendo deploy das Cloud Functions..." -ForegroundColor Yellow
firebase deploy --only functions

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no deploy das functions!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy das Cloud Functions concluído!" -ForegroundColor Green

# 3. Deploy do Hosting
Write-Host "🌐 Fazendo deploy do hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no deploy do hosting!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy do hosting concluído!" -ForegroundColor Green

# 4. Deploy das regras do Firestore e Storage
Write-Host "🔒 Fazendo deploy das regras..." -ForegroundColor Yellow
firebase deploy --only firestore:rules,storage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Aviso: Erro no deploy das regras (pode ser ignorado se não houver alterações)" -ForegroundColor Yellow
}

Write-Host "🎉 Deploy completo realizado com sucesso!" -ForegroundColor Green
Write-Host "🌐 Acesse sua aplicação no Firebase Hosting URL" -ForegroundColor Cyan