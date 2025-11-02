# 🚀 Guide Étape par Étape : Déploiement sur Vercel

## 🎯 Objectif

Déployer votre application AquaAI sur Vercel avec **le minimum d'intervention possible**.

## ⚠️ Important : Limitation WebSocket

**Vercel ne supporte pas les WebSockets persistants** (fonctions serverless). Vous avez deux options :

1. **Option 1 (Recommandé)** : Déployer le WebSocket sur un service séparé (Railway, Render)
2. **Option 2** : Adapter le code pour utiliser Polling/SSE au lieu de WebSocket

## ⏱️ Temps Total : 5-10 minutes

---

## 📝 ÉTAPE 1 : Préparer le Code (1 minute)

### 1.1 Vérifier que votre code est sur GitHub

```bash
# Si votre code n'est pas encore sur GitHub
git add .
git commit -m "Configuration pour déploiement Vercel"
git push origin main
```

### 1.2 Vérifier les fichiers de configuration

Assurez-vous que ces fichiers existent :
- ✅ `vercel.json` - Configuration Vercel
- ✅ `.vercelignore` - Fichiers à ignorer

---

## 🌐 ÉTAPE 2 : Configurer MongoDB Atlas (2 minutes)

### 2.1 Créer un compte MongoDB Atlas

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un compte gratuit
3. Créez un nouveau cluster (choisissez **M0 Free Tier**)

### 2.2 Configurer l'accès réseau

1. Dans **Network Access**, cliquez sur **"Add IP Address"**
2. Cliquez sur **"Allow Access from Anywhere"** (ajoute `0.0.0.0/0`)
3. Cliquez sur **"Confirm"**

### 2.3 Créer un utilisateur de base de données

1. Dans **Database Access**, cliquez sur **"Add New Database User"**
2. Choisissez **"Password"** comme méthode d'authentification
3. Créez un nom d'utilisateur (ex: `aquaai-user`)
4. Créez un mot de passe fort (notez-le !)
5. Donnez les permissions **"Read and write to any database"**
6. Cliquez sur **"Add User"**

### 2.4 Obtenir l'URI de connexion

1. Dans votre cluster, cliquez sur **"Connect"**
2. Choisissez **"Connect your application"**
3. Copiez l'URI qui ressemble à :
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **Remplacez** `<username>` et `<password>` par vos identifiants
5. **Ajoutez** `/aquaai` à la fin pour spécifier la base de données :
   ```
   mongodb+srv://aquaai-user:VotreMotDePasse@cluster0.xxxxx.mongodb.net/aquaai?retryWrites=true&w=majority
   ```

**📋 Copiez cette URI complète**, vous en aurez besoin à l'étape 4.

---

## 🔐 ÉTAPE 3 : Générer les Secrets (30 secondes)

### 3.1 Générer NEXTAUTH_SECRET

Ouvrez un terminal et exécutez :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**📋 Copiez la valeur générée**, c'est votre `NEXTAUTH_SECRET`.

### 3.2 Générer IOT_WS_TOKEN (si vous utilisez WebSocket)

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**📋 Copiez la valeur générée**, c'est votre `IOT_WS_TOKEN`.

---

## 🚀 ÉTAPE 4 : Créer le Projet Vercel (1 minute)

### 4.1 Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"** → **"Continue with GitHub"**
3. Autorisez Vercel à accéder à votre compte GitHub

### 4.2 Importer votre projet

1. Une fois connecté, cliquez sur **"Add New Project"**
2. Vous verrez la liste de vos repositories GitHub
3. Trouvez et sélectionnez votre repository `aquaai`
4. Cliquez sur **"Import"**

### 4.3 Configuration du projet

Vercel détecte automatiquement Next.js. Vous verrez :

- **Framework Preset** : Next.js (détecté automatiquement)
- **Root Directory** : `./` (laissez par défaut)
- **Build Command** : `npm run build` (automatique)
- **Output Directory** : `.next` (automatique)
- **Install Command** : `npm install` (automatique)

**Ne modifiez rien**, cliquez directement sur **"Deploy"** !

**⏳ Laissez Vercel déployer pendant 2-5 minutes...**

---

## ⚙️ ÉTAPE 5 : Configurer les Variables d'Environnement (2 minutes)

**⚠️ Important** : Vous pouvez configurer les variables AVANT ou APRÈS le premier déploiement.

### 5.1 Accéder aux variables d'environnement

1. Dans votre projet Vercel, allez dans **"Settings"**
2. Cliquez sur **"Environment Variables"** dans le menu de gauche

### 5.2 Ajouter les variables

Cliquez sur **"Add New"** pour chaque variable et ajoutez :

#### Variables MongoDB

```
Key: MONGODB_URI
Value: mongodb+srv://aquaai-user:VotreMotDePasse@cluster0.xxxxx.mongodb.net/aquaai?retryWrites=true&w=majority
Environment: Production, Preview, Development (sélectionnez tous)
```

#### Variables NextAuth

```
Key: NEXTAUTH_URL
Value: https://votre-projet.vercel.app
Environment: Production, Preview, Development
Note: Mettez à jour cette valeur après avoir obtenu votre URL Vercel
```

```
Key: NEXTAUTH_SECRET
Value: <la-valeur-générée-à-l-étape-3>
Environment: Production, Preview, Development
```

#### Variables WebSocket (si vous utilisez un WebSocket séparé)

```
Key: NEXT_PUBLIC_WS_URL
Value: wss://votre-websocket-server.com
Environment: Production, Preview, Development
Note: Mettez cette valeur après avoir déployé le WebSocket
```

```
Key: IOT_WS_TOKEN
Value: <la-valeur-générée-à-l-étape-3>
Environment: Production, Preview, Development
```

```
Key: NEXT_PUBLIC_IOT_WS_TOKEN
Value: <même-valeur-que-IOT_WS_TOKEN>
Environment: Production, Preview, Development
```

#### Variables API

```
Key: API_BASE_URL
Value: https://votre-projet.vercel.app
Environment: Production, Preview, Development
Note: Mettez à jour après avoir obtenu votre URL
```

```
Key: NEXT_PUBLIC_API_BASE_URL
Value: https://votre-projet.vercel.app
Environment: Production, Preview, Development
Note: Mettez à jour après avoir obtenu votre URL
```

#### Variable Environnement

```
Key: NODE_ENV
Value: production
Environment: Production, Preview, Development
```

### 5.3 Enregistrer les variables

Cliquez sur **"Save"** après avoir ajouté chaque variable.

**⚠️ Important** : Vercel redéploiera automatiquement après avoir ajouté les variables.

---

## 🌐 ÉTAPE 6 : Obtenir votre URL Vercel (30 secondes)

Après le déploiement :

1. Vercel vous donne automatiquement une URL
2. Vous pouvez la voir en haut de votre dashboard
3. Format : `https://aquaai-xxxxx.vercel.app` ou `https://aquaai.vercel.app`
4. Cliquez sur cette URL pour l'ouvrir

**📋 Copiez votre URL**, vous en aurez besoin à l'étape suivante.

---

## 🔄 ÉTAPE 7 : Mettre à jour les Variables avec l'URL (30 secondes)

Maintenant que vous avez votre URL Vercel :

1. Retournez dans **Settings** → **Environment Variables**
2. Mettez à jour ces 3 variables avec votre URL Vercel :
   - `NEXTAUTH_URL` = `https://votre-projet.vercel.app`
   - `API_BASE_URL` = `https://votre-projet.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://votre-projet.vercel.app`
3. Cliquez sur **"Save"** pour chaque variable
4. Vercel **redéploie automatiquement**

---

## 🔌 ÉTAPE 8 : Déployer le WebSocket (Optionnel mais Recommandé)

**Important** : Vercel ne supporte pas les WebSockets. Si vous avez besoin du WebSocket, déployez-le séparément.

### Option A : Déployer sur Railway (Recommandé)

1. Allez sur [railway.app](https://railway.app)
2. Créez un nouveau projet
3. Créez un nouveau service
4. Connectez le même repository GitHub
5. Configurez :
   - **Root Directory** : `/`
   - **Build Command** : `npm install` (pas de build)
   - **Start Command** : `node server/ws-server.js`
6. Ajoutez les variables d'environnement :
   ```
   WS_PORT=4001
   IOT_WS_TOKEN=<même-token-que-vercel>
   API_BASE_URL=https://votre-projet.vercel.app
   MONGODB_URI=<même-uri-que-vercel>
   ```
7. Railway génère une URL publique pour le WebSocket
8. Copiez cette URL : `wss://votre-ws.railway.app`
9. Dans Vercel, mettez à jour `NEXT_PUBLIC_WS_URL` avec cette URL

### Option B : Déployer sur Render

1. Allez sur [render.com](https://render.com)
2. Créez un nouveau **Web Service**
3. Connectez votre repository GitHub
4. Configurez :
   - **Build Command** : `npm install`
   - **Start Command** : `node server/ws-server.js`
   - **Environment** : Node
5. Ajoutez les variables d'environnement (comme Railway)
6. Copiez l'URL générée et mettez à jour `NEXT_PUBLIC_WS_URL` dans Vercel

---

## ✅ ÉTAPE 9 : Initialiser la Base de Données (10 secondes)

Une fois le redéploiement terminé :

1. Visitez votre URL Vercel dans un navigateur : `https://votre-projet.vercel.app`
2. Visitez cette page : `https://votre-projet.vercel.app/api/init-db`
3. Cela créera automatiquement les utilisateurs par défaut :
   - **Admin** : `admin@aqua.com` / `admin`
   - **Opérateur** : `operateur@aqua.com` / `operateur`
   - **Observateur** : `observateur@aqua.com` / `observateur`

---

## 🎉 Félicitations !

Votre application est maintenant déployée sur Vercel !

### 🧪 Tester l'application

1. **Page d'accueil** : `https://votre-projet.vercel.app`
2. **Connexion** : `https://votre-projet.vercel.app/auth/signin`
   - Utilisez : `admin@aqua.com` / `admin`
3. **Dashboard** : `https://votre-projet.vercel.app/dashboard`

---

## 🔄 Déploiements Automatiques

**La meilleure partie** : Vercel redéploie **automatiquement** à chaque push sur GitHub !

1. Vous modifiez votre code localement
2. Vous faites :
   ```bash
   git add .
   git commit -m "Vos modifications"
   git push origin main
   ```
3. Vercel détecte automatiquement le changement
4. Vercel redéploie automatiquement
5. **Aucune intervention nécessaire !** 🎉

### Déploiements de branches

- **Push sur `main`** → Déploiement en production
- **Push sur une autre branche** → Déploiement de prévisualisation (URL unique)

---

## 🐛 Dépannage Rapide

### Le build échoue

**Problème** : Erreur pendant le build
**Solution** :
- Vérifiez les logs dans Vercel → Deployments → Cliquez sur le déploiement → Logs
- Assurez-vous que toutes les variables d'environnement sont définies
- Vérifiez que `next.config.ts` est correctement configuré

### Erreur de conflit de dépendances (peer dependencies)

**Problème** : `npm error Conflicting peer dependency: mongodb@5.9.2`
**Solution** :
- Le fichier `vercel.json` est déjà configuré avec `--legacy-peer-deps`
- Le fichier `.npmrc` est présent avec `legacy-peer-deps=true`
- Si l'erreur persiste, vérifiez que `package.json` utilise `mongodb@^5.9.2` (pas la version 6)

### Erreur 401 lors de la connexion

**Problème** : Authentification échoue
**Solution** :
- Vérifiez que `NEXTAUTH_SECRET` est défini
- Vérifiez que `NEXTAUTH_URL` correspond exactement à votre URL Vercel (avec `https://`)
- Visitez `/api/fix-observateur` pour corriger les utilisateurs

### MongoDB erreur de connexion

**Problème** : Erreur de connexion MongoDB
**Solution** :
- Vérifiez que l'URI MongoDB est correcte
- Vérifiez que `0.0.0.0/0` est autorisé dans MongoDB Atlas Network Access
- Vérifiez les credentials de l'utilisateur MongoDB

### WebSocket ne fonctionne pas

**Problème** : WebSocket ne se connecte pas
**Solution** :
- Vercel ne supporte pas les WebSockets
- Vous devez déployer le WebSocket sur un service séparé (Railway, Render)
- Vérifiez que `NEXT_PUBLIC_WS_URL` est correct (utilisez `wss://` en production)
- Vérifiez que le WebSocket est bien déployé et accessible

### Variables d'environnement non chargées

**Problème** : Les variables ne sont pas prises en compte
**Solution** :
- Redéployez après avoir ajouté les variables
- Vérifiez que les variables sont définies pour le bon environnement (Production, Preview, Development)
- Les variables `NEXT_PUBLIC_*` sont accessibles côté client
- Les autres variables sont uniquement côté serveur

---

## 📊 Architecture sur Vercel

```
┌─────────────────────────────────┐
│         Vercel                  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   Next.js (Serverless)    │  │
│  │   - Pages statiques       │  │
│  │   - API Routes            │  │
│  │   - Server Components     │  │
│  └───────────────────────────┘  │
│                                 │
│  ⚠️ Pas de WebSocket supporté   │
└─────────────────────────────────┘
              │
              │ (optionnel)
              ▼
┌─────────────────────────────────┐
│   Service WebSocket séparé      │
│   (Railway, Render, etc.)       │
│                                 │
│  - WebSocket Server             │
│  - Port 4001                    │
│  - wss://                      │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   MongoDB Atlas                 │
│                                 │
│  - Base de données              │
│  - Accès depuis Vercel          │
│  - Accès depuis WebSocket       │
└─────────────────────────────────┘
```

---

## 📚 Ressources Utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js sur Vercel](https://vercel.com/docs/concepts/frameworks/nextjs)
- [Variables d'environnement Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## ✅ Checklist Complète

### Avant le Déploiement
- [ ] Code poussé sur GitHub
- [ ] `vercel.json` créé
- [ ] `.vercelignore` créé
- [ ] MongoDB Atlas configuré

### Configuration
- [ ] Compte Vercel créé
- [ ] Projet importé depuis GitHub
- [ ] Variables d'environnement préparées
- [ ] Secrets générés

### Déploiement
- [ ] Projet créé sur Vercel
- [ ] Build réussi
- [ ] URL obtenue
- [ ] Variables d'environnement ajoutées
- [ ] Variables mises à jour avec l'URL

### Post-Déploiement
- [ ] Base de données initialisée
- [ ] Authentification testée
- [ ] WebSocket déployé (si nécessaire)
- [ ] Toutes les pages testées

---

**Temps total : 5-10 minutes** ⏱️

**Après la configuration initiale : 0 intervention nécessaire !** 🚀

