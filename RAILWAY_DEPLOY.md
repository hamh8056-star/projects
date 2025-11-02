# Guide de Déploiement sur Railway.app

Ce guide vous explique comment déployer l'application AquaAI sur Railway.app.

## 📋 Prérequis

1. Un compte GitHub (pour connecter votre repository)
2. Un compte Railway.app ([https://railway.app](https://railway.app))
3. Une base de données MongoDB (MongoDB Atlas recommandé)

## 🚀 Étapes de Déploiement

### 1. Préparer le Repository GitHub

Assurez-vous que votre code est poussé sur GitHub :
```bash
git add .
git commit -m "Préparation pour déploiement Railway"
git push origin main
```

### 2. Créer un Projet sur Railway

1. Connectez-vous à [Railway.app](https://railway.app)
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Autorisez Railway à accéder à votre compte GitHub
5. Sélectionnez le repository `aquaai`

### 3. Ajouter une Base de Données MongoDB

Railway peut créer une base de données MongoDB pour vous :

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** puis **"MongoDB"**
3. Railway créera automatiquement une instance MongoDB
4. Cliquez sur la base de données créée
5. Dans l'onglet **"Variables"**, copiez la variable **`MONGO_URL`**

### 4. Configurer les Variables d'Environnement

Dans votre service Railway (celui qui déploie votre application) :

1. Cliquez sur votre service
2. Allez dans l'onglet **"Variables"**
3. Ajoutez les variables suivantes :

#### Variables Obligatoires

```env
# MongoDB (utilisez MONGGO_URL depuis Railway MongoDB ou votre MongoDB Atlas)
MONGODB_URI=<mongodb+srv://user:password@cluster.mongodb.net/aquaai?retryWrites=true&w=majority>

# NextAuth (générez NEXTAUTH_SECRET avec: openssl rand -base64 32)
NEXTAUTH_URL=https://votre-app.railway.app
NEXTAUTH_SECRET=<votre_secret_généré>

# WebSocket (générez un token secret)
WS_PORT=4001
IOT_WS_TOKEN=<votre_token_secret>
NEXT_PUBLIC_IOT_WS_TOKEN=<même_token_que_ci-dessus>

# API Base URL (mise à jour après obtention de l'URL Railway)
API_BASE_URL=https://votre-app.railway.app
NEXT_PUBLIC_API_BASE_URL=https://votre-app.railway.app

# Node Environment
NODE_ENV=production

# Port (Railway définit automatiquement PORT, ne pas le modifier)
# PORT sera automatiquement défini par Railway
```

#### Variables Optionnelles

```env
# Port (Railway définit automatiquement PORT)
PORT=3000

# Autres configurations
DISABLE_ESLINT_PLUGIN=true
```

### 5. Déployer l'Application

1. Railway détectera automatiquement que c'est une application Next.js
2. Le build commencera automatiquement
3. Attendez que le build soit terminé (5-10 minutes)
4. Une fois terminé, Railway vous donnera une URL publique

### 6. Configurer le Domaine (Optionnel)

1. Dans votre service Railway
2. Cliquez sur l'onglet **"Settings"**
3. Dans **"Networking"**, cliquez sur **"Generate Domain"**
4. Copiez le domaine généré (ex: `aquaai-production.up.railway.app`)
5. Mettez à jour `NEXTAUTH_URL` avec ce domaine

### 7. Mettre à Jour les Variables d'Environnement

Après avoir obtenu votre URL publique :
1. Retournez dans **"Variables"**
2. Mettez à jour :
   - `NEXTAUTH_URL` = `https://votre-domaine.railway.app`
   - `API_BASE_URL` = `https://votre-domaine.railway.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://votre-domaine.railway.app`
3. Redéployez si nécessaire

## 🔧 Configuration des Services

### Service WebSocket

Railway ne supporte pas directement les services WebSocket séparés dans un seul déploiement. Vous avez deux options :

#### Option 1 : Un seul service (recommandé)
Le serveur WebSocket démarre automatiquement avec Next.js via `npm run start:prod`

#### Option 2 : Service séparé (avancé)
Si vous voulez séparer le WebSocket :
1. Créez un nouveau service dans Railway
2. Configurez-le pour exécuter uniquement `node server/ws-server.js`
3. Utilisez des variables d'environnement partagées

## 📝 Notes Importantes

1. **Port** : Railway définit automatiquement la variable `PORT`. Votre application doit écouter sur cette variable.
2. **WebSocket** : Assurez-vous que votre URL WebSocket utilise `wss://` (WebSocket Secure) en production
3. **Base de données** : La base de données MongoDB créée par Railway est automatiquement configurée
4. **Build** : Le build Next.js se fait automatiquement avec `npm run build`
5. **ESLint/TypeScript** : La configuration actuelle ignore les erreurs ESLint et TypeScript pendant le build pour permettre le déploiement. Ces erreurs devront être corrigées progressivement.

## 🔍 Vérification du Déploiement

1. Visitez votre URL Railway
2. Testez la connexion à la page d'accueil
3. Vérifiez les logs dans Railway pour voir si le WebSocket démarre correctement
4. Testez l'authentification

## 🐛 Dépannage

### Le build échoue
- Vérifiez les logs dans Railway
- Assurez-vous que toutes les dépendances sont dans `package.json`
- Vérifiez que `NODE_ENV=production`

### Les variables d'environnement ne fonctionnent pas
- Redéployez après avoir ajouté les variables
- Vérifiez que les noms des variables sont corrects (case-sensitive)

### Le WebSocket ne fonctionne pas
- Vérifiez que `WS_PORT` est défini
- Assurez-vous que le serveur WebSocket démarre (vérifiez les logs)
- En production, utilisez `wss://` au lieu de `ws://`

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## ✅ Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Railway
- [ ] MongoDB ajouté et configuré
- [ ] Toutes les variables d'environnement configurées
- [ ] Build réussi
- [ ] URL publique fonctionnelle
- [ ] Authentification testée
- [ ] WebSocket fonctionnel

---

**Bon déploiement ! 🚀**

