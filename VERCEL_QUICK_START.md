# 🚀 Déploiement Rapide sur Vercel

## ⚠️ Important : WebSocket

Vercel **ne supporte pas les WebSockets persistants**. Vous devez :
1. Déployer le WebSocket sur un service séparé (Railway, Render)
2. OU adapter votre code pour utiliser Polling/SSE

## 🚀 Étapes Rapides

### 1. Préparer MongoDB Atlas

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit (M0)
3. **Network Access** → Ajoutez `0.0.0.0/0` (accès depuis partout)
4. **Database Access** → Créez un utilisateur
5. Copiez l'URI : `mongodb+srv://user:pass@cluster.mongodb.net/aquaai`

### 2. Préparer le code

```bash
git add .
git commit -m "Configuration Vercel"
git push origin main
```

### 3. Créer le projet Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. **Add New Project** → Importez votre repo GitHub
3. Vercel détecte Next.js automatiquement

### 4. Variables d'Environnement

Dans Vercel → Settings → Environment Variables :

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aquaai
NEXTAUTH_URL=https://votre-projet.vercel.app
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>
API_BASE_URL=https://votre-projet.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://votre-projet.vercel.app
NODE_ENV=production
```

**Si vous utilisez un WebSocket séparé :**
```env
NEXT_PUBLIC_WS_URL=wss://votre-websocket-server.com
IOT_WS_TOKEN=<token-secret>
NEXT_PUBLIC_IOT_WS_TOKEN=<même-token>
```

### 5. Déployer

- Vercel déploie automatiquement
- Attendez 3-5 minutes
- Récupérez l'URL : `https://votre-projet.vercel.app`

### 6. Mettre à jour les URLs

Après le premier déploiement :
1. Mettez à jour `NEXTAUTH_URL` avec votre URL Vercel
2. Redéployez

### 7. Initialiser la base de données

Visitez : `https://votre-projet.vercel.app/api/init-db`

## 🔌 WebSocket séparé (Recommandé)

Déployez `server/ws-server.js` sur **Railway** ou **Render** :

### Railway (Recommandé)

1. Nouveau projet Railway
2. Nouveau service → `node server/ws-server.js`
3. Variables :
   - `WS_PORT=4001`
   - `IOT_WS_TOKEN=<token>`
   - `API_BASE_URL=https://votre-projet.vercel.app`
   - `MONGODB_URI=<même-uri>`
4. Copiez l'URL WebSocket : `wss://xxx.railway.app`
5. Ajoutez dans Vercel : `NEXT_PUBLIC_WS_URL=wss://xxx.railway.app`

## ✅ Checklist

- [ ] MongoDB Atlas configuré
- [ ] Code poussé sur GitHub
- [ ] Projet Vercel créé
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Base de données initialisée
- [ ] WebSocket déployé séparément (optionnel)

## 📖 Guide Complet

Voir `VERCEL_DEPLOY.md` pour plus de détails.

---

**Bon déploiement ! 🚀**

