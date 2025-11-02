"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  History,
  Cpu,
  FileText,
  Database,
  BarChart3
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };
  
  const isAdmin = session?.user?.role === "admin";
  const isOperateur = session?.user?.role === "operateur";
  const isObservateur = session?.user?.role === "observateur";
  
  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="h-full bg-gradient-to-b from-cyan-900 to-blue-950 text-white p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">AquaAI</h1>
        <p className="text-sm text-cyan-300">Gestion aquaculture intelligente</p>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-1">
          {/* Dashboard - Tous les rôles */}
          <li>
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive("/dashboard")
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Home size={20} />
              <span>Tableau de bord</span>
            </Link>
          </li>
          
          {/* Gestion ferme - Admin et Opérateur uniquement */}
          {(isAdmin || isOperateur) && (
          <li>
            <Link
              href="/ferme"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive("/ferme")
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Database size={20} />
              <span>Gestion ferme</span>
            </Link>
          </li>
          )}
          
          {/* Lots - Admin et Opérateur uniquement */}
          {(isAdmin || isOperateur) && (
          <li>
            <Link
              href="/lots"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive("/lots")
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <FileText size={20} />
              <span>Lots</span>
            </Link>
          </li>
          )}
          
          {/* Utilisateurs - Admin uniquement */}
          {isAdmin && (
            <li>
              <Link
                href="/utilisateurs"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive("/utilisateurs")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Users size={20} />
                <span>Utilisateurs</span>
              </Link>
            </li>
          )}
          
          {/* Alertes - Tous les rôles */}
          <li>
            <Link
              href="/alertes"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive("/alertes")
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Bell size={20} />
              <span>Alertes</span>
            </Link>
          </li>
          
          {/* Historique - Tous les rôles */}
          <li>
            <Link
              href="/historique"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive("/historique")
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <History size={20} />
              <span>Historique</span>
            </Link>
          </li>
          
          {/* IoT - Tous les rôles */}
          <li>
            <Link
              href="/iot"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive("/iot")
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Cpu size={20} />
              <span>Appareils IoT</span>
            </Link>
          </li>
          
          {/* Rapports - Tous les rôles */}
          <li>
            <Link
              href="/rapports"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive("/rapports")
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <BarChart3 size={20} />
              <span>Rapports</span>
            </Link>
          </li>
          
          {/* Paramètres - Admin uniquement */}
          {isAdmin && (
            <li>
              <Link
                href="/parametres"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive("/parametres")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Settings size={20} />
                <span>Paramètres</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <Link
          href="/profil"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
            isActive("/profil")
              ? "bg-white/10 text-white"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
            {session?.user?.name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate">{session?.user?.name || "Utilisateur"}</p>
            <p className="text-xs text-cyan-300 truncate">
              {session?.user?.email || ""}
            </p>
          </div>
        </Link>
        
        <Link
          href="/api/auth/signout"
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white mt-2"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </Link>
      </div>
    </div>
  );
} 