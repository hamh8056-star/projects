# 🚀 Guide de Déploiement Vercel - Corrections

## ❌ Erreurs Rencontrées

Lors du build sur Vercel, les erreurs suivantes apparaissent :
```
Module not found: Can't resolve '@/components/ui/select'
Module not found: Can't resolve '@/components/ui/card'
Module not found: Can't resolve '@/components/ui/Loader'
```

## ✅ Solution Étape par Étape

### 1. Vérifier que les fichiers existent localement

Les fichiers suivants DOIVENT exister :
- ✅ `src/components/ui/card.tsx`
- ✅ `src/components/ui/select.tsx`
- ✅ `src/components/ui/Loader.tsx`
- ✅ `src/components/ui/index.ts` (fichier d'index créé)

**Commande PowerShell :**
```powershell
.\fix-vercel-build.ps1
```

### 2. S'assurer que tous les fichiers sont dans Git

**Important :** Vercel déploie depuis Git. Si les fichiers ne sont pas commités, ils ne seront pas disponibles lors du build.

```bash
# Vérifier l'état Git
git status

# Ajouter tous les fichiers UI
git add src/components/ui/

# Vérifier ce qui a été ajouté
git status

# Commiter
git commit -m "Fix: Ajout des composants UI pour Vercel"

# Pousser sur GitHub
git push
```

### 3. Vérifier .gitignore

Assurez-vous que `src/components/ui/` n'est **PAS** dans `.gitignore`.

### 4. Vérifier les imports dans le code

Tous les imports doivent utiliser la bonne casse :

```typescript
// ✅ Correct
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";  // Notez le L majuscule
import { Select } from "@/components/ui/select";

// ❌ Incorrect
import { Card } from "@/components/ui/Card";  // Faux
import loader from "@/components/ui/loader";  // Faux
```

### 5. Alternative : Utiliser le fichier index

Si le problème persiste, utilisez le fichier `index.ts` :

```typescript
// Au lieu de :
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import { Select } from "@/components/ui/select";

// Utilisez :
import { Card, Loader, Select } from "@/components/ui";
```

### 6. Test de Build Local

Avant de déployer sur Vercel, testez le build localement :

```bash
# Nettoyer
rm -rf .next
rm -rf node_modules

# Réinstaller
npm install

# Build de test
npm run build
```

Si le build local fonctionne, le problème est probablement que les fichiers ne sont pas dans Git.

### 7. Déployer sur Vercel

Après avoir commité et poussé sur GitHub :

1. Vercel détectera automatiquement le nouveau commit
2. Le build se lancera automatiquement
3. Vérifiez les logs de build sur Vercel

## 📝 Checklist de Déploiement

- [ ] Tous les fichiers UI existent localement
- [ ] Tous les fichiers UI sont dans Git (`git status`)
- [ ] Les fichiers sont commités (`git commit`)
- [ ] Les fichiers sont poussés sur GitHub (`git push`)
- [ ] Le build local fonctionne (`npm run build`)
- [ ] Vercel a détecté le nouveau commit
- [ ] Le build Vercel réussit

## 🐛 Si le problème persiste

1. **Vérifiez les logs Vercel** : Allez dans votre projet Vercel → Deployments → Cliquez sur le dernier build → Voir les logs

2. **Vérifiez la casse des fichiers** : Sur Linux (Vercel), `Loader.tsx` et `loader.tsx` sont différents

3. **Forcez une réinstallation** : Dans Vercel, allez dans Settings → Build & Development Settings → Changez `Install Command` en :
   ```
   npm ci --legacy-peer-deps
   ```

4. **Vérifiez les paths dans tsconfig.json** :
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

## 📚 Fichiers Créés pour Aider

- ✅ `src/components/ui/index.ts` - Fichier d'index pour simplifier les imports
- ✅ `fix-vercel-build.ps1` - Script PowerShell de vérification
- ✅ `fix-vercel-build.sh` - Script Bash de vérification
- ✅ `VERCEL_BUILD_CHECK.md` - Guide de vérification
- ✅ `VERCEL_FIX.md` - Guide de correction
