# 🚀 Déploiement Rapide sur Railway

## Étapes Rapides

### 1. Préparer le Code
```bash
git add .
git commit -m "Config Railway"
git push origin main
```

### 2. Créer le Projet Railway
1. Allez sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionnez votre repository

### 3. Ajouter MongoDB
1. **+ New** → **Database** → **MongoDB**
2. Copiez la variable `MONGO_URL` (ou `MONGODB_URI`)

### 4. Variables d'Environnement
Dans votre service, onglet **Variables**, ajoutez :

```env
MONGODB_URI=<votre_url_mongodb>
NEXTAUTH_URL=https://votre-app.railway.app
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>
WS_PORT=4001
IOT_WS_TOKEN=<token_secret>
NEXT_PUBLIC_IOT_WS_TOKEN=<même_token>
API_BASE_URL=https://votre-app.railway.app
NEXT_PUBLIC_API_BASE_URL=https://votre-app.railway.app
NODE_ENV=production
```

### 5. Attendre le Build
- Railway build automatiquement
- Attendez 5-10 minutes
- Récupérez votre URL

### 6. Mettre à Jour l'URL
Après avoir obtenu l'URL Railway, mettez à jour :
- `NEXTAUTH_URL`
- `API_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`

Puis redéployez.

## ✅ Vérification
- [ ] Build réussi
- [ ] URL accessible
- [ ] Connexion fonctionne
- [ ] WebSocket actif (vérifier logs)

## 📖 Guide Complet
Voir `RAILWAY_DEPLOY.md` pour plus de détails.

