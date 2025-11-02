# 🚀 Guide Étape par Étape : Déploiement Railway Automatique

## 🎯 Objectif

Déployer votre application AquaAI sur Railway avec **le minimum d'intervention possible**.

## ⏱️ Temps Total : 5-7 minutes

---

## 📝 ÉTAPE 1 : Générer les Secrets (30 secondes)

Ouvrez un terminal dans votre projet et exécutez :

```bash
node scripts/generate-secrets.js
```

Cela génère automatiquement :
- `NEXTAUTH_SECRET`
- `IOT_WS_TOKEN`
- `NEXT_PUBLIC_IOT_WS_TOKEN`

**📋 Copiez ces valeurs**, vous en aurez besoin à l'étape 4.

---

## 🌐 ÉTAPE 2 : Configurer MongoDB Atlas (2 minutes)

### 2.1 Créer un compte

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

## 🚂 ÉTAPE 3 : Créer le Projet Railway (1 minute)

### 3.1 Créer un compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"Login"** → **"GitHub"**
3. Autorisez Railway à accéder à votre compte GitHub

### 3.2 Créer un nouveau projet

1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Si nécessaire, autorisez Railway à accéder à vos repositories
4. Sélectionnez votre repository `aquaai`
5. Railway commence **automatiquement** le déploiement !

**⏳ Laissez Railway déployer pendant 2-5 minutes...**

---

## ⚙️ ÉTAPE 4 : Configurer les Variables d'Environnement (2 minutes)

Une fois que Railway a créé votre projet :

1. Cliquez sur votre service dans Railway
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"+ New Variable"** pour chaque variable

Ajoutez ces variables une par une :

```env
MONGODB_URI=mongodb+srv://aquaai-user:VotreMotDePasse@cluster0.xxxxx.mongodb.net/aquaai?retryWrites=true&w=majority
```

```env
NEXTAUTH_SECRET=<la-valeur-générée-à-l-étape-1>
```

```env
NEXTAUTH_URL=https://votre-projet.up.railway.app
```

```env
WS_PORT=4001
```

```env
IOT_WS_TOKEN=<la-valeur-générée-à-l-étape-1>
```

```env
NEXT_PUBLIC_IOT_WS_TOKEN=<même-valeur-que-IOT_WS_TOKEN>
```

```env
API_BASE_URL=https://votre-projet.up.railway.app
```

```env
NEXT_PUBLIC_API_BASE_URL=https://votre-projet.up.railway.app
```

```env
NODE_ENV=production
```

**⚠️ Important** : Pour `NEXTAUTH_URL`, `API_BASE_URL`, et `NEXT_PUBLIC_API_BASE_URL`, vous devez :
1. Attendre que Railway vous donne votre URL (format : `https://votre-projet.up.railway.app`)
2. Utiliser cette URL dans ces variables

---

## 🎯 ÉTAPE 5 : Obtenir votre URL Railway (30 secondes)

1. Dans Railway, allez dans votre service
2. Cliquez sur l'onglet **"Settings"**
3. Dans **"Networking"**, vous verrez votre domaine
4. Si aucun domaine n'est généré, cliquez sur **"Generate Domain"**
5. Copiez l'URL (ex: `https://aquaai-production.up.railway.app`)

---

## 🔄 ÉTAPE 6 : Mettre à jour les Variables avec l'URL (30 secondes)

Maintenant que vous avez votre URL Railway :

1. Retournez dans **Variables**
2. Mettez à jour ces 3 variables avec votre URL Railway :
   - `NEXTAUTH_URL` = `https://votre-projet.up.railway.app`
   - `API_BASE_URL` = `https://votre-projet.up.railway.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://votre-projet.up.railway.app`

3. Railway **redéploie automatiquement** après chaque modification de variable

---

## ✅ ÉTAPE 7 : Initialiser la Base de Données (10 secondes)

Une fois le redéploiement terminé :

1. Visitez votre URL Railway dans un navigateur : `https://votre-projet.up.railway.app`
2. Visitez cette page : `https://votre-projet.up.railway.app/api/init-db`
3. Cela créera automatiquement les utilisateurs par défaut :
   - **Admin** : `admin@aqua.com` / `admin`
   - **Opérateur** : `operateur@aqua.com` / `operateur`
   - **Observateur** : `observateur@aqua.com` / `observateur`

---

## 🎉 Félicitations !

Votre application est maintenant déployée sur Railway !

### 🧪 Tester l'application

1. **Page d'accueil** : `https://votre-projet.up.railway.app`
2. **Connexion** : `https://votre-projet.up.railway.app/auth/signin`
   - Utilisez : `admin@aqua.com` / `admin`
3. **Dashboard** : `https://votre-projet.up.railway.app/dashboard`

---

## 🔄 Déploiements Automatiques

**La meilleure partie** : Railway redéploie **automatiquement** à chaque push sur GitHub !

1. Vous modifiez votre code localement
2. Vous faites :
   ```bash
   git add .
   git commit -m "Vos modifications"
   git push origin main
   ```
3. Railway détecte automatiquement le changement
4. Railway redéploie automatiquement
5. **Aucune intervention nécessaire !** 🎉

---

## 🐛 Dépannage Rapide

### Le build échoue
- Vérifiez les logs dans Railway → Deployments → Logs
- Assurez-vous que toutes les variables sont définies

### Erreur 401 lors de la connexion
- Vérifiez que `NEXTAUTH_SECRET` est défini
- Vérifiez que `NEXTAUTH_URL` correspond à votre URL Railway
- Visitez `/api/fix-observateur` pour corriger les utilisateurs

### MongoDB erreur de connexion
- Vérifiez que l'URI MongoDB est correcte
- Vérifiez que `0.0.0.0/0` est autorisé dans MongoDB Atlas Network Access
- Vérifiez les credentials de l'utilisateur MongoDB

---

## 📚 Fichiers Utiles

- `RAILWAY_AUTO_DEPLOY.md` - Guide rapide
- `RAILWAY_DEPLOY.md` - Guide détaillé complet
- `.env.railway.template` - Template des variables d'environnement
- `scripts/generate-secrets.js` - Script pour générer les secrets

---

**Temps total : 5-7 minutes** ⏱️

**Après la configuration initiale : 0 intervention nécessaire !** 🚀

