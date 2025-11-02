# Docker Setup for AquaAI

Ce document explique comment utiliser Docker pour déployer l'application AquaAI.

## Prérequis

- Docker et Docker Compose installés sur votre machine
- Git pour cloner le dépôt

## Configuration

1. Clonez le dépôt AquaAI :
   ```bash
   git clone <votre-repo-url>
   cd aquaAi
   ```

2. Modifiez le token de sécurité dans `docker-compose.yml` :
   ```yaml
   environment:
     - IOT_WS_TOKEN=votre_token_secret_ici
   ```

## Démarrage

Pour lancer l'application avec Docker Compose :

```bash
docker-compose up -d
```

L'application sera accessible sur :
- Interface web : http://localhost:3000
- Serveur WebSocket : ws://localhost:4001

## Arrêt

Pour arrêter l'application :

```bash
docker-compose down
```

Pour arrêter et supprimer les volumes (données MongoDB) :

```bash
docker-compose down -v
```

## Logs

Pour voir les logs de l'application :

```bash
docker-compose logs -f app
```

Pour voir les logs de MongoDB :

```bash
docker-compose logs -f mongodb
```

## Remarques

- Les données MongoDB sont persistantes grâce au volume `mongodb_data`
- Vous pouvez modifier les variables d'environnement dans le fichier `docker-compose.yml`
- Pour un déploiement en production, assurez-vous de sécuriser correctement votre application 