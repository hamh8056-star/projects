"use client";

import { useSession, signOut } from "next-auth/react";
import { Eye, BarChart3, TrendingUp, AlertTriangle, Download, Settings, Clock, Activity, Database, FileText } from "lucide-react";

export default function ObservateurSidebar() {
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-700 to-cyan-700 text-white flex flex-col gap-4 p-6 shadow-lg">
      <div className="flex items-center gap-2 text-2xl font-bold mb-8">
        <span role="img" aria-label="fish">🐟</span> AquaAI
        <span className="text-sm bg-blue-600 px-2 py-1 rounded-full ml-2">Observateur</span>
      </div>
      
      {session && (
        <div className="mb-4 p-3 bg-blue-600/50 rounded-lg border border-blue-500/30">
          <div className="text-sm font-medium">{session.user?.name}</div>
          <div className="text-xs opacity-80 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {session.user?.role}
          </div>
        </div>
      )}
      
      <nav className="flex flex-col gap-2 flex-1">
        {/* Section Surveillance */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2 px-3">
            Surveillance
          </h3>
          <a href="/dashboard" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <Activity className="w-4 h-4" />
            Dashboard
          </a>
          <a href="/historique" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <Clock className="w-4 h-4" />
            Historique
          </a>
          <a href="/alertes" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <AlertTriangle className="w-4 h-4" />
            Alertes
          </a>
        </div>

        {/* Section Analyse */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2 px-3">
            Analyse
          </h3>
          <a href="/rapports" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <BarChart3 className="w-4 h-4" />
            Rapports
          </a>
          <a href="/tendances" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <TrendingUp className="w-4 h-4" />
            Tendances
          </a>
          <a href="/export" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <Download className="w-4 h-4" />
            Export Données
          </a>
        </div>

        {/* Section Données */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2 px-3">
            Données
          </h3>
          <a href="/mesures" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <Database className="w-4 h-4" />
            Mesures
          </a>
          <a href="/bassins" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <span className="text-lg">🐟</span>
            Bassins
          </a>
          <a href="/iot" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <span className="text-lg">📡</span>
            IoT Status
          </a>
        </div>

        {/* Section Documentation */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2 px-3">
            Documentation
          </h3>
          <a href="/guides" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <FileText className="w-4 h-4" />
            Guides
          </a>
          <a href="/parametres" className="flex items-center gap-3 hover:bg-blue-600/50 rounded-lg px-3 py-2 transition-colors">
            <Settings className="w-4 h-4" />
            Paramètres
          </a>
        </div>
      </nav>
      
      {/* Statut système */}
      <div className="p-3 bg-blue-600/30 rounded-lg border border-blue-500/20 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span>Statut système</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Opérationnel</span>
          </div>
        </div>
      </div>
      
      {session && (
        <button 
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="mt-auto bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>Déconnexion</span>
        </button>
      )}
    </aside>
  );
} 