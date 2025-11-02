# Script PowerShell pour vérifier et corriger les fichiers manquants pour Vercel

Write-Host "🔍 Vérification des fichiers UI..." -ForegroundColor Cyan

# Vérifier que les fichiers existent
$files = @(
    "src/components/ui/card.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/Loader.tsx",
    "src/components/ui/index.ts"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file manquant" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "❌ Certains fichiers sont manquants!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tous les fichiers UI existent" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Pour ajouter les fichiers à Git, exécutez:" -ForegroundColor Yellow
Write-Host "   git add src/components/ui/" -ForegroundColor White
Write-Host "   git commit -m 'Fix: Ajout des composants UI pour Vercel'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White

