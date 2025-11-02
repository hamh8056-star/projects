# Documentation des Menus AquaAI par Rôle

## 🎯 Vue d'ensemble

Le système AquaAI utilise un système de menus différentié selon les rôles des utilisateurs. Il existe **3 rôles principaux** : **Administrateur**, **Opérateur**, et **Observateur**.

---

## 📋 Table des matières

1. [Menu Administrateur](#menu-administrateur)
2. [Menu Opérateur](#menu-opérateur)
3. [Menu Observateur](#menu-observateur)
4. [Comparaison des accès](#comparaison-des-accès)

---

## 👨‍💼 Menu Administrateur

**Rôle** : Accès complet à tous les modules du système

### Modules disponibles :

| Module | Icône | Description | Chemin |
|--------|-------|-------------|--------|
| **Dashboard** | 📊 | Vue d'ensemble complète du système | `/dashboard` |
| **Historique** | 🕐 | Données historiques des mesures | `/historique` |
| **Alertes** | 🔔 | Gestion et résolution des alertes | `/alertes` |
| **Gestion ferme** | 🐟 | Gestion des bassins et de la ferme | `/ferme` |
| **Lots** | 📦 | Traçabilité des lots de poissons | `/lots` |
| **Utilisateurs** | 👥 | Gestion des utilisateurs et permissions | `/utilisateurs` |
| **Rapports** | 📈 | Analyses et rapports détaillés | `/rapports` |
| **IoT** | 🔌 | Appareils et capteurs IoT | `/iot` |
| **Paramètres** | ⚙️ | Configuration système | `/parametres` |
| **Profil** | 👤 | Gestion du profil personnel | `/profil` |

### Permissions spécifiques :
- ✅ Création et suppression d'utilisateurs
- ✅ Configuration système avancée
- ✅ Accès aux paramètres de sécurité
- ✅ Export de données
- ✅ Gestion des rôles et permissions

---

## 👷 Menu Opérateur

**Rôle** : Accès aux modules opérationnels pour la gestion quotidienne

### Modules disponibles :

| Module | Icône | Description | Chemin |
|--------|-------|-------------|--------|
| **Dashboard** | 📊 | Vue d'ensemble opérationnelle | `/dashboard` |
| **Historique** | 🕐 | Consultation des données historiques | `/historique` |
| **Alertes** | 🔔 | Visualisation et traitement des alertes | `/alertes` |
| **Gestion ferme** | 🐟 | Gestion quotidienne des bassins | `/ferme` |
| **Lots** | 📦 | Consultation et gestion des lots | `/lots` |
| **Utilisateurs** | 👥 | Consultation des utilisateurs | `/utilisateurs` |
| **IoT** | 🔌 | Surveillance des appareils IoT | `/iot` |
| **Profil** | 👤 | Gestion du profil personnel | `/profil` |

### Permissions spécifiques :
- ✅ Création et modification de lots
- ✅ Gestion des bassins
- ✅ Traitement des alertes
- ✅ Consultation des utilisateurs
- ❌ Pas d'accès aux paramètres système
- ❌ Pas de création d'utilisateurs

### Modules limités :
- ⚠️ **Rapports** : Lecture seule
- ⚠️ **Paramètres** : Accès restreint

---

## 👁️ Menu Observateur

**Rôle** : Accès en lecture seule pour surveillance et analyse

### Modules disponibles :

#### Section Surveillance
| Module | Icône | Description | Chemin |
|--------|-------|-------------|--------|
| **Dashboard** | 📊 | Vue d'ensemble observateur | `/dashboard` |
| **Historique** | 🕐 | Consultation historique | `/historique` |
| **Alertes** | 🚨 | Visualisation des alertes | `/alertes` |

#### Section Analyse
| Module | Icône | Description | Chemin |
|--------|-------|-------------|--------|
| **Rapports** | 📈 | Rapports détaillés | `/rapports` |
| **Tendances** | 📊 | Analyse des tendances | `/tendances` |
| **Export Données** | 💾 | Export de données | `/export` |

#### Section Données
| Module | Icône | Description | Chemin |
|--------|-------|-------------|--------|
| **Mesures** | 🗄️ | Visualisation des mesures | `/mesures` |
| **Bassins** | 🐟 | Informations sur les bassins | `/bassins` |
| **IoT Status** | 📡 | État des capteurs IoT | `/iot` |

#### Section Documentation
| Module | Icône | Description | Chemin |
|--------|-------|-------------|--------|
| **Guides** | 📄 | Documentation et guides | `/guides` |
| **Paramètres** | ⚙️ | Paramètres personnels | `/parametres` |

### Permissions spécifiques :
- ✅ Consultation en lecture seule de tous les modules
- ✅ Export de données
- ✅ Génération de rapports
- ❌ Aucune modification
- ❌ Pas de gestion des utilisateurs
- ❌ Pas de traitement des alertes

---

## 📊 Comparaison des accès

| Fonctionnalité | Admin | Opérateur | Observateur |
|----------------|-------|-----------|-------------|
| **Dashboard** | ✅ Complet | ✅ Opérationnel | ✅ Lecture |
| **Historique** | ✅ Total | ✅ Lecture | ✅ Lecture |
| **Alertes** | ✅ CRUD | ✅ Traitement | ✅ Lecture |
| **Gestion ferme** | ✅ Total | ✅ Gestion | ❌ |
| **Lots** | ✅ Total | ✅ CRUD | ❌ |
| **Utilisateurs** | ✅ Gestion complète | ⚠️ Consultation | ❌ |
| **Rapports** | ✅ Total | ⚠️ Lecture | ✅ Lecture |
| **IoT** | ✅ Configuration | ✅ Surveillance | ✅ Lecture |
| **Paramètres** | ✅ Système | ⚠️ Limité | ⚠️ Personnels |
| **Création utilisateurs** | ✅ | ❌ | ❌ |
| **Suppression utilisateurs** | ✅ | ❌ | ❌ |
| **Export données** | ✅ | ⚠️ Limité | ✅ |

**Légende** :
- ✅ Accès complet
- ⚠️ Accès limité
- ❌ Pas d'accès

---

## 🎨 Design des interfaces

### Interface Administrateur et Opérateur
- **Couleur** : Dégradé cyan-900 à blue-950
- **Sidebar** : `src/components/Sidebar.tsx`
- **Style** : Professionnel, complet

### Interface Observateur
- **Couleur** : Dégradé blue-700 à cyan-700
- **Sidebar** : `src/components/layout/ObservateurSidebar.tsx`
- **Style** : Moderne, minimaliste

---

## 🔒 Sécurité et authentification

### Gestion des rôles
```typescript
// Vérification du rôle dans le layout
if (session.user?.role !== "observateur") {
  router.push("/dashboard");
}

// Affichage conditionnel dans Sidebar
{isAdmin && (
  <Link href="/utilisateurs">...</Link>
)}

{(isAdmin || isOperateur) && (
  <Link href="/utilisateurs">...</Link>
)}
```

### Fichiers clés
- `src/components/layout/Sidebar.tsx` - Menu admin/opérateur
- `src/components/layout/ObservateurSidebar.tsx` - Menu observateur
- `src/components/layout/ObservateurLayout.tsx` - Layout observateur
- `src/app/dashboard/page.tsx` - Routage selon rôle

---

## 📝 Notes importantes

1. **Navigation dynamique** : Les menus s'adaptent automatiquement selon le rôle
2. **Responsive** : Tous les menus sont adaptés mobile avec bouton hamburger
3. **Badges de rôle** : Affichage visuel du rôle utilisateur
4. **Déconnexion** : Accessible depuis tous les menus
5. **Profil** : Accessible par tous les rôles

---

## 🚀 Utilisation

Pour changer de rôle ou tester différents menus :
1. Connectez-vous avec un compte correspondant au rôle
2. Le menu s'adapte automatiquement
3. Les restrictions d'accès sont appliquées côté serveur et client

---

**Version** : 1.0  
**Date** : 2024  
**AquaAI** - Gestion aquaculture intelligente

