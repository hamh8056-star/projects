# Fonctionnalités Proposées pour les Distributeurs

## 📋 Vue d'ensemble
Les distributeurs sont responsables de la distribution et de la vente des produits aquacoles. Voici les fonctionnalités proposées pour optimiser leur travail.

---

## 🎯 Fonctionnalités Principales

### 1. **Dashboard Distributeur** (Priorité: Haute)
**Description**: Vue d'ensemble personnalisée pour les distributeurs

**Fonctionnalités**:
- Statistiques de vente (quantités vendues, revenus)
- Lots disponibles pour la vente
- Lots en attente de distribution
- Alertes importantes (lots proches de la date limite)
- Graphiques de ventes (quotidien, hebdomadaire, mensuel)
- Top 5 des espèces les plus vendues
- Indicateurs de performance (KPI)

**Composants**:
- Cartes de statistiques (lots disponibles, vendus, en stock)
- Graphiques de ventes
- Liste des lots prioritaires
- Alertes et notifications

---

### 2. **Gestion des Lots Disponibles** (Priorité: Haute)
**Description**: Interface pour voir et gérer les lots prêts à être distribués

**Fonctionnalités**:
- Liste des lots disponibles (statut: "prêt à vendre")
- Filtres par:
  - Espèce
  - Date de création
  - Quantité disponible
  - Stade de développement
- Recherche par nom, ID, ou espèce
- Tri par date, quantité, espèce
- Vue détaillée d'un lot:
  - Informations complètes
  - Certificat de traçabilité
  - Historique du lot
  - QR code de traçabilité
- Actions rapides:
  - Marquer comme "en distribution"
  - Générer QR code
  - Imprimer étiquette
  - Voir certificat

---

### 3. **Génération de QR Codes** (✅ Déjà implémenté)
**Description**: Générer des QR codes pour les sacs de poissons

**Améliorations possibles**:
- Génération en lot (plusieurs lots à la fois)
- Templates d'impression personnalisables
- Historique des QR codes générés
- Statistiques d'utilisation des QR codes

---

### 4. **Gestion des Ventes/Distributions** (Priorité: Haute)
**Description**: Enregistrer et suivre les ventes

**Fonctionnalités**:
- Créer une vente/distribution:
  - Sélectionner le(s) lot(s)
  - Quantité vendue
  - Date de vente
  - Client (optionnel)
  - Prix unitaire
  - Notes
- Liste des ventes:
  - Historique complet
  - Filtres par date, lot, client
  - Export en PDF/Excel
- Statistiques de ventes:
  - Revenus totaux
  - Quantités vendues
  - Moyennes
  - Tendances

**Données à enregistrer**:
- ID de la vente
- Lot(s) concerné(s)
- Quantité
- Date et heure
- Distributeur (utilisateur actuel)
- Client (nom, contact - optionnel)
- Prix
- Statut (en attente, complétée, annulée)

---

### 5. **Gestion des Stocks** (Priorité: Moyenne)
**Description**: Suivi des stocks disponibles pour la vente

**Fonctionnalités**:
- Vue d'ensemble des stocks:
  - Quantité totale par espèce
  - Lots disponibles
  - Lots en cours de distribution
  - Alertes de stock faible
- Historique des mouvements:
  - Entrées (nouveaux lots)
  - Sorties (ventes)
  - Ajustements
- Prévisions:
  - Estimation de la durée des stocks
  - Recommandations de réapprovisionnement

---

### 6. **Impression d'Étiquettes** (Priorité: Moyenne)
**Description**: Générer et imprimer des étiquettes pour les produits

**Fonctionnalités**:
- Templates d'étiquettes:
  - Format standard (nom, espèce, QR code)
  - Format détaillé (avec toutes les infos)
  - Format personnalisé
- Impression:
  - Étiquette unique
  - Impression en lot
  - Aperçu avant impression
- Personnalisation:
  - Logo
  - Couleurs
  - Informations affichées
  - Taille

---

### 7. **Historique des Distributions** (Priorité: Moyenne)
**Description**: Consulter l'historique des distributions effectuées

**Fonctionnalités**:
- Liste chronologique des distributions
- Filtres:
  - Par date (période)
  - Par lot
  - Par client
  - Par espèce
- Détails d'une distribution:
  - Informations complètes
  - Lots concernés
  - Certificats de traçabilité
  - Documents associés
- Export:
  - PDF
  - Excel
  - CSV

---

### 8. **Rapports de Distribution** (Priorité: Basse)
**Description**: Générer des rapports sur les activités de distribution

**Fonctionnalités**:
- Rapports prédéfinis:
  - Rapport quotidien
  - Rapport hebdomadaire
  - Rapport mensuel
  - Rapport par espèce
- Graphiques:
  - Évolution des ventes
  - Répartition par espèce
  - Performance par période
- Export PDF/Excel

---

### 9. **Gestion des Clients** (Priorité: Basse)
**Description**: Gérer les informations des clients (optionnel)

**Fonctionnalités**:
- Liste des clients
- Ajouter/Modifier/Supprimer un client
- Informations client:
  - Nom
  - Contact (email, téléphone)
  - Adresse
  - Historique des achats
- Statistiques par client

---

### 10. **Notifications et Alertes** (Priorité: Moyenne)
**Description**: Alertes importantes pour les distributeurs

**Fonctionnalités**:
- Alertes de nouveaux lots disponibles
- Alertes de stocks faibles
- Rappels de distributions en attente
- Notifications de QR codes générés
- Alertes de dates limites

---

## 🎨 Interface Utilisateur

### Menu de Navigation pour Distributeur
```
📊 Dashboard
📦 Lots Disponibles
🏷️ QR Codes (déjà implémenté)
💰 Ventes/Distributions
📊 Stocks
📄 Historique
📈 Rapports
```

### Dashboard Distributeur - Layout
```
┌─────────────────────────────────────────────────┐
│  Statistiques Rapides                           │
│  [Lots Disponibles] [Vendus] [En Stock] [Revenus]│
├─────────────────────────────────────────────────┤
│  Graphiques de Ventes                           │
│  [Graphique ligne] [Graphique camembert]        │
├─────────────────────────────────────────────────┤
│  Lots Prioritaires                              │
│  [Liste des lots à distribuer]                  │
├─────────────────────────────────────────────────┤
│  Alertes                                        │
│  [Notifications importantes]                    │
└─────────────────────────────────────────────────┘
```

---

## 📊 Structure de Données

### Collection: `ventes` (à créer)
```javascript
{
  _id: ObjectId,
  lotId: ObjectId, // Référence au lot
  quantite: Number,
  dateVente: Date,
  distributeurId: ObjectId, // Référence à l'utilisateur distributeur
  client: {
    nom: String,
    email: String,
    telephone: String
  },
  prixUnitaire: Number,
  prixTotal: Number,
  statut: String, // "en_attente", "completee", "annulee"
  notes: String,
  qrCodeGenere: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `clients` (optionnel)
```javascript
{
  _id: ObjectId,
  nom: String,
  email: String,
  telephone: String,
  adresse: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Plan d'Implémentation

### Phase 1 (Priorité Haute)
1. ✅ Génération de QR codes (déjà fait)
2. Dashboard Distributeur personnalisé
3. Gestion des lots disponibles
4. Gestion des ventes/distributions

### Phase 2 (Priorité Moyenne)
5. Gestion des stocks
6. Impression d'étiquettes
7. Historique des distributions
8. Notifications et alertes

### Phase 3 (Priorité Basse)
9. Rapports de distribution
10. Gestion des clients

---

## 💡 Fonctionnalités Bonus

- **Application mobile**: Scanner QR codes directement
- **Notifications push**: Alertes en temps réel
- **Intégration paiement**: Gérer les paiements
- **API publique**: Permettre aux clients de vérifier leurs achats
- **Géolocalisation**: Suivre les distributions par zone
- **Chat/Support**: Communication avec les clients

---

## 📝 Notes

- Toutes les fonctionnalités doivent respecter les permissions du rôle "distributeur"
- Les données doivent être sécurisées et accessibles uniquement aux distributeurs autorisés
- L'interface doit être intuitive et mobile-friendly
- Les exports doivent être au format standard (PDF, Excel, CSV)

