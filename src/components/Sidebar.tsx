"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  History, 
  Bell, 
  Users, 
  Settings, 
  BarChart3, 
  Fish, 
  LogOut,
  Menu,
  X,
  Activity,
  Database,
  Shield,
  QrCode,
  ShoppingCart
} from "lucide-react";
import Loader, { LoaderIcon } from "@/components/ui/Loader";
import { useSidebar } from "@/components/contexts/SidebarContext";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Déterminer le rôle de l'utilisateur
  const userRole = session?.user?.role || '';
  const isAdmin = userRole === "admin";
  const isOperateur = userRole === "operateur";
  const isObservateur = userRole === "observateur";
  const isDistributeur = userRole === "distributeur";

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Vue d'ensemble",
      roles: ["admin", "operateur", "observateur", "distributeur"]
    },
    {
      name: "Historique",
      href: "/historique",
      icon: History,
      description: "Données historiques",
      roles: ["admin", "operateur", "observateur"]
    },
    {
      name: "Alertes",
      href: "/alertes",
      icon: Bell,
      description: "Notifications",
      roles: ["admin", "operateur", "observateur"]
    },
    {
      name: "Gestion ferme",
      href: "/ferme",
      icon: Fish,
      description: "Gestion des lots",
      roles: ["admin", "operateur"]
    },
    {
      name: "Lots",
      href: "/lots",
      icon: Database,
      description: "Traçabilité des lots",
      roles: ["admin", "operateur"]
    },
    {
      name: "QR Code",
      href: "/distributeur",
      icon: QrCode,
      description: "Générer QR codes",
      roles: ["distributeur", "admin", "operateur"]
    },
    {
      name: "Ventes",
      href: "/ventes",
      icon: ShoppingCart,
      description: "Gérer les ventes",
      roles: ["distributeur", "admin", "operateur"]
    },
    {
      name: "Clients",
      href: "/clients",
      icon: Users,
      description: "Gérer les clients",
      roles: ["distributeur", "admin", "operateur"]
    },
    {
      name: "Utilisateurs",
      href: "/utilisateurs",
      icon: Users,
      description: "Gestion des accès",
      roles: ["admin"]
    },
    {
      name: "Rapports",
      href: "/rapports",
      icon: BarChart3,
      description: "Analyses et rapports",
      roles: ["admin", "operateur", "observateur"]
    },
    {
      name: "IoT",
      href: "/iot",
      icon: Activity,
      description: "Connectivité IoT",
      roles: ["admin", "operateur", "observateur"]
    },
    {
      name: "Paramètres",
      href: "/parametres",
      icon: Settings,
      description: "Configuration",
      roles: ["admin"]
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'operateur': return 'bg-blue-100 text-blue-800';
      case 'observateur': return 'bg-green-100 text-green-800';
      case 'distributeur': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'operateur': return 'Opérateur';
      case 'observateur': return 'Observateur';
      case 'distributeur': return 'Distributeur';
      default: return role;
    }
  };

  return (
    <>
      {/* Bouton menu mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-slate-700 transition-all duration-300 z-50
          ${isCollapsed ? 'w-16' : 'w-64'}
          flex flex-col justify-between
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        tabIndex={-1}
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-700 ${isCollapsed ? 'px-2 justify-center' : 'px-4 justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Fish size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">AquaAI</span>
            </div>
          )}
          {/* Bouton toggle collapse - Desktop uniquement */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
            aria-label={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-2'}`}>
          {navigation
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)} // Fermer le menu mobile après clic
                className={`
                    group relative flex items-center ${isCollapsed ? 'px-2' : 'px-3'} py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                    ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon 
                    size={18} 
                  className={`
                    flex-shrink-0 transition-colors
                    ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                  `} 
                />
                {!isCollapsed && (
                  <div className="ml-3 flex-1">
                    <span>{item.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                )}
                {isCollapsed && (
                    <div className="absolute left-full ml-2 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile collé en bas */}
        {session?.user && (
          <div className={`absolute bottom-0 left-0 w-full border-t border-slate-700 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              {!isCollapsed && (
                <>
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {session.user.email}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getRoleColor(session.user.role || '')}`}>
                    {getRoleLabel(session.user.role || '')}
                  </span>
                </div>
                </>
              )}
              <button
                onClick={() => {
                  setLoggingOut(true);
                  setTimeout(() => signOut({ callbackUrl: '/' }), 1500);
                }}
                className={`p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
                title="Se déconnecter"
              >
                {loggingOut ? (
                  <LoaderIcon size={18} />
                ) : (
                  <LogOut size={18} />
                )}
              </button>
            </div>
          </div>
        )}

        {/* System Status */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Statut système</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">En ligne</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
} 