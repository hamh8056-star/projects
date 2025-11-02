# 🚀 Guide de Déploiement Railway - De A à Z

Ce guide vous accompagne étape par étape pour déployer votre application AquaAI sur Railway.

## 📋 Prérequis

- Un compte Railway (gratuit sur [railway.app](https://railway.app))
- Un compte GitHub avec votre code poussé
- Un compte MongoDB Atlas (pour la base de données) OU utiliser MongoDB de Railway

---

## 🎯 Étape 1 : Préparer votre Projet

### 1.1 Vérifier les fichiers requis

Assurez-vous que ces fichiers existent dans votre projet :
- ✅ `package.json`
- ✅ `railway.json` (déjà présent)
- ✅ `Procfile` (déjà présent)
- ✅ `next.config.ts`
- ✅ `tsconfig.json`

### 1.2 S'assurer que le code est sur GitHub

```bash
# Vérifier l'état
git status

# Ajouter tous les fichiers
git add .

# Commiter
git commit -m "Ready for Railway deployment"

# Pusher sur GitHub
git push origin main
```

---

## 🚂 Étape 2 : Créer un Projet sur Railway

### 2.1 Créer un compte et un nouveau projet

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"Login"** ou **"Sign Up"**
3. Connectez-vous avec GitHub
4. Cliquez sur **"New Project"**
5. Sélectionnez **"Deploy from GitHub repo"**
6. Choisissez votre repository `aquaai`
7. Railway va automatiquement détecter Next.js

### 2.2 Configuration automatique

Railway détectera automatiquement :
- ✅ Next.js
- ✅ Node.js 20
- ✅ Le script de build : `npm run build`
- ✅ Le script de démarrage : `npm run start:prod` (depuis `railway.json`)

---

## 🔧 Étape 3 : Configurer MongoDB

### Option A : MongoDB Atlas (Recommandé)

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur base de données
4. Autorisez l'accès depuis n'importe quelle IP (0.0.0.0/0) temporairement
5. Obtenez votre connection string : `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

### Option B : MongoDB Railway (Plus simple)

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"MongoDB"**
3. Railway créera automatiquement une instance MongoDB
4. Railway ajoutera automatiquement la variable `MONGO_URL` à votre service

---

## 🔐 Étape 4 : Configurer les Variables d'Environnement

### 4.1 Accéder aux variables d'environnement

Dans votre projet Railway :
1. Cliquez sur votre service Next.js
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"New Variable"**

### 4.2 Variables requises

Ajoutez ces variables une par une :

#### Variables obligatoires

```bash
# MongoDB (si vous utilisez MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aquaai?retryWrites=true&w=majority

# OU si vous utilisez MongoDB Railway, Railway ajoute automatiquement :
# MONGO_URL (Railway l'ajoute automatiquement pour les services MongoDB)

# NextAuth
NEXTAUTH_URL=https://votre-app.railway.app
NEXTAUTH_SECRET=votre_secret_aleatoire_ici

# WebSocket
WS_PORT=4001
IOT_WS_TOKEN=votre_token_secret_ici

# Environnement
NODE_ENV=production
```

#### Variables optionnelles

```bash
# Port (généralement géré automatiquement par Railway)
PORT=3000

# API Base URL
API_BASE_URL=https://votre-app.railway.app
```

### 4.3 Générer NEXTAUTH_SECRET

Exécutez cette commande pour générer un secret sécurisé :

```bash
# Sur votre machine locale
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copiez le résultat et utilisez-le pour `NEXTAUTH_SECRET`.

### 4.4 Générer IOT_WS_TOKEN

```bash
# Générer un token aléatoire
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔄 Étape 5 : Adapter le Code pour Railway

### 5.1 Modifier la connexion MongoDB

Vérifiez que votre code utilise `MONGO_URL` (Railway) ou `MONGODB_URI` (Atlas).

Dans `src/lib/mongodb.ts`, le code devrait gérer les deux :

```typescript
const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
```

### 5.2 Vérifier railway.json

Le fichier `railway.json` est déjà configuré :

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5.3 Vérifier package.json

Les scripts sont déjà corrects :
- `build`: `next build`
- `start:prod`: `concurrently "npm:start" "npm:start:ws"`

---

## 🚀 Étape 6 : Déployer

### 6.1 Déploiement automatique

1. Une fois toutes les variables configurées, Railway va automatiquement :
   - Détecter les changements sur GitHub
   - Lancer le build
   - Déployer l'application

2. Vous pouvez voir les logs en temps réel dans l'onglet **"Deployments"**

### 6.2 Déploiement manuel

Si le déploiement automatique ne se lance pas :

1. Allez dans **"Settings"** → **"Source"**
2. Cliquez sur **"Redeploy"**
3. Ou faites un commit vide :
   ```bash
   git commit --allow-empty -m "Trigger Railway deployment"
   git push
   ```

---

## 🌐 Étape 7 : Configurer le Domaine

### 7.1 Domaine Railway

1. Dans votre service, allez dans l'onglet **"Settings"**
2. Scroll jusqu'à **"Networking"**
3. Cliquez sur **"Generate Domain"**
4. Railway générera un domaine comme : `votre-app.railway.app`

### 7.2 Domaine personnalisé (Optionnel)

1. Dans **"Networking"**, cliquez sur **"Custom Domain"**
2. Ajoutez votre domaine
3. Suivez les instructions pour configurer les DNS

### 7.3 Mettre à jour NEXTAUTH_URL

Après avoir obtenu votre domaine, mettez à jour la variable :
```bash
NEXTAUTH_URL=https://votre-domaine.railway.app
```

---

## ✅ Étape 8 : Vérifier le Déploiement

### 8.1 Vérifier les logs

1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur le dernier déploiement
3. Vérifiez les logs pour les erreurs

### 8.2 Tester l'application

1. Ouvrez votre URL Railway dans le navigateur
2. Vérifiez que la page d'accueil s'affiche
3. Testez la connexion
4. Vérifiez les fonctionnalités principales

---

## 🔧 Résolution des Problèmes

### Problème 1 : Build échoue

**Solution :**
- Vérifiez les logs de build
- Assurez-vous que toutes les dépendances sont dans `package.json`
- Vérifiez que `tailwindcss` et `@tailwindcss/postcss` sont dans `dependencies`

### Problème 2 : Erreur de connexion MongoDB

**Solution :**
- Vérifiez que `MONGODB_URI` ou `MONGO_URL` est correctement configuré
- Vérifiez que l'IP est autorisée dans MongoDB Atlas
- Testez la connection string localement

### Problème 3 : NextAuth ne fonctionne pas

**Solution :**
- Vérifiez que `NEXTAUTH_URL` correspond à votre domaine Railway
- Vérifiez que `NEXTAUTH_SECRET` est défini
- Vérifiez les logs pour les erreurs d'authentification

### Problème 4 : WebSocket ne fonctionne pas

**Solution :**
- Vérifiez que `WS_PORT=4001` est défini
- Vérifiez que `IOT_WS_TOKEN` est défini
- Railway supporte les WebSockets, mais vérifiez que le port est exposé

### Problème 5 : Variables d'environnement non détectées

**Solution :**
- Redéployez après avoir ajouté les variables
- Vérifiez que les noms des variables sont exacts (sensible à la casse)
- Certaines variables nécessitent un redémarrage du service

---

## 📊 Monitoring et Maintenance

### Voir les logs en temps réel

1. Allez dans votre service
2. Onglet **"Logs"**
3. Vous verrez les logs en temps réel

### Métriques

Railway fournit des métriques sur :
- CPU usage
- Memory usage
- Network traffic
- Request count

### Redémarrer le service

1. Allez dans **"Settings"**
2. Scroll jusqu'à **"Danger Zone"**
3. Cliquez sur **"Restart"**

---

## 🎯 Checklist Finale

Avant de considérer le déploiement terminé :

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Railway
- [ ] MongoDB configuré (Atlas ou Railway)
- [ ] Toutes les variables d'environnement configurées
- [ ] Build réussi
- [ ] Application accessible via l'URL Railway
- [ ] Connexion fonctionne
- [ ] WebSocket fonctionne
- [ ] NEXTAUTH_URL mis à jour avec le bon domaine

---

## 🔗 Liens Utiles

- [Documentation Railway](https://docs.railway.app)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 💡 Astuces

1. **Utilisez MongoDB Railway** : C'est plus simple et automatique
2. **Monitor les logs** : Les logs Railway sont très utiles pour déboguer
3. **Variables sensibles** : Utilisez les variables Railway pour les secrets, jamais dans le code
4. **Backup** : Configurez des backups MongoDB réguliers
5. **Domaine personnalisé** : Utilisez un domaine personnalisé pour un look professionnel

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Railway
2. Vérifiez la documentation Railway
3. Vérifiez que toutes les variables sont correctement configurées

Bon déploiement ! 🚀

