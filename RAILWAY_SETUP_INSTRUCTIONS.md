# 📝 Instructions de Configuration Railway - Étape par Étape

## 🎯 Objectif

Déployer Next.js + WebSocket + MongoDB sur Railway avec **deux services séparés** (recommandé).

---

## 📋 Étape 1 : Créer le Projet Railway

1. Allez sur [railway.app](https://railway.app)
2. Connectez-vous avec GitHub
3. Cliquez sur **"New Project"**
4. Sélectionnez **"Deploy from GitHub repo"**
5. Autorisez l'accès GitHub
6. Sélectionnez votre repository `aquaai`

---

## 🗄️ Étape 2 : Ajouter MongoDB

### Option A : MongoDB Atlas (Recommandé)

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un compte/cluster gratuit
3. **Network Access** → Ajoutez `0.0.0.0/0`
4. **Database Access** → Créez un utilisateur
5. **Connect** → **Connect your application** → Copiez l'URI
6. Format : `mongodb+srv://user:pass@cluster.mongodb.net/aquaai?retryWrites=true&w=majority`

### Option B : MongoDB Railway

1. Dans Railway, cliquez sur **"+ New"**
2. **"Database"** → **"MongoDB"**
3. Attendez 2-3 minutes
4. Cliquez sur la base → **"Variables"** → Copiez `MONGO_URL`

---

## 🚀 Étape 3 : Créer le Service Next.js

1. Dans Railway, votre projet devrait avoir déjà un service (Next.js détecté automatiquement)
2. Si non, cliquez sur **"+ New"** → **"Service"** → **"GitHub Repo"** → Sélectionnez votre repo
3. Nommez-le : `nextjs-app` (optionnel)

### Configurer le Service Next.js

1. Cliquez sur le service Next.js
2. **Settings** → **Deploy**
3. **Start Command** : Changez pour `npm start` (au lieu de `npm run start:prod`)
   - Cela lance uniquement Next.js, sans WebSocket
4. Cliquez sur **"Save"**

### Variables d'environnement pour Next.js

Dans **Variables**, ajoutez :

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aquaai?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=https://votre-app.railway.app
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>

# API URLs (mise à jour après déploiement)
API_BASE_URL=https://votre-app.railway.app
NEXT_PUBLIC_API_BASE_URL=https://votre-app.railway.app

# WebSocket URL (sera mise à jour après création du service WebSocket)
NEXT_PUBLIC_WS_URL=wss://votre-websocket.railway.app

# WebSocket Token
NEXT_PUBLIC_IOT_WS_TOKEN=<générez-un-token-secret>

# Environnement
NODE_ENV=production
```

---

## 🔌 Étape 4 : Créer le Service WebSocket

1. Dans Railway, cliquez sur **"+ New"**
2. **"Service"** → **"GitHub Repo"**
3. Sélectionnez le **même repository** `aquaai`
4. Nommez-le : `websocket-server` (optionnel)

### Configurer le Service WebSocket

1. Cliquez sur le service WebSocket
2. **Settings** → **Deploy**
3. **Start Command** : `node server/ws-server.js`
4. **Root Directory** : `/` (laissez vide)
5. Cliquez sur **"Save"**

### Variables d'environnement pour WebSocket

Dans **Variables**, ajoutez :

```env
# MongoDB (même URI que Next.js)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aquaai?retryWrites=true&w=majority

# WebSocket
WS_PORT=4001
IOT_WS_TOKEN=<même-token-que-NEXT_PUBLIC_IOT_WS_TOKEN>

# API Base URL (URL du service Next.js)
API_BASE_URL=https://votre-app.railway.app
```

---

## 🔄 Étape 5 : Obtenir les URLs et Mettre à Jour

### 5.1 Obtenir l'URL Next.js

1. Cliquez sur le service Next.js
2. **Settings** → **Networking**
3. Cliquez sur **"Generate Domain"** (si pas déjà fait)
4. Copiez l'URL : `https://xxx-production.up.railway.app`

### 5.2 Obtenir l'URL WebSocket

1. Cliquez sur le service WebSocket
2. **Settings** → **Networking**
3. Cliquez sur **"Generate Domain"**
4. Copiez l'URL : `https://yyy-production.up.railway.app`
5. Notez : Utilisez `wss://` (WebSocket Secure) au lieu de `https://`

### 5.3 Mettre à Jour les Variables

#### Service Next.js → Variables :

```env
NEXTAUTH_URL=https://xxx-production.up.railway.app
API_BASE_URL=https://xxx-production.up.railway.app
NEXT_PUBLIC_API_BASE_URL=https://xxx-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://yyy-production.up.railway.app
```

#### Service WebSocket → Variables :

```env
API_BASE_URL=https://xxx-production.up.railway.app
```

Railway redéploiera automatiquement après chaque modification de variable.

---

## ✅ Étape 6 : Vérifier le Déploiement

### 6.1 Vérifier Next.js

1. Visitez l'URL Next.js : `https://xxx-production.up.railway.app`
2. La page d'accueil devrait s'afficher
3. Vérifiez les logs du service Next.js pour voir les erreurs éventuelles

### 6.2 Vérifier WebSocket

1. Cliquez sur le service WebSocket → **Logs**
2. Recherchez :
   ```
   🚀 WebSocket Server démarré sur ws://localhost:4001
   🔐 Token de sécurité: ...
   📡 Prêt à recevoir les données IoT
   ```

### 6.3 Tester l'Application

1. Visitez : `https://xxx-production.up.railway.app/auth/signin`
2. Initialisez la base : `https://xxx-production.up.railway.app/api/init-db`
3. Connectez-vous avec : `admin@aqua.com` / `admin`
4. Allez sur le Dashboard
5. Vérifiez que le WebSocket se connecte (dans la console du navigateur)

---

## 🎯 Résumé des URLs

Après le déploiement, vous aurez :

- **Next.js** : `https://xxx-production.up.railway.app`
- **WebSocket** : `wss://yyy-production.up.railway.app`
- **MongoDB** : Via MongoDB Atlas ou Railway MongoDB

---

## 🔧 Alternative : Un Seul Service (Simple mais Limité)

Si vous préférez un seul service (WebSocket non accessible depuis l'extérieur) :

1. Un seul service Next.js
2. **Start Command** : `npm run start:prod` (laissez tel quel)
3. Variables comme indiqué dans `RAILWAY_DEPLOY.md`

**⚠️ Limitation** : Le WebSocket ne sera accessible qu'en interne, pas depuis vos devices IoT externes.

---

## 📚 Guides Complémentaires

- **`RAILWAY_COMPLETE_GUIDE.md`** : Guide complet avec toutes les options
- **`RAILWAY_DEPLOY.md`** : Guide standard (un service)
- **`RAILWAY_QUICK_START.md`** : Version rapide

---

**Bon déploiement ! 🚀**

