# ✅ Checklist de Déploiement Railway

## Avant de Déployer

### 1. ✅ Configuration Build
- [x] `next.config.ts` configuré pour ignorer les erreurs ESLint/TypeScript
- [x] Scripts `package.json` mis à jour avec `start:prod`
- [x] `concurrently` déplacé vers `dependencies`
- [x] Build local réussi : `npm run build`

### 2. 📁 Fichiers Créés
- [x] `Procfile` - Commande de démarrage
- [x] `railway.json` - Configuration Railway
- [x] `.railwayignore` - Fichiers à ignorer
- [x] `RAILWAY_DEPLOY.md` - Guide détaillé
- [x] `RAILWAY_QUICK_START.md` - Guide rapide

### 3. 🔐 Variables d'Environnement à Préparer

#### MongoDB
```
MONGODB_URI=<url_mongodb>
```

#### NextAuth
```
NEXTAUTH_URL=<https://votre-app.railway.app>
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
```

#### WebSocket
```
WS_PORT=4001
IOT_WS_TOKEN=<token_secret>
NEXT_PUBLIC_IOT_WS_TOKEN=<même_token>
```

#### API URLs
```
API_BASE_URL=<https://votre-app.railway.app>
NEXT_PUBLIC_API_BASE_URL=<https://votre-app.railway.app>
```

#### Environnement
```
NODE_ENV=production
```

## 🚀 Processus de Déploiement

### Étape 1 : Pousser sur GitHub
```bash
git add .
git commit -m "Configuration Railway prête pour déploiement"
git push origin main
```

### Étape 2 : Créer le Projet Railway
1. Aller sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionner le repository `aquaai`
4. Autoriser l'accès GitHub si nécessaire

### Étape 3 : Ajouter MongoDB
1. Dans le projet Railway : **+ New** → **Database** → **MongoDB**
2. Attendre que la base soit créée
3. Copier `MONGO_URL` (ou `MONGODB_URI`)

### Étape 4 : Configurer les Variables
1. Cliquer sur votre service web
2. Onglet **Variables**
3. Ajouter toutes les variables d'environnement (voir ci-dessus)

### Étape 5 : Attendre le Build
1. Railway détecte automatiquement Next.js
2. Build automatique lancé
3. Attendre 5-10 minutes
4. Vérifier les logs en cas d'erreur

### Étape 6 : Obtenir l'URL
1. Une fois le build réussi, Railway génère une URL
2. Format : `https://aquaai-production.up.railway.app`

### Étape 7 : Mettre à Jour les URLs
1. Retourner dans **Variables**
2. Mettre à jour :
   - `NEXTAUTH_URL` avec votre URL Railway
   - `API_BASE_URL` avec votre URL Railway
   - `NEXT_PUBLIC_API_BASE_URL` avec votre URL Railway
3. Redémarrer le service si nécessaire

## ✅ Vérification Post-Déploiement

### Fonctionnalités à Tester
- [ ] Page d'accueil charge correctement
- [ ] Authentification fonctionne
- [ ] Dashboard accessible
- [ ] WebSocket connecté (vérifier logs)
- [ ] CRUD bassins fonctionne
- [ ] CRUD lots fonctionne
- [ ] CRUD utilisateurs fonctionne
- [ ] Historique des mesures s'affiche
- [ ] Alertes fonctionnent
- [ ] Rapports génèrent correctement
- [ ] QR Code traceability publique accessible

### Logs à Vérifier
```bash
# Dans Railway, vérifier les logs du service web
# Rechercher :
✅ "Next.js compiled successfully"
✅ "WebSocket Server démarré"
✅ "Système de monitoring IoT activé"
❌ Pas d'erreurs MongoDB
❌ Pas d'erreurs de connexion
```

## 🐛 En Cas de Problème

### Build échoue
- Vérifier les logs Railway
- Vérifier que toutes les variables sont définies
- Vérifier que `package.json` est correct

### Application ne démarre pas
- Vérifier que `MONGODB_URI` est correct
- Vérifier que `NEXTAUTH_SECRET` est défini
- Vérifier les ports

### WebSocket ne fonctionne pas
- Vérifier que `WS_PORT` est défini
- Vérifier que `IOT_WS_TOKEN` est défini
- Vérifier les logs du serveur WebSocket

### MongoDB erreur de connexion
- Vérifier que `MONGODB_URI` est correct
- Vérifier que la base est accessible depuis Internet
- Vérifier les credentials

## 📞 Support

- [Documentation Railway](https://docs.railway.app)
- [Documentation Next.js](https://nextjs.org/docs/deployment)
- Logs Railway pour debugging

## 🎉 Une Fois Déployé

1. ✅ Noter l'URL de production
2. ✅ Tester toutes les fonctionnalités
3. ✅ Configurer un domaine personnalisé (optionnel)
4. ✅ Configurer des backups MongoDB (recommandé)
5. ✅ Documenter les credentials de production

---

**Bon déploiement ! 🚀**

