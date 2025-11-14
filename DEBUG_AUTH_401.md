# Guide de débogage - Erreur 401 (Unauthorized)

## Comprendre l'erreur 401

L'erreur `401 (Unauthorized)` sur `/api/auth/callback/credentials` signifie que NextAuth a rejeté les identifiants fournis. Cette erreur se produit lorsque la fonction `authorize` dans votre configuration NextAuth retourne `null`.

## Causes possibles

### 1. **NEXTAUTH_SECRET manquant**
- **Symptôme**: L'authentification échoue systématiquement
- **Solution**: Vérifiez que la variable d'environnement `NEXTAUTH_SECRET` est définie
- **Vérification**: Regardez les logs du serveur au démarrage

### 2. **MongoDB URI manquante ou incorrecte**
- **Symptôme**: Erreur de connexion à la base de données
- **Solution**: Vérifiez que `MONGO_URL` ou `MONGODB_URI` est défini et correct
- **Vérification**: Le serveur devrait lancer une erreur au démarrage si l'URI est manquante

### 3. **Utilisateur non trouvé dans la base de données**
- **Symptôme**: Les logs montrent "❌ Utilisateur non trouvé"
- **Solution**: 
  - Vérifiez que l'utilisateur existe dans la collection `users`
  - Vérifiez que l'email correspond exactement (sensible à la casse après normalisation)
  - Exécutez le script d'initialisation si nécessaire: `npm run init-db`

### 4. **Mot de passe incorrect**
- **Symptôme**: Les logs montrent "❌ Mot de passe incorrect"
- **Solution**: 
  - Vérifiez que le mot de passe est correct
  - Vérifiez que le mot de passe dans la base est bien hashé avec bcrypt
  - Réinitialisez le mot de passe si nécessaire

### 5. **Utilisateur inactif**
- **Symptôme**: Les logs montrent "❌ Utilisateur inactif"
- **Solution**: Vérifiez le champ `actif` dans la base de données et mettez-le à `true`

### 6. **Erreur lors de la connexion MongoDB**
- **Symptôme**: Erreur dans les logs du serveur
- **Solution**: Vérifiez la connexion MongoDB et les permissions

## Comment déboguer

### Étape 1: Vérifier les variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec:

```env
NEXTAUTH_SECRET=votre_secret_aleatoire_ici
NEXTAUTH_URL=http://localhost:3000
MONGO_URL=votre_uri_mongodb
# ou
MONGODB_URI=votre_uri_mongodb
```

Pour générer un `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Étape 2: Vérifier les logs du serveur

Lors d'une tentative de connexion, regardez les logs dans la console du serveur. Vous devriez voir des messages comme:
- `[AUTH] 🔍 Recherche utilisateur avec email: "..."`
- `[AUTH] ✅ Utilisateur trouvé: ...`
- `[AUTH] ❌ Utilisateur non trouvé: ...`
- `[AUTH] ❌ Mot de passe incorrect: ...`

### Étape 3: Vérifier la base de données

Connectez-vous à MongoDB et vérifiez:
```javascript
// Dans MongoDB shell ou Compass
use votre_base_de_donnees
db.users.find().pretty()

// Vérifier un utilisateur spécifique
db.users.findOne({ email: "admin@aqua.com" })
```

### Étape 4: Tester avec un script

Vous pouvez utiliser le script de test d'authentification:
```bash
# Si disponible
npm run test-auth
```

### Étape 5: Vérifier les comptes de démonstration

Les comptes de démonstration par défaut sont:
- `admin@aqua.com` / `admin`
- `operateur@aqua.com` / `operateur`
- `observateur@aqua.com` / `observateur`
- `distributeur@aqua.com` / `distributeur`

Assurez-vous que ces utilisateurs existent dans la base de données avec des mots de passe hashés.

## Solutions rapides

### Réinitialiser la base de données
```bash
npm run init-db
```

### Corriger le compte distributeur spécifiquement
Si vous avez un problème avec le compte distributeur, utilisez:
```bash
npm run fix:distributeur
```

Ou via l'API:
```bash
# Vérifier l'état
curl http://localhost:3000/api/fix-distributeur

# Corriger le compte
curl -X POST http://localhost:3000/api/fix-distributeur
```

### Tester l'authentification du distributeur
```bash
# Tester l'authentification
curl -X POST http://localhost:3000/api/test-distributeur-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"distributeur@aqua.com","password":"distributeur"}'

# Vérifier tous les distributeurs
curl http://localhost:3000/api/test-distributeur-auth
```

### Corriger le compte observateur
```bash
npm run fix:observateur
```

### Créer un utilisateur de test
Utilisez le script `scripts/seed-users.ts` ou créez manuellement un utilisateur dans MongoDB.

### Vérifier la configuration NextAuth
Assurez-vous que:
- `NEXTAUTH_SECRET` est défini
- `NEXTAUTH_URL` est défini (pour la production)
- La connexion MongoDB fonctionne
- Les utilisateurs ont des mots de passe hashés avec bcrypt

## Logs à surveiller

Dans la console du serveur, vous devriez voir:
- ✅ Messages de succès (utilisateur trouvé, connexion réussie)
- ❌ Messages d'erreur (utilisateur non trouvé, mot de passe incorrect)
- ⚠️ Messages d'avertissement (recherche alternative, etc.)

Si vous ne voyez aucun log, vérifiez que `debug: true` est activé dans la configuration NextAuth (déjà fait pour le développement).

