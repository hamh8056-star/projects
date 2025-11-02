This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Système de traçabilité QuaFish

Le système de traçabilité QuaFish permet de suivre chaque lot de poissons via un QR code contenant des informations sur les conditions d'élevage.

### Configuration requise

1. Installer les dépendances :
   ```bash
   npm install qrcode react-qr-code --legacy-peer-deps
   npm install --save-dev @types/qrcode --legacy-peer-deps
   ```

2. Configurer l'URL de base dans votre fichier `.env.local` :
   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
   En production, remplacez par votre URL réelle.

### Fonctionnalités

- **Gestion des lots** : Créez et gérez des lots de poissons avec leur historique complet.
- **Génération de QR codes** : Générez un QR code unique pour chaque lot.
- **Page publique de traçabilité** : Une page accessible via le QR code qui affiche toutes les informations du lot.
- **Statistiques automatiques** : Calcul automatique des moyennes de température, pH, oxygène, etc.

### Workflow

1. Créez un lot dans la section "Lots"
2. Le système collecte automatiquement les données des capteurs pour ce lot
3. Générez un QR code pour le lot
4. Lors de la récolte, marquez le lot comme "récolté"
5. Le QR code reste accessible et contient l'historique complet

## Résumé du système de traçabilité QuaFish

Le système de traçabilité QuaFish est maintenant entièrement implémenté dans l'application AquaAI. Il permet de :

1. **Créer et gérer des lots** de poissons avec toutes leurs informations
2. **Suivre l'historique** de chaque lot (bassins, événements, conditions d'élevage)
3. **Générer des QR codes** uniques pour chaque lot
4. **Offrir une page publique** accessible via le QR code pour les consommateurs

### Architecture du système

- **Collection MongoDB** pour stocker les lots et leurs données
- **API REST** pour la gestion des lots et la génération des QR codes
- **Interface utilisateur** pour la gestion des lots et la visualisation des données
- **Page publique** pour l'accès aux informations via QR code

### Prochaines étapes possibles

- Intégration avec un système d'étiquetage automatique
- Exportation des données au format PDF
- Application mobile dédiée pour les consommateurs
- Intégration avec une blockchain pour une traçabilité immuable
