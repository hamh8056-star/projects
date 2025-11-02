#!/bin/bash

# Script pour vérifier et corriger les fichiers manquants pour Vercel

echo "🔍 Vérification des fichiers UI..."

# Vérifier que les fichiers existent
if [ ! -f "src/components/ui/card.tsx" ]; then
    echo "❌ src/components/ui/card.tsx manquant"
    exit 1
fi

if [ ! -f "src/components/ui/select.tsx" ]; then
    echo "❌ src/components/ui/select.tsx manquant"
    exit 1
fi

if [ ! -f "src/components/ui/Loader.tsx" ]; then
    echo "❌ src/components/ui/Loader.tsx manquant"
    exit 1
fi

if [ ! -f "src/components/ui/index.ts" ]; then
    echo "❌ src/components/ui/index.ts manquant"
    exit 1
fi

echo "✅ Tous les fichiers UI existent"

# Ajouter les fichiers à Git s'ils ne sont pas déjà trackés
echo "📦 Ajout des fichiers à Git..."
git add src/components/ui/card.tsx
git add src/components/ui/select.tsx
git add src/components/ui/Loader.tsx
git add src/components/ui/index.ts

echo "✅ Fichiers ajoutés à Git"
echo "💾 Commitez avec: git commit -m 'Fix: Ajout des composants UI pour Vercel'"
echo "📤 Puis poussez avec: git push"

