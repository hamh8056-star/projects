# Configuration MongoDB pour AquaAI

## 1. Installation de MongoDB

### Option A: MongoDB Community Edition (Local)
1. Téléchargez MongoDB Community Server depuis [mongodb.com](https://www.mongodb.com/try/download/community)
2. Installez MongoDB sur votre machine
3. Démarrez le service MongoDB

### Option B: MongoDB Atlas (Cloud)
1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un nouveau cluster (gratuit disponible)
3. Obtenez votre URI de connexion

## 2. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/aquaai

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**Note:** Remplacez `mongodb://localhost:27017/aquaai` par votre URI MongoDB Atlas si vous utilisez le cloud.

## 3. Initialisation de la base de données

Une fois MongoDB configuré, vous pouvez initialiser la base de données avec des données de test :

```bash
# Démarrez votre serveur de développement
npm run dev

# Dans un autre terminal, appelez l'API d'initialisation
curl -X POST http://localhost:3000/api/init-db
```

Ou visitez directement : `http://localhost:3000/api/init-db` dans votre navigateur.

## 4. Vérification

Pour vérifier que tout fonctionne :

1. Démarrez l'application : `npm run dev`
2. Allez sur le dashboard admin : `http://localhost:3000/dashboard`
3. Vous devriez voir les données réelles de MongoDB

## 5. Collections créées

L'application utilise les collections suivantes :
- `users` : Utilisateurs du système
- `mesures` : Mesures des paramètres aquacoles
- `alertes` : Alertes système

## 6. Dépannage

### Erreur "MONGODB_URI is not configured"
- Vérifiez que le fichier `.env.local` existe
- Vérifiez que `MONGODB_URI` est correctement défini

### Erreur de connexion
- Vérifiez que MongoDB est démarré
- Vérifiez que l'URI est correct
- Vérifiez les permissions réseau

### Base de données vide
- Appelez l'API d'initialisation : `POST /api/init-db`
- Vérifiez les logs dans la console 