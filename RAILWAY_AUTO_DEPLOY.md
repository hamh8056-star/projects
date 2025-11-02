# 🚀 Déploiement Automatique sur Railway

Ce guide vous permet de déployer votre projet sur Railway avec **un minimum d'intervention**.

## ✅ Ce qui est Automatique sur Railway

Railway peut automatiquement :
- ✅ Détecter Next.js et configurer le build
- ✅ Déployer automatiquement à chaque push GitHub
- ✅ Créer des URLs publiques automatiquement
- ✅ Gérer les redéploiements
- ✅ Exposer les ports automatiquement

## ⚠️ Intervention Minimale Requise

Vous devez uniquement :
1. Créer un compte Railway (1 fois)
2. Connecter votre repository GitHub (1 fois)
3. Ajouter les variables d'environnement (1 fois)
4. Cliquer sur "Deploy" (1 fois)

## 🚀 Étapes Rapides (5 minutes)

### Étape 1 : Créer un compte Railway (2 minutes)

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"Login"** → **"GitHub"**
3. Autorisez Railway à accéder à votre compte GitHub

### Étape 2 : Créer un nouveau projet (30 secondes)

1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Sélectionnez votre repository `aquaai`
4. Railway commence automatiquement le déploiement

### Étape 3 : Configurer MongoDB (1 minute)

#### Option A : MongoDB Atlas (Recommandé - Gratuit)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit (M0)
3. **Network Access** → Ajoutez `0.0.0.0/0`
4. **Database Access** → Créez un utilisateur
5. Copiez l'URI : `mongodb+srv://user:pass@cluster.mongodb.net/aquaai`

#### Option B : MongoDB Railway

1. Dans Railway, cliquez sur **"+ New"** → **"Database"** → **"MongoDB"**
2. Railway créera automatiquement MongoDB
3. Copiez `MONGO_URL` depuis les variables

### Étape 4 : Ajouter les Variables d'Environnement (1 minute)

Dans Railway → Votre Service → **Variables**, ajoutez :

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aquaai

# NextAuth (générez avec la commande ci-dessous)
NEXTAUTH_SECRET=<générez-ici>
NEXTAUTH_URL=https://votre-app.railway.app

# WebSocket
WS_PORT=4001
IOT_WS_TOKEN=<générez-un-token>
NEXT_PUBLIC_IOT_WS_TOKEN=<même-token>

# API
API_BASE_URL=https://votre-app.railway.app
NEXT_PUBLIC_API_BASE_URL=https://votre-app.railway.app

# Environnement
NODE_ENV=production
```

**Pour générer NEXTAUTH_SECRET** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Pour générer IOT_WS_TOKEN** :
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Étape 5 : Attendre le Déploiement (2-5 minutes)

Railway déploie automatiquement. Vous pouvez voir la progression dans les logs.

### Étape 6 : Mettre à jour NEXTAUTH_URL (30 secondes)

Une fois déployé :

1. Railway vous donne une URL : `https://votre-projet.up.railway.app`
2. Dans Railway → Variables, mettez à jour :
   - `NEXTAUTH_URL` = `https://votre-projet.up.railway.app`
   - `API_BASE_URL` = `https://votre-projet.up.railway.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://votre-projet.up.railway.app`
3. Railway redéploie automatiquement

### Étape 7 : Initialiser la Base de Données (10 secondes)

1. Visitez : `https://votre-projet.up.railway.app/api/init-db`
2. Cela crée automatiquement les utilisateurs par défaut

## 🎯 C'est Tout !

Après ces 7 étapes, votre application est déployée et fonctionne automatiquement.

## 🔄 Déploiements Automatiques Futurs

**Railway redéploie automatiquement** à chaque push sur GitHub !

1. Vous modifiez votre code localement
2. Vous faites : `git push origin main`
3. Railway détecte le changement
4. Railway redéploie automatiquement
5. **Aucune intervention nécessaire !**

## 📋 Checklist Complète

- [ ] Compte Railway créé
- [ ] Repository GitHub connecté
- [ ] MongoDB configuré (Atlas ou Railway)
- [ ] Variables d'environnement ajoutées
- [ ] Build réussi
- [ ] URL obtenue
- [ ] Variables d'environnement mises à jour avec l'URL
- [ ] Base de données initialisée

## 🎁 Bonus : Script d'Aide

Vous pouvez créer un script pour générer les tokens automatiquement :

Créez `scripts/generate-secrets.js` :

```javascript
const crypto = require('crypto');

console.log('=== Secrets pour Railway ===\n');
console.log('NEXTAUTH_SECRET:');
console.log(crypto.randomBytes(32).toString('base64'));
console.log('\nIOT_WS_TOKEN:');
console.log(crypto.randomBytes(16).toString('hex'));
console.log('\n=== Copiez ces valeurs dans Railway ===');
```

Puis exécutez :
```bash
node scripts/generate-secrets.js
```

## 🐛 Si quelque chose ne fonctionne pas

### Le build échoue
- Vérifiez les logs dans Railway
- Assurez-vous que toutes les variables sont définies

### Erreur 401
- Vérifiez `NEXTAUTH_SECRET` et `NEXTAUTH_URL`
- Visitez `/api/fix-observateur` pour corriger les utilisateurs

### MongoDB erreur
- Vérifiez que l'URI est correcte
- Si Atlas, vérifiez que `0.0.0.0/0` est autorisé

---

**Temps total estimé : 5-7 minutes** ⏱️

**Après la configuration initiale : 0 intervention nécessaire !** 🎉

