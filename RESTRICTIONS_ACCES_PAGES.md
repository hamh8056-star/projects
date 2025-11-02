# Restrictions d'Accès aux Pages par Rôle

## 📋 Vue d'ensemble

Ce document liste les restrictions d'accès appliquées à chaque page selon le rôle de l'utilisateur dans AquaAI.

---

## 🔐 Restrictions par Page

### ✅ Tous les rôles (admin, opérateur, observateur)

| Page | Chemin | Dashboard | Historique | Alertes | IoT | Rapports |
|------|--------|-----------|------------|---------|-----|----------|
| **Dashboard** | `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Historique** | `/historique` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Alertes** | `/alertes` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Rapports** | `/rapports` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **IoT** | `/iot` | ✅ | ✅ | ✅ | ✅ | ✅ |

### ✅ Admin et Opérateur uniquement

| Page | Chemin | Admin | Opérateur | Observateur |
|------|--------|-------|-----------|-------------|
| **Gestion ferme** | `/ferme` | ✅ | ✅ | ❌ |
| **Lots** | `/lots` | ✅ | ✅ | ❌ |
| **Utilisateurs** | `/utilisateurs` | ✅ | ✅ | ❌ |

### 🔒 Admin uniquement

| Page | Chemin | Admin | Opérateur | Observateur |
|------|--------|-------|-----------|-------------|
| **Paramètres** | `/parametres` | ✅ | ❌ | ❌ |

### 👤 Tous les utilisateurs authentifiés

| Page | Chemin | Tous |
|------|--------|------|
| **Profil** | `/profil` | ✅ |

---

## 🛡️ Protection des Pages

### Méthode 1 : Filtrage du menu (Sidebar)

Le menu `Sidebar.tsx` filtre automatiquement les items selon le rôle :

```typescript
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    roles: ["admin", "operateur", "observateur"]
  },
  {
    name: "Gestion ferme",
    href: "/ferme",
    roles: ["admin", "operateur"]
  },
  {
    name: "Paramètres",
    href: "/parametres",
    roles: ["admin"]
  }
];

// Affichage filtré
{navigation
  .filter((item) => item.roles.includes(userRole))
  .map((item) => ...)}
```

### Méthode 2 : Protection dans les composants de page

Les pages sensibles vérifient le rôle et affichent une page d'erreur si nécessaire :

```typescript
export default function Ferme() {
  const { data: session } = useSession();
  
  // Protection accès : seuls admin et opérateur peuvent accéder
  if (session && session.user?.role !== "admin" && session.user?.role !== "operateur") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h1>
          <p className="text-gray-600">Cette page est réservée aux administrateurs et opérateurs.</p>
        </div>
      </div>
    );
  }
  
  // ... reste du code
}
```

---

## 📊 Tableau Complet des Accès

| Fonctionnalité | Admin | Opérateur | Observateur | Page |
|----------------|-------|-----------|-------------|------|
| **Dashboard** | ✅ Complet | ✅ Opérationnel | ✅ Lecture | `/dashboard` |
| **Historique** | ✅ Total | ✅ Lecture | ✅ Lecture | `/historique` |
| **Alertes** | ✅ CRUD | ✅ Traitement | ✅ Lecture | `/alertes` |
| **Gestion ferme** | ✅ Total | ✅ Gestion | ❌ Bloqué | `/ferme` |
| **Lots** | ✅ Total | ✅ CRUD | ❌ Bloqué | `/lots` |
| **Utilisateurs** | ✅ Gestion complète | ⚠️ Consultation | ❌ Bloqué | `/utilisateurs` |
| **Rapports** | ✅ Total | ✅ Lecture/Export | ✅ Lecture/Export | `/rapports` |
| **IoT** | ✅ Configuration | ✅ Surveillance | ✅ Lecture | `/iot` |
| **Paramètres** | ✅ Système | ❌ Bloqué | ❌ Bloqué | `/parametres` |
| **Profil** | ✅ | ✅ | ✅ | `/profil` |

---

## 🎯 Menus Spécialisés

### Menu Observateur

L'observateur a son propre menu (`ObservateurSidebar.tsx`) avec un design différent :

**Sections** :
- **Surveillance** : Dashboard, Historique, Alertes
- **Analyse** : Rapports, Tendances, Export Données
- **Données** : Mesures, Bassins, IoT Status
- **Documentation** : Guides, Paramètres

### Menu Admin/Opérateur

Menu standard (`Sidebar.tsx`) avec affichage conditionnel selon le rôle.

---

## 🔄 Redirections Automatiques

### Connexion réussie
- **Admin** → `/dashboard` (AdminDashboard)
- **Opérateur** → `/dashboard` (OperateurDashboard)
- **Observateur** → `/dashboard` (ObservateurDashboard)

### Tentative d'accès non autorisé
- Affichage d'une page d'erreur avec message explicite
- L'utilisateur reste sur la page actuelle (pas de redirection)

### Pages sans authentification
- Redirection automatique vers `/auth/signin`

---

## 📝 Implémentation Actuelle

### ✅ Pages protégées (vérification de rôle)
- `/ferme` - Admin et Opérateur
- `/lots` - Admin et Opérateur  
- `/utilisateurs` - Admin (gestion), Opérateur (consultation)

### ✅ Menu filtré
- `Sidebar.tsx` - Filtrage par rôle déjà implémenté

### ⚠️ Pages à protéger (si nécessaire)
- `/historique` - Accessible à tous (peut-être ajouter restrictions)
- `/alertes` - Accessible à tous (peut-être ajouter restrictions)
- `/rapports` - Accessible à tous (OK car lecture seule)
- `/iot` - Accessible à tous (OK car lecture pour observateur)
- `/parametres` - Menu déjà filtré admin uniquement

---

## 🚀 Prochaines Étapes

1. ✅ Filtrage du menu principal par rôle
2. ✅ Protection des pages Ferme et Lots
3. ✅ Documentation des restrictions
4. ⚠️ Vérifier protection des autres pages si nécessaire
5. ⚠️ Ajouter protection côté API pour double sécurité

---

**Version** : 1.0  
**Date** : 2024  
**AquaAI** - Gestion aquaculture intelligente

