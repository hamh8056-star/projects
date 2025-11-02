# 🚀 Guide de Déploiement sur Vercel

Ce guide vous explique comment déployer votre application AquaAI Next.js avec WebSocket et MongoDB sur Vercel.

## ⚠️ Limitations de Vercel

**Important** : Vercel utilise des fonctions serverless qui ne supportent **pas nativement les WebSockets persistants**. Vous avez deux options :

1. **Option 1 (Recommandé)** : Utiliser un service séparé pour le WebSocket (Railway, Render, ou un VPS)
2. **Option 2** : Utiliser Vercel avec des solutions alternatives (Server-Sent Events, Polling)

## 📋 Prérequis

1. Un compte GitHub
2. Un compte Vercel ([https://vercel.com](https://vercel.com))
3. Un compte MongoDB Atlas (gratuit disponible)
4. (Optionnel) Un service pour héberger le WebSocket (Railway, Render, etc.)

## 🗄️ Étape 1 : Configurer MongoDB Atlas

### 1.1 Créer un Cluster MongoDB

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un compte gratuit
3. Créez un nouveau cluster (M0 Free Tier disponible)
4. Attendez que le cluster soit créé (5-10 minutes)

### 1.2 Configurer l'accès réseau

1. Dans **Network Access**, cliquez sur **Add IP Address**
2. Pour le développement : **Allow Access from Anywhere** (`0.0.0.0/0`)
3. Cliquez sur **Confirm**

### 1.3 Créer un utilisateur de base de données

1. Dans **Database Access**, cliquez sur **Add New Database User**
2. Choisissez **Password** comme méthode d'authentification
3. Créez un nom d'utilisateur et un mot de passe (notez-les !)
4. Donnez les permissions **Read and write to any database**
5. Cliquez sur **Add User**

### 1.4 Obtenir l'URI de connexion

1. Dans votre cluster, cliquez sur **Connect**
2. Choisissez **Connect your application**
3. Copiez l'URI de connexion :
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Remplacez `<username>` et `<password>` par vos identifiants
5. Ajoutez le nom de la base de données : `/aquaai` à la fin

## 🚀 Étape 2 : Déployer sur Vercel

### 2.1 Préparer le code

1. Assurez-vous que votre code est sur GitHub :
   ```bash
   git add .
   git commit -m "Préparation pour déploiement Vercel"
   git push origin main
   ```

### 2.2 Créer un projet Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Add New Project**
3. Importez votre repository GitHub
4. Vercel détectera automatiquement Next.js

### 2.3 Configurer les Variables d'Environnement

Dans les paramètres du projet Vercel, ajoutez ces variables :

#### Variables Obligatoires

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aquaai?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=https://votre-projet.vercel.app
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>

# API Base URL
API_BASE_URL=https://votre-projet.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://votre-projet.vercel.app

# Node Environment
NODE_ENV=production
```

#### Variables WebSocket (si vous utilisez un service séparé)

```env
# WebSocket Server URL (si hébergé séparément)
WS_URL=wss://votre-websocket-server.com
WS_PORT=4001
IOT_WS_TOKEN=<votre-token-secret>
NEXT_PUBLIC_IOT_WS_TOKEN=<même-token>
```

### 2.4 Configuration Vercel

Le fichier `vercel.json` a été créé automatiquement. Il configure :
- Le build Next.js
- Les régions de déploiement
- La durée maximale des fonctions serverless (30 secondes)

### 2.5 Déployer

1. Vercel va automatiquement détecter Next.js et déployer
2. Le build prendra 3-5 minutes
3. Une fois terminé, vous obtiendrez une URL : `https://votre-projet.vercel.app`

## 🔌 Étape 3 : Gérer le WebSocket (Important)

Vercel ne supporte pas les WebSockets persistants. Vous avez deux solutions :

### Option A : Service WebSocket séparé (Recommandé)

Déployez le serveur WebSocket sur un autre service :

#### Sur Railway :

1. Créez un nouveau projet Railway
2. Créez un nouveau service
3. Utilisez ce `Procfile` :
   ```
   web: node server/ws-server.js
   ```
4. Configurez les variables d'environnement :
   ```env
   WS_PORT=4001
   IOT_WS_TOKEN=<token-secret>
   API_BASE_URL=https://votre-projet.vercel.app
   MONGODB_URI=<même-uri-que-vercel>
   ```
5. Obtenez l'URL du WebSocket : `wss://votre-ws.railway.app`

#### Sur Render :

1. Créez un compte sur [Render.com](https://render.com)
2. Créez un nouveau **Web Service**
3. Connectez votre repository GitHub
4. Configurez :
   - **Build Command** : `npm install`
   - **Start Command** : `node server/ws-server.js`
   - **Environment** : Node
5. Configurez les variables d'environnement

### Option B : Adapter le code pour Vercel

Modifiez votre code pour utiliser Server-Sent Events ou Polling au lieu de WebSockets :

```typescript
// Utiliser des API routes pour le polling au lieu de WebSocket
// Exemple : GET /api/realtime-data qui retourne les données en temps réel
```

## 📝 Étape 4 : Mettre à jour les variables après déploiement

1. Une fois déployé, copiez votre URL Vercel : `https://votre-projet.vercel.app`
2. Dans Vercel, allez dans **Settings** → **Environment Variables**
3. Mettez à jour :
   - `NEXTAUTH_URL` = `https://votre-projet.vercel.app`
   - `API_BASE_URL` = `https://votre-projet.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://votre-projet.vercel.app`
4. Si vous utilisez un WebSocket séparé :
   - `WS_URL` = `wss://votre-websocket-server.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://votre-websocket-server.com`
5. Redéployez (Vercel redéploie automatiquement quand vous modifiez les variables)

## 🔧 Étape 5 : Adapter le code pour Vercel

### 5.1 Modifier les connexions WebSocket

Dans vos composants React, utilisez l'URL du WebSocket depuis les variables d'environnement :

```typescript
// Dans votre composant
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001';
const ws = new WebSocket(`${wsUrl}?token=${token}`);
```

### 5.2 Créer vercel.json

Créez un fichier `vercel.json` à la racine :

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

### 5.3 Exclure le serveur WebSocket du build Vercel

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "next build"
  }
}
```

## ✅ Étape 6 : Initialiser la base de données

Après le déploiement :

1. Visitez : `https://votre-projet.vercel.app/api/init-db`
2. Cela créera les utilisateurs par défaut
3. Ou utilisez le script : `node scripts/seed-users.ts` localement avec la même URI MongoDB

## 🔍 Étape 7 : Vérification

### Checklist de vérification :

- [ ] Application déployée sur Vercel
- [ ] Variables d'environnement configurées
- [ ] MongoDB Atlas connecté
- [ ] Base de données initialisée
- [ ] Authentification fonctionne
- [ ] WebSocket fonctionne (si service séparé)
- [ ] Toutes les pages accessibles

### Tester :

1. **Page d'accueil** : `https://votre-projet.vercel.app`
2. **Authentification** : `https://votre-projet.vercel.app/auth/signin`
3. **Dashboard** : `https://votre-projet.vercel.app/dashboard`

## 🐛 Dépannage

### Erreur de connexion MongoDB

- Vérifiez que l'IP de Vercel est autorisée dans MongoDB Atlas
- Vérifiez que l'URI est correcte (avec `/aquaai` à la fin)
- Vérifiez les credentials de l'utilisateur MongoDB

### WebSocket ne fonctionne pas

- Vercel ne supporte pas les WebSockets persistants
- Utilisez un service séparé (Railway, Render) pour le WebSocket
- Ou adaptez le code pour utiliser Server-Sent Events

### Erreur de build

- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que `NODE_ENV=production` est défini
- Consultez les logs de build dans Vercel

### Variables d'environnement non chargées

- Redéployez après avoir ajouté les variables
- Vérifiez que les noms des variables sont corrects (case-sensitive)
- Les variables `NEXT_PUBLIC_*` sont accessibles côté client

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/concepts/frameworks/nextjs)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## ⚠️ Notes Importantes

1. **WebSocket** : Vercel ne supporte pas les WebSockets. Vous devez utiliser un service séparé ou adapter votre code.
2. **Build Time** : Le build sur Vercel est rapide (3-5 minutes)
3. **Automatic Deploys** : Vercel redéploie automatiquement à chaque push sur GitHub
4. **MongoDB Atlas** : Le tier gratuit (M0) est suffisant pour commencer
5. **Variables d'environnement** : Les variables `NEXT_PUBLIC_*` sont accessibles côté client

## 🔄 Migration depuis Railway vers Vercel

Si vous étiez sur Railway :

1. Les variables d'environnement sont similaires
2. MongoDB reste sur Atlas (pas besoin de changer)
3. WebSocket doit être déployé séparément
4. Adaptez `vercel.json` au lieu de `railway.json`

---

**Bon déploiement sur Vercel ! 🚀**

