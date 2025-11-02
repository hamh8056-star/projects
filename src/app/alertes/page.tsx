"use client";

import { useState } from "react";
import { Download, Bell, AlertTriangle, Info, CheckCircle, AlertCircle, Search, Trash2, RotateCcw } from "lucide-react";
import useSWR from "swr";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Alerte {
  _id: string;
  message: string;
  date: string;
  type: string;
  bassin: string;
  bassinId?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Alertes() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [bassinFilter, setBassinFilter] = useState("tous");
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirm, setShowConfirm] = useState<string|null>(null);
  const [feedback, setFeedback] = useState<string|null>(null);

  const { data: alertes = [], isLoading, error, mutate } = useSWR("/api/alertes", fetcher);
  const { data: bassins = [] } = useSWR("/api/bassins", fetcher);

  // Mapping des types d'alerte pour affichage et filtre
  const typeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    danger: { label: "Danger", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="w-3 h-3" /> },
    error: { label: "Danger", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="w-3 h-3" /> },
    warning: { label: "Avertissement", color: "bg-yellow-100 text-yellow-700", icon: <Info className="w-3 h-3" /> },
    alerte: { label: "Avertissement", color: "bg-yellow-100 text-yellow-700", icon: <Info className="w-3 h-3" /> },
    info: { label: "Info", color: "bg-cyan-100 text-cyan-700", icon: <CheckCircle className="w-3 h-3" /> },
  };

  // Dropdown type : toujours les mêmes options, dans l'ordre voulu
  const typeOptions = [
    { value: "tous", label: "Tous les types" },
    { value: "danger", label: "Danger" },
    { value: "warning", label: "Avertissement" },
    { value: "info", label: "Info" },
  ];
  // Dropdown bassin : 'Tous les bassins' + liste des bassins depuis la base (value = _id, label = nom)
  const bassinOptions = [
    { value: "tous", label: "Tous les bassins" },
    ...bassins.map((b: any) => ({ value: b._id, label: b.nom || b.name || b._id }))
  ];

  // Filtres
  const filtered = alertes.filter(a => {
    let matchType = true;
    if (typeFilter !== "tous") {
      if (typeFilter === "danger") {
        matchType = a.type === "danger" || a.type === "error";
      } else if (typeFilter === "warning") {
        matchType = a.type === "warning" || a.type === "alerte";
      } else if (typeFilter === "info") {
        matchType = a.type === "info";
      } else {
        matchType = a.type === typeFilter;
      }
    }
    let matchBassin = true;
    if (bassinFilter !== "tous") {
      matchBassin = a.bassin === bassinFilter || a.bassinId === bassinFilter;
    }
    // Filtre date du... au...
    let matchDateRange = true;
    if (dateDebut || dateFin) {
      const itemDate = new Date(a.date);
      if (dateDebut) {
        const debut = new Date(dateDebut);
        debut.setHours(0, 0, 0, 0);
        if (itemDate < debut) matchDateRange = false;
      }
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        if (itemDate > fin) matchDateRange = false;
      }
    }
    const matchSearch =
      !search ||
      (a.message && a.message.toLowerCase().includes(search.toLowerCase())) ||
      (a.bassin && a.bassin.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchBassin && matchDateRange && matchSearch;
  });

  const [page, setPage] = useState(1);
  const alertsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / alertsPerPage);
  const paginatedAlertes = filtered.slice((page - 1) * alertsPerPage, page * alertsPerPage);

  // Résumé visuel
  const nbAlertes = alertes.length;
  // Danger = type "danger" ou "error" sont considérés comme critiques
  const nbCritiques = alertes.filter(a => a.type === "danger" || a.type === "error").length;
  // Avertissements = type "warning" ou "alerte"
  const nbAvertissements = alertes.filter(a => a.type === "warning" || a.type === "alerte").length;
  // Info = type "info"
  const nbInfo = alertes.filter(a => a.type === "info").length;
  const lastAlerte = alertes[0]?.message || "-";

  // Suppression
  const handleDelete = async (id: string) => {
    setFeedback(null);
    try {
      const res = await fetch(`/api/alertes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      mutate();
      setFeedback("Alerte supprimée");
    } catch (e) {
      setFeedback("Erreur lors de la suppression");
    }
    setShowConfirm(null);
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Date", "Type", "Bassin", "Stade", "Message"];
    const rows = filtered.map(a => {
      const bassinObj = bassins.find(
        (bs: any) =>
          bs._id === a.bassin ||
          bs._id === a.bassinId ||
          bs.nom === a.bassin ||
          bs.name === a.bassin
      );
      const typeLabel = (typeMap[a.type] || typeMap.info).label;
      return [
        a.date ? new Date(a.date).toLocaleString() : "",
        typeLabel,
        bassinObj?.nom || bassinObj?.name || a.bassin || a.bassinId || "-",
        bassinObj?.stade || '-',
        a.message
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(x => `"${x.toString().replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alertes_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header avec titre et actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Alertes
            </h1>
            <p className="text-gray-600 mt-1">Gestion et suivi des alertes du système</p>
          </div>
        </div>
        
        {/* Cartes statistiques modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nbAlertes}</p>
                <p className="text-sm mt-1 text-green-600">Toutes alertes</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                <Bell className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critiques</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nbCritiques}</p>
                <p className="text-sm mt-1 text-red-600">À traiter</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avertissements</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nbAvertissements}</p>
                <p className="text-sm mt-1 text-yellow-600">Attention</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Informations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nbInfo}</p>
                <p className="text-sm mt-1 text-green-600">Suivi</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de filtres moderne */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-wrap gap-4">
            {/* Recherche */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
                  placeholder="Rechercher une alerte..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
              </div>
            </div>
            
            {/* Type */}
            <div className="w-full sm:w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Bassin */}
            <div className="w-full sm:w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bassin</label>
              <Select value={bassinFilter} onValueChange={setBassinFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bassinOptions.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date début */}
            <div className="w-full sm:w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
              />
            </div>
            
            {/* Date fin */}
            <div className="w-full sm:w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
          <input
            type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
              />
            </div>
            
            {/* Bouton Réinitialiser */}
            <div className="w-full sm:w-auto flex items-end">
              <button 
                onClick={() => {
                  setSearch("");
                  setTypeFilter("tous");
                  setBassinFilter("tous");
                  setDateDebut(new Date().toISOString().split('T')[0]);
                  setDateFin(new Date().toISOString().split('T')[0]);
                  setPage(1);
                }}
                className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
        {/* Tableau alertes moderne */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-cyan-600" /> Alertes
              </h2>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Bassin</th>
                <th className="p-2 text-left">Stade</th>
                <th className="p-2 text-left">Message</th>
                  <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        <span className="text-gray-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
              )}
              {error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-600">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
              )}
              {paginatedAlertes.length === 0 && !isLoading && !error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Bell className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500 text-lg font-medium">Aucune alerte trouvée</span>
                        <span className="text-gray-400 text-sm">Essayez de modifier vos filtres</span>
                      </div>
                    </td>
                  </tr>
              )}
              {paginatedAlertes.map(a => {
                const bassinObj = bassins.find(
                  (bs: any) =>
                    bs._id === a.bassin ||
                    bs._id === a.bassinId ||
                    bs.nom === a.bassin ||
                    bs.name === a.bassin
                );
                return (
                    <tr key={a._id} className="border-b">
                      <td className="p-2">{a.date ? new Date(a.date).toLocaleString() : ""}</td>
                    <td className="p-2">
                      {(() => {
                        const t = typeMap[a.type] || typeMap.info;
                        return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${t.color}`}>
                            {t.icon} {t.label}
                          </span>
                        );
                      })()}
                    </td>
                      <td className="p-2">{bassinObj?.nom || bassinObj?.name || a.bassin || a.bassinId || "-"}</td>
                      <td className="p-2">{bassinObj?.stade || '-'}</td>
                      <td className="p-2">{a.message}</td>
                    <td className="p-2 text-right">
                        <button 
                          onClick={() => setShowConfirm(a._id)} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {/* Pagination moderne */}
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> sur <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
              <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Précédent
              </button>
              <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Suivant
              </button>
              </div>
            </div>
          )}
        </div>
        {/* Modal de confirmation moderne */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
                </div>
                <p className="text-gray-600 mb-6">Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cette alerte ?</p>
                <div className="flex justify-end gap-3">
                  <button 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => setShowConfirm(null)}
                  >
                    Annuler
                  </button>
                  <button 
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    onClick={() => handleDelete(showConfirm!)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Toast de feedback moderne */}
        {feedback && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-900 font-medium">{feedback}</span>
            <button 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setFeedback(null)}
            >
              <span className="sr-only">Fermer</span>
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 