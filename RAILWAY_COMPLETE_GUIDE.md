# 🚂 Guide Complet de Déploiement sur Railway

Guide étape par étape pour déployer votre application Next.js + WebSocket + MongoDB sur Railway.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Étape 1 : Préparer MongoDB](#étape-1--préparer-mongodb)
3. [Étape 2 : Préparer le code](#étape-2--préparer-le-code)
4. [Étape 3 : Créer le projet Railway](#étape-3--créer-le-projet-railway)
5. [Étape 4 : Configurer MongoDB](#étape-4--configurer-mongodb)
6. [Étape 5 : Configurer les variables d'environnement](#étape-5--configurer-les-variables-denvironnement)
7. [Étape 6 : Déployer](#étape-6--déployer)
8. [Étape 7 : Vérifier et tester](#étape-7--vérifier-et-tester)
9. [Dépannage](#dépannage)

---

## 📋 Prérequis

- ✅ Compte GitHub
- ✅ Compte Railway.app ([https://railway.app](https://railway.app))
- ✅ Compte MongoDB Atlas (optionnel, Railway peut créer MongoDB pour vous)

---

## 🗄️ Étape 1 : Préparer MongoDB

### Option A : Utiliser MongoDB Atlas (Recommandé)

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un compte gratuit
3. Créez un cluster gratuit (M0 Free Tier)
4. **Network Access** → Ajoutez `0.0.0.0/0` (accès depuis partout)
5. **Database Access** → Créez un utilisateur avec mot de passe
6. **Connect** → **Connect your application** → Copiez l'URI :
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Ajoutez `/aquaai` à la fin : 
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aquaai?retryWrites=true&w=majority
   ```

### Option B : Créer MongoDB via Railway

1. Dans votre projet Railway (après l'étape 3)
2. Cliquez sur **"+ New"** → **"Database"** → **"MongoDB"**
3. Railway créera automatiquement une instance MongoDB
4. Cliquez sur la base de données → Onglet **"Variables"**
5. Copiez `MONGO_URL` ou `MONGODB_URI`

---

## 💻 Étape 2 : Préparer le code

### 2.1 Vérifier les fichiers de configuration

Assurez-vous que ces fichiers existent :

- ✅ `Procfile` : `web: npm run start:prod`
- ✅ `railway.json` : Configuration Railway
- ✅ `.railwayignore` : Fichiers à exclure
- ✅ `package.json` : Scripts configurés

### 2.2 Pousser sur GitHub

```bash
git add .
git commit -m "Préparation pour déploiement Railway"
git push origin main
```

---

## 🚂 Étape 3 : Créer le projet Railway

1. Allez sur [railway.app](https://railway.app)
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur **"New Project"**
4. Sélectionnez **"Deploy from GitHub repo"**
5. Autorisez Railway à accéder à GitHub si demandé
6. Sélectionnez votre repository `aquaai`
7. Railway va automatiquement détecter Next.js et commencer le déploiement

---

## 🗄️ Étape 4 : Configurer MongoDB

Si vous utilisez l'Option B (MongoDB via Railway) :

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"MongoDB"**
3. Attendez que la base soit créée (2-3 minutes)
4. Cliquez sur la base de données MongoDB
5. Dans l'onglet **"Variables"**, copiez `MONGO_URL` ou `MONGODB_URI`

---

## ⚙️ Étape 5 : Configurer les Variables d'Environnement

Dans votre service Railway (celui qui déploie Next.js) :

1. Cliquez sur votre service
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"New Variable"**
4. Ajoutez chaque variable :

### Variables MongoDB

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aquaai?retryWrites=true&w=majority
```

**OU** si vous utilisez MongoDB Railway :
- Railway créera automatiquement `MONGODB_URI` comme variable partagée
- Vous pouvez la référencer directement

### Variables NextAuth

```env
NEXTAUTH_URL=https://votre-app.railway.app
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>
```

**Pour générer NEXTAUTH_SECRET** :
```bash
# Sur Windows PowerShell :
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Sur Linux/Mac :
openssl rand -base64 32
```

### Variables WebSocket

```env
WS_PORT=4001
IOT_WS_TOKEN=<générez-un-token-secret>
NEXT_PUBLIC_IOT_WS_TOKEN=<même-token-que-ci-dessus>
```

### Variables API

```env
API_BASE_URL=https://votre-app.railway.app
NEXT_PUBLIC_API_BASE_URL=https://votre-app.railway.app
```

### Variables Environnement

```env
NODE_ENV=production
```

### Variable Port (Optionnelle)

```env
PORT=3000
```

**Note** : Railway définit automatiquement `PORT`. Ne modifiez cette variable que si nécessaire.

---

## 🚀 Étape 6 : Déployer

### 6.1 Build automatique

1. Railway détecte automatiquement Next.js
2. Le build commence automatiquement après le push sur GitHub
3. Attendez 5-10 minutes pour le premier build

### 6.2 Obtenir l'URL

1. Une fois le build terminé, Railway génère une URL
2. Format : `https://votre-projet-production.up.railway.app`
3. Copiez cette URL

### 6.3 Générer un domaine personnalisé (Optionnel)

1. Dans votre service, onglet **"Settings"**
2. Section **"Networking"**
3. Cliquez sur **"Generate Domain"**
4. Copiez le domaine : `https://votre-projet-production.up.railway.app`

---

## 🔄 Étape 7 : Mettre à jour les variables après déploiement

Une fois que vous avez votre URL Railway :

1. Retournez dans **"Variables"**
2. Mettez à jour :
   ```
   NEXTAUTH_URL=https://votre-projet-production.up.railway.app
   API_BASE_URL=https://votre-projet-production.up.railway.app
   NEXT_PUBLIC_API_BASE_URL=https://votre-projet-production.up.railway.app
   ```
3. Railway redéploiera automatiquement

---

## ✅ Étape 8 : Vérifier et tester

### 8.1 Vérifier les logs

1. Dans Railway, cliquez sur votre service
2. Onglet **"Deployments"** → Cliquez sur le dernier déploiement
3. Onglet **"Logs"** pour voir les logs en temps réel
4. Recherchez :
   ```
   ✅ Next.js compiled successfully
   ✅ WebSocket Server démarré
   ✅ Système de monitoring IoT activé
   ```

### 8.2 Tester l'application

1. **Page d'accueil** : `https://votre-app.railway.app`
2. **Authentification** : `https://votre-app.railway.app/auth/signin`
   - Testez avec : `admin@aqua.com` / `admin`
3. **Dashboard** : `https://votre-app.railway.app/dashboard`
4. **WebSocket** : Vérifiez les logs pour voir si le WebSocket démarre

### 8.3 Initialiser la base de données

1. Visitez : `https://votre-app.railway.app/api/init-db`
2. Cela créera les utilisateurs par défaut :
   - Admin : `admin@aqua.com` / `admin`
   - Opérateur : `operateur@aqua.com` / `operateur`
   - Observateur : `observateur@aqua.com` / `observateur`

---

## 🔧 Architecture sur Railway

### ⚠️ Important : Limitation des Ports sur Railway

Railway n'expose **qu'un seul port public** par service. Si vous utilisez un seul service avec Next.js (port 3000) et WebSocket (port 4001), seul le port 3000 sera accessible depuis l'extérieur.

### Option 1 : Deux services séparés (Recommandé pour Production)

```
┌──────────────────────┐      ┌──────────────────────┐
│  Service Next.js     │      │  Service WebSocket   │
│  (Port public)       │      │  (Port public)       │
│                      │      │                      │
│  - Next.js:3000      │      │  - WebSocket:4001    │
└──────────────────────┘      └──────────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    │
         ┌──────────▼──────────┐
         │  MongoDB (Atlas)    │
         └─────────────────────┘
```

**Avantages** :
- ✅ Chaque service a son propre port public
- ✅ WebSocket accessible depuis l'extérieur
- ✅ Scalabilité indépendante
- ✅ Monitoring séparé

**Configuration** :
1. Service 1 (Next.js) : 
   - Start Command : `npm start` (sans WebSocket)
   - Port : Automatique (3000)
2. Service 2 (WebSocket) :
   - Start Command : `node server/ws-server.js`
   - Port : Automatique (4001)
   - Variables partagées : `MONGODB_URI`, `IOT_WS_TOKEN`, etc.

### Option 2 : Un seul service (Développement uniquement)

```
┌─────────────────────────────┐
│   Railway Service (Next.js) │
│                             │
│  - Next.js (Port 3000)      │
│  - WebSocket (Port 4001)    │
│  - MongoDB (externe/Atlas)  │
└─────────────────────────────┘
```

**⚠️ Limitation** : Le WebSocket sur le port 4001 ne sera **PAS accessible depuis l'extérieur**. Seul Next.js (port 3000) sera accessible.

**Utilisation** : 
- Développement/test uniquement
- Si vous avez besoin du WebSocket accessible, utilisez l'Option 1

**Configuration actuelle** :
- Le `Procfile` lance `npm run start:prod`
- Qui lance `concurrently "npm:start" "npm:start:ws"`
- Next.js écoute sur `PORT` (défini par Railway, port public)
- WebSocket écoute sur `WS_PORT` (4001, port interne uniquement)

### Option 2 : Services séparés (Avancé)

```
┌──────────────────┐      ┌──────────────────┐
│  Service Next.js │      │ Service WebSocket│
│   (Port 3000)    │      │   (Port 4001)    │
└──────────────────┘      └──────────────────┘
         │                        │
         └────────┬───────────────┘
                  │
         ┌────────▼────────┐
         │  MongoDB Atlas  │
         └─────────────────┘
```

**Pour créer un service WebSocket séparé** :

1. Dans votre projet Railway, cliquez sur **"+ New"** → **"Service"**
2. Connectez le même repository GitHub
3. Dans les **Settings** :
   - **Start Command** : `node server/ws-server.js`
   - **Root Directory** : `/` (ou laissez vide)
4. Configurez les mêmes variables d'environnement
5. Le WebSocket sera accessible sur un port différent

---

## 🐛 Dépannage

### ❌ Build échoue

**Symptômes** : Erreur dans les logs de build

**Solutions** :
1. Vérifiez les logs dans Railway → Deployments → Logs
2. Vérifiez que toutes les dépendances sont dans `package.json`
3. Vérifiez que `NODE_ENV=production`
4. Assurez-vous que `concurrently` est dans `dependencies` (pas `devDependencies`)

### ❌ Application ne démarre pas

**Symptômes** : Build réussi mais l'app ne répond pas

**Solutions** :
1. Vérifiez que `PORT` n'est pas défini manuellement (Railway le définit automatiquement)
2. Vérifiez les logs du service pour voir les erreurs
3. Vérifiez que `MONGODB_URI` est correct et accessible
4. Vérifiez que `NEXTAUTH_SECRET` est défini

### ❌ WebSocket ne fonctionne pas

**Symptômes** : Erreurs de connexion WebSocket dans la console

**Solutions** :
1. Vérifiez les logs pour voir si le WebSocket démarre :
   ```
   🚀 WebSocket Server démarré sur ws://localhost:4001
   ```
2. Vérifiez que `WS_PORT=4001` est défini
3. Vérifiez que `IOT_WS_TOKEN` et `NEXT_PUBLIC_IOT_WS_TOKEN` sont définis
4. En production, utilisez `wss://` (WebSocket Secure) au lieu de `ws://`

### ❌ Erreur de connexion MongoDB

**Symptômes** : `MONGODB_URI is not configured`

**Solutions** :
1. Vérifiez que `MONGODB_URI` est défini dans les variables d'environnement
2. Si vous utilisez MongoDB Railway, vérifiez que la variable est partagée
3. Vérifiez que l'URI est correcte (avec `/aquaai` à la fin)
4. Vérifiez que MongoDB Atlas autorise les connexions depuis Railway

### ❌ Erreur 401 (Authentification)

**Symptômes** : "Identifiants invalides" lors de la connexion

**Solutions** :
1. Vérifiez que `NEXTAUTH_SECRET` est défini
2. Vérifiez que `NEXTAUTH_URL` correspond à votre URL Railway
3. Initialisez la base de données : `https://votre-app.railway.app/api/init-db`
4. Vérifiez que les utilisateurs ont `actif: true` dans MongoDB

### ❌ Variables d'environnement non chargées

**Symptômes** : Les variables ne semblent pas fonctionner

**Solutions** :
1. Redéployez après avoir ajouté/modifié les variables
2. Vérifiez que les noms sont exacts (case-sensitive)
3. Les variables `NEXT_PUBLIC_*` sont accessibles côté client
4. Vérifiez que vous avez sauvegardé les variables (cliquez sur "Save")

---

## 📊 Monitoring et Logs

### Voir les logs en temps réel

1. Dans Railway, cliquez sur votre service
2. Onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Onglet **"Logs"** pour voir les logs en direct

### Métriques

Railway affiche automatiquement :
- CPU usage
- Memory usage
- Network traffic
- Request count

---

## 🔐 Sécurité

### Bonnes pratiques

1. **NEXTAUTH_SECRET** : Utilisez un secret fort et unique
2. **IOT_WS_TOKEN** : Utilisez un token complexe pour le WebSocket
3. **MongoDB** : Utilisez un mot de passe fort
4. **Variables** : Ne commitez jamais les variables d'environnement
5. **HTTPS** : Railway utilise HTTPS automatiquement

---

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [WebSocket Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## ✅ Checklist Finale

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Railway
- [ ] MongoDB configuré (Atlas ou Railway)
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Build réussi
- [ ] URL publique obtenue
- [ ] Variables mises à jour avec l'URL Railway
- [ ] Base de données initialisée (`/api/init-db`)
- [ ] Authentification testée
- [ ] WebSocket fonctionnel (vérifié dans les logs)
- [ ] Toutes les pages accessibles
- [ ] Application fonctionnelle en production

---

**Félicitations ! Votre application est déployée sur Railway ! 🎉**

