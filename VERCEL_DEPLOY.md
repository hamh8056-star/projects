# 🚀 Guide de Déploiement sur Vercel

## Prérequis

1. Compte GitHub (votre code doit être sur GitHub)
2. Compte Vercel ([https://vercel.com](https://vercel.com))

## Étapes de Déploiement

### 1. Préparer le Repository

Assurez-vous que tous les fichiers sont bien commités et poussés sur GitHub :

```bash
git add .
git commit -m "Préparation pour déploiement Vercel"
git push origin main
```

### 2. Importer le Projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Sélectionnez votre repository GitHub `aquaai`
4. Vercel détectera automatiquement Next.js

### 3. Configurer les Variables d'Environnement

Dans les **"Environment Variables"**, ajoutez :

#### Variables Obligatoires

```env
# MongoDB (utilisez MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/aquaai?retryWrites=true&w=majority

# NextAuth (générez avec: openssl rand -base64 32)
NEXTAUTH_SECRET=votre_secret_généré_ici
NEXTAUTH_URL=https://votre-app.vercel.app

# WebSocket (générez un token secret)
WS_PORT=4001
IOT_WS_TOKEN=votre_token_secret
NEXT_PUBLIC_IOT_WS_TOKEN=votre_token_secret

# API Base URL
API_BASE_URL=https://votre-app.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://votre-app.vercel.app

# Environment
NODE_ENV=production
```

### 4. Configurer le Build

Vercel détectera automatiquement Next.js, mais vérifiez que :
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (par défaut)
- **Output Directory**: `.next` (par défaut)
- **Install Command**: `npm install` (par défaut)

### 5. Déployer

1. Cliquez sur **"Deploy"**
2. Attendez la fin du build (5-10 minutes)
3. Vercel vous donnera une URL de déploiement

### 6. Mettre à Jour NEXTAUTH_URL

Après avoir obtenu votre URL Vercel :
1. Retournez dans **Settings** → **Environment Variables**
2. Mettez à jour :
   - `NEXTAUTH_URL` = `https://votre-app.vercel.app`
   - `API_BASE_URL` = `https://votre-app.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://votre-app.vercel.app`
3. Redéployez

## ⚠️ Notes Importantes

### WebSocket sur Vercel

⚠️ **ATTENTION**: Vercel ne supporte pas les WebSockets persistants avec les fonctions serverless. Vous avez deux options :

#### Option 1 : Désactiver le WebSocket (recommandé pour commencer)
- Le serveur WebSocket ne fonctionnera pas sur Vercel
- Les fonctionnalités temps réel ne seront pas disponibles
- L'application fonctionnera pour tout le reste

#### Option 2 : Utiliser un service externe pour WebSocket
- Déployer le serveur WebSocket (`server/ws-server.js`) sur un service séparé (Railway, Render, etc.)
- Mettre à jour `API_BASE_URL` pour pointer vers ce service

### Base de Données

- **Recommandé**: Utilisez MongoDB Atlas (gratuit disponible)
- Ne mettez JAMAIS votre URL MongoDB locale dans les variables d'environnement Vercel
- Assurez-vous que votre cluster MongoDB Atlas autorise les connexions depuis n'importe quelle IP (0.0.0.0/0) ou depuis les IPs de Vercel

## 🔧 Résolution des Problèmes

### Erreur "Module not found"

Si vous voyez des erreurs comme :
```
Module not found: Can't resolve '@/components/ui/select'
```

**Solution**: 
1. Vérifiez que tous les fichiers sont bien commités dans Git
2. Vérifiez que les imports utilisent la bonne casse (Linux est case-sensitive)
3. Vérifiez que les fichiers existent dans `src/components/ui/`

### Erreur de Build

Si le build échoue :
1. Vérifiez les logs de build dans Vercel
2. Testez le build localement : `npm run build`
3. Vérifiez que toutes les dépendances sont dans `package.json`

### Erreur d'Authentification

Si l'authentification ne fonctionne pas :
1. Vérifiez que `NEXTAUTH_SECRET` est défini
2. Vérifiez que `NEXTAUTH_URL` correspond à votre URL Vercel
3. Vérifiez les logs de la fonction serverless dans Vercel

## 📝 Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] URL accessible
- [ ] Authentification fonctionne
- [ ] MongoDB connecté
- [ ] NEXTAUTH_URL mis à jour avec l'URL Vercel

## 🔗 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

**Bon déploiement ! 🚀**
