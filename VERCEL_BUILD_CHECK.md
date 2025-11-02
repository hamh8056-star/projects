# ✅ Vérification avant Déploiement Vercel

## Fichiers Requis

Les fichiers suivants DOIVENT être présents et commités dans Git :

### Composants UI
- ✅ `src/components/ui/card.tsx`
- ✅ `src/components/ui/select.tsx`
- ✅ `src/components/ui/Loader.tsx`
- ✅ `src/components/ui/index.ts` (nouvellement créé)

## Commande pour Vérifier

```bash
# Vérifier que les fichiers existent
ls src/components/ui/

# Vérifier qu'ils sont dans Git
git ls-files src/components/ui/
```

## Si les fichiers ne sont pas dans Git

```bash
# Ajouter tous les fichiers UI
git add src/components/ui/
git commit -m "Ajout des composants UI pour Vercel"
git push
```

## Commandes de Build Locale (Test)

```bash
# Nettoyer
rm -rf .next node_modules

# Réinstaller
npm install

# Build de test
npm run build
```

## Solution Alternative - Utiliser l'index

Si le problème persiste, utilisez le fichier index pour les imports :

```typescript
// Au lieu de :
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import { Select } from "@/components/ui/select";

// Utilisez :
import { Card, Loader, Select } from "@/components/ui";
```

Mais les imports directs devraient fonctionner si les fichiers sont bien commités.

