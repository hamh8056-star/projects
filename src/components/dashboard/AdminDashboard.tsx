"use client";

import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui";
import useSWR, { mutate } from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect, useRef } from "react";
import { Users, Shield, Activity, Database, AlertTriangle, CheckCircle, Trash2, Plus, X, Wifi, WifiOff } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json()).then(data => {
  // Si l'API retourne un objet avec une propriété 'mesures', on l'extrait
  if (data && typeof data === 'object' && 'mesures' in data) {
    return data.mesures;
  }
  // Sinon on retourne les données telles quelles
  return data;
});

export default function AdminDashboard() {
  const { data: mesures, isLoading: mesuresLoading } = useSWR("/api/mesures", fetcher);
  const { data: alertes, isLoading: alertesLoading } = useSWR("/api/alertes", fetcher);
  const { data: utilisateurs = [], isLoading: usersLoading, error: usersError } = useSWR("/api/utilisateurs", fetcher);
  const { data: bassins = [], isLoading: bassinsLoading } = useSWR("/api/bassins", fetcher);
  const { data: iotStatus, isLoading: iotLoading } = useSWR("/api/iot/status", fetcher);
  const [localIotStatus, setLocalIotStatus] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [iotUpdating, setIotUpdating] = useState(false);
  const [lastIoTUpdate, setLastIoTUpdate] = useState<Date | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedBassin, setSelectedBassin] = useState("");
  const [showBassinDetails, setShowBassinDetails] = useState(false);
  const [showBassinHistory, setShowBassinHistory] = useState(false);
  const [selectedBassinForModal, setSelectedBassinForModal] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedGraphParam, setSelectedGraphParam] = useState('temperature');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "operateur" });
  const [adding, setAdding] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState({ name: "", email: "", role: "operateur" });
  const [page, setPage] = useState(1);
  const usersPerPage = 10;
  const [alertFilter, setAlertFilter] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAddBassin, setShowAddBassin] = useState(false);
  const [newBassin, setNewBassin] = useState({ nom: "", stade: "" });
  const [addingBassin, setAddingBassin] = useState(false);
  const [selectedBassinChart, setSelectedBassinChart] = useState<string>("");
  const bassinOptions = (bassins || []).map((b: any) => ({ id: b._id, nom: b.nom || b.name || b._id }));
  const [realtimeMesures, setRealtimeMesures] = useState<any[]>([]);
  const wsToken = process.env.NEXT_PUBLIC_IOT_WS_TOKEN || 'TON_SECRET_TOKEN';
  // Utiliser l'URL WebSocket depuis les variables d'environnement ou localhost par défaut
  const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? 
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:4001` : 
    'ws://localhost:4001');
  const wsUrl = `${wsBaseUrl}/?token=${wsToken}`;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!selectedBassinChart && bassinOptions.length > 0) {
      setSelectedBassinChart(bassinOptions[0].id);
    }
  }, [bassins]);

  // Initialiser selectedBassin avec le premier bassin disponible
  useEffect(() => {
    if (bassins.length > 0 && selectedBassin === "") {
      const firstBassin = bassins[0];
      const initialValue = firstBassin._id || firstBassin.nom || firstBassin.name || "all";
      console.log('🏊 Initialisation selectedBassin:', { bassins, firstBassin, initialValue });
      setSelectedBassin(initialValue);
    }
  }, [bassins]);

  // Initialiser l'état local IoT avec les données de l'API
  useEffect(() => {
    if (iotStatus && !localIotStatus) {
      setLocalIotStatus(iotStatus);
      setLastIoTUpdate(new Date());
    }
  }, [iotStatus, localIotStatus]);

  // Mise à jour automatique de l'affichage du temps écoulé
  useEffect(() => {
    if (!lastIoTUpdate) return;
    
    const interval = setInterval(() => {
      // Force re-render pour mettre à jour l'affichage du temps
      setLastIoTUpdate(prev => prev ? new Date(prev.getTime()) : null);
      setForceUpdate(prev => prev + 1); // Force re-render des bassins
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastIoTUpdate]);

  // Polling automatique pour mettre à jour le statut IoT
  useEffect(() => {
    const pollIoTStatus = async () => {
      try {
        setIotUpdating(true);
        const response = await fetch("/api/iot/status");
        const data = await response.json();
        setLocalIotStatus(data);
        setLastIoTUpdate(new Date());
      } catch (error) {
        console.error("Erreur polling IoT status:", error);
      } finally {
        setIotUpdating(false);
      }
    };

    // Polling toutes les 30 secondes pour maintenir les données à jour
    const interval = setInterval(pollIoTStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Connexion WebSocket pour mesures temps réel
  useEffect(() => {
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'mesure') {
          setRealtimeMesures(prev => {
            // On évite les doublons (même date+param)
            const key = (m: any) => `${m.date || m.timestamp}_${m.param || m.temperature ? 'Température' : m.ph ? 'pH' : m.oxygene ? 'Oxygène' : ''}`;
            const newKey = key(data);
            if (prev.some(m => key(m) === newKey)) return prev;
            return [...prev.slice(-99), data];
          });
        }
        
        // Gestion des mises à jour IoT en temps réel - PRIORITÉ MAXIMALE
        if (data.type === 'iot_status_update') {
          console.log("📱 Mise à jour statut IoT reçue:", data);
          
          if (data.event === 'iot_status_changed') {
            // Mise à jour IMMÉDIATE du statut IoT sans délai
            setLocalIotStatus((prev: any) => {
              if (!prev) return prev;
              
              const updatedDevices = prev.devices.map((device: any) => {
                if (device.mac === data.data.mac) {
                  return {
                    ...device,
                    status: data.data.status,
                    lastSeen: data.data.lastSeen,
                    updatedAt: new Date().toISOString()
                  };
                }
                return device;
              });
              
              // Recalcul IMMÉDIAT des statistiques
              const stats = {
                total: updatedDevices.length,
                online: updatedDevices.filter((d: any) => d.status === 'online').length,
                offline: updatedDevices.filter((d: any) => d.status === 'offline').length,
                error: updatedDevices.filter((d: any) => d.status === 'error').length,
                recentlySeen: updatedDevices.filter((d: any) => {
                  if (!d.lastSeen) return false;
                  return Date.now() - new Date(d.lastSeen).getTime() < 5 * 60 * 1000;
                }).length
              };
              
              return {
                ...prev,
                devices: updatedDevices,
                stats,
                timestamp: new Date().toISOString()
              };
            });
            
            // Mise à jour IMMÉDIATE du timestamp
            setLastIoTUpdate(new Date());
            
            // Notification toast IMMÉDIATE
            const statusText = data.data.status === 'online' ? 'connecté' : 'déconnecté';
            setToast({ 
              type: data.data.status === 'online' ? "success" : "error", 
              message: `IoT ${data.data.mac} ${statusText}` 
            });
          }
        }
        
        // Réception d'un snapshot complet des statuts IoT
        if (data.type === 'iot_status_snapshot') {
          console.log("📊 Snapshot IoT reçu:", data);
          setLocalIotStatus(data.data);
          setLastIoTUpdate(new Date());
        }
        
        // Gestion des événements IoT spécifiques
        if (data.type === 'iot_connected') {
          console.log("🔌 IoT connecté:", data);
          // Mise à jour immédiate pour un nouvel IoT connecté
          setLocalIotStatus((prev: any) => {
            if (!prev) return prev;
            
            const newDevice = {
              mac: data.mac,
              status: 'online',
              lastSeen: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            const updatedDevices = [...prev.devices, newDevice];
            const stats = {
              total: updatedDevices.length,
              online: updatedDevices.filter((d: any) => d.status === 'online').length,
              offline: updatedDevices.filter((d: any) => d.status === 'offline').length,
              error: updatedDevices.filter((d: any) => d.status === 'error').length,
              recentlySeen: updatedDevices.filter((d: any) => {
                if (!d.lastSeen) return false;
                return Date.now() - new Date(d.lastSeen).getTime() < 5 * 60 * 1000;
              }).length
            };
            
            return {
              ...prev,
              devices: updatedDevices,
              stats,
              timestamp: new Date().toISOString()
            };
          });
          setLastIoTUpdate(new Date());
        }
        
        if (data.type === 'iot_disconnected') {
          console.log("🔌 IoT déconnecté:", data);
          // Mise à jour immédiate pour un IoT déconnecté
          setLocalIotStatus((prev: any) => {
            if (!prev) return prev;
            
            const updatedDevices = prev.devices.map((device: any) => {
              if (device.mac === data.mac) {
                return {
                  ...device,
                  status: 'offline',
                  lastSeen: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
              }
              return device;
            });
            
            const stats = {
              total: updatedDevices.length,
              online: updatedDevices.filter((d: any) => d.status === 'online').length,
              offline: updatedDevices.filter((d: any) => d.status === 'offline').length,
              error: updatedDevices.filter((d: any) => d.status === 'error').length,
              recentlySeen: updatedDevices.filter((d: any) => {
                if (!d.lastSeen) return false;
                return Date.now() - new Date(d.lastSeen).getTime() < 5 * 60 * 1000;
              }).length
            };
            
            return {
              ...prev,
              devices: updatedDevices,
              stats,
              timestamp: new Date().toISOString()
            };
          });
          setLastIoTUpdate(new Date());
        }
        
      } catch (error) {
        console.error("Erreur parsing WebSocket message:", error);
      }
    };
    
    wsRef.current.onopen = () => {
      console.log("🔌 WebSocket connecté pour AdminDashboard");
      setWsConnected(true);
    };
    
    wsRef.current.onerror = (error) => {
      console.error("❌ Erreur WebSocket AdminDashboard:", error);
      setWsConnected(false);
    };
    
    wsRef.current.onclose = () => {
      console.log("🔌 WebSocket déconnecté AdminDashboard");
      setWsConnected(false);
    };
    
    return () => { wsRef.current?.close(); };
  }, [wsUrl]);

  const filteredUsers = utilisateurs.filter((u: any) =>
    (u.name || u.nom || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice((page - 1) * usersPerPage, page * usersPerPage);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  async function handleEditUser(id: string) {
    setEditUserId(id);
    const user = utilisateurs.find((u: any) => u._id === id);
    setEditUser({ name: user.name, email: user.email, role: user.role });
  }
  async function handleSaveUser(id: string) {
    await fetch(`/api/utilisateurs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    });
    setEditUserId(null);
    mutate("/api/utilisateurs");
    setToast({ type: "success", message: "Utilisateur modifié avec succès" });
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm("Confirmer la suppression de l'utilisateur ?")) return;
    setDeletingId(id);
    await fetch(`/api/utilisateurs/${id}`, { method: "DELETE" });
    mutate("/api/utilisateurs");
    setDeletingId(null);
    setToast({ type: "success", message: "Utilisateur supprimé" });
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    await fetch("/api/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    setShowAddUser(false);
    setNewUser({ name: "", email: "", role: "operateur" });
    setAdding(false);
    mutate("/api/utilisateurs");
  }

  const alertesArray = Array.isArray(alertes) ? alertes : [];
  const mesuresArray = Array.isArray(mesures) ? mesures : [];
  
  // Filtrer les données par bassin sélectionné
  const filteredByBassinMesures = selectedBassin
    ? mesuresArray.filter((item: any) => {
        const itemBassin = item.bassinId || item.bassin || item.nomBassin;
        // console.log('🔍 Filtre mesures:', { selectedBassin, itemBassin, match: itemBassin === selectedBassin });
        return itemBassin === selectedBassin;
      })
    : mesuresArray;

  const filteredByBassinAlertes = selectedBassin
    ? alertesArray.filter((item: any) => {
        const itemBassin = item.bassinId || item.bassin || item.nomBassin;
        // console.log('🔍 Filtre alertes:', { selectedBassin, itemBassin, match: itemBassin === selectedBassin });
        return itemBassin === selectedBassin;
      })
    : alertesArray;

  // Filtrer ensuite par type d'alerte
  const filteredAlertes = alertFilter
    ? filteredByBassinAlertes.filter((a: any) => a.type === alertFilter)
    : filteredByBassinAlertes;

  async function handleResolveAlerte(id: string) {
    await fetch(`/api/alertes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolved: true }) });
    mutate("/api/alertes");
    setToast({ type: "success", message: "Alerte marquée comme résolue" });
  }

  function exportMesuresCSV() {
    const mesuresArray = Array.isArray(mesures) ? mesures : [];
    const csv = [
      ["Date", "Paramètre", "Valeur", "Bassin"],
      ...mesuresArray.map((m: any) => [new Date(m.date).toLocaleString(), m.param, m.value, m.bassin])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mesures.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Fusionne les mesures REST et temps réel pour le graphique
  const allMesures = [...(Array.isArray(mesures) ? mesures : []), ...realtimeMesures];

  const temperatureData = allMesures
    .filter((item: any) => {
      const isTemp = item.param === "Température" || typeof item.temperature !== 'undefined';
      const bassinId = item.bassinId || item.bassin;
      return isTemp && bassinId === selectedBassinChart;
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20)
    .map((item: any) => ({
      date: new Date(item.date).toLocaleTimeString(),
      value: parseFloat((item.value ?? item.temperature ?? "").toString().replace(/[^\d.\-]/g, "")),
    }));

  const alertesParType = [
    { name: "Avertissements", value: filteredByBassinAlertes.filter((a: any) => a.type === "warning").length, color: "#f59e0b" },
    { name: "Erreurs", value: filteredByBassinAlertes.filter((a: any) => a.type === "error").length, color: "#ef4444" },
    { name: "Info", value: filteredByBassinAlertes.filter((a: any) => !a.type).length, color: "#3b82f6" },
  ];

  const derniereMesures = filteredByBassinMesures.slice(0, 5);

  const usersByRole = {
    admin: utilisateurs.filter((u: any) => u.role === "admin").length,
    operateur: utilisateurs.filter((u: any) => u.role === "operateur").length,
    observateur: utilisateurs.filter((u: any) => u.role === "observateur").length,
  };

  async function handleAddBassin(e: React.FormEvent) {
    e.preventDefault();
    setAddingBassin(true);
    await fetch("/api/bassins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBassin),
    });
    setShowAddBassin(false);
    setNewBassin({ nom: "", stade: "" });
    setAddingBassin(false);
    mutate("/api/bassins");
    setToast({ type: "success", message: "Bassin ajouté avec succès" });
  }

  // Fonction pour rafraîchir les données IoT
  const refreshIoTData = async () => {
    try {
      setIotUpdating(true);
      const response = await fetch("/api/iot/status");
      const data = await response.json();
      setLocalIotStatus(data);
      setLastIoTUpdate(new Date());
      setToast({ type: "success", message: "Données IoT mises à jour" });
    } catch (error) {
      setToast({ type: "error", message: "Erreur lors de la mise à jour IoT" });
    } finally {
      setIotUpdating(false);
    }
  };

  // Fonction pour ouvrir les détails d'un bassin
  const openBassinDetails = (bassin: any) => {
    setSelectedBassinForModal(bassin);
    setShowBassinDetails(true);
  };

  // Fonction pour ouvrir l'historique d'un bassin
  const openBassinHistory = (bassin: any) => {
    setSelectedBassinForModal(bassin);
    setCurrentPage(1); // Réinitialiser à la première page
    setSelectedGraphParam('temperature'); // Réinitialiser le filtre de graphique
    setShowBassinHistory(true);
  };

  // Fonction pour formater le temps écoulé
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  // Fonction pour vérifier si un bassin a un appareil IoT connecté
  const getBassinIoTStatus = (bassinId: string) => {
    if (!localIotStatus?.devices) return { connected: false, device: null };
    
    const connectedDevice = localIotStatus.devices.find((device: any) => 
      device.bassinId === bassinId && device.status === 'online'
    );
    
    return {
      connected: !!connectedDevice,
      device: connectedDevice
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <div className="fixed left-0 top-0 h-full w-64 z-40">
        <Sidebar />
      </div>
      <main className="flex-1 w-full p-4 md:p-8">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>{toast.message}</div>
        )}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4 mb-8 sticky top-0 z-10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
              <p className="text-gray-600">Gestion complète de la ferme aquacole</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Système opérationnel</span>
              </div>
              {/* Indicateur WebSocket */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {wsConnected ? 'Temps réel actif' : 'Temps réel inactif'}
                </span>
              </div>
              {/* Indicateur IoT global */}
              {localIotStatus && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    localIotStatus.stats?.online > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    IoT: {localIotStatus.stats?.online || 0}/{localIotStatus.stats?.total || 0} connectés
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-bold">LIVE</span>
                  <button 
                    onClick={refreshIoTData}
                    disabled={iotUpdating}
                    className={`ml-2 p-1 transition-colors ${
                      iotUpdating 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-500 hover:text-cyan-600'
                    }`}
                    title="Rafraîchir les données IoT"
                  >
                    {iotUpdating ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                  {iotUpdating && (
                    <span className="text-xs text-cyan-600 animate-pulse">Mise à jour...</span>
                  )}
                  {lastIoTUpdate && (
                    <span className="text-xs text-gray-500">
                      Dernière mise à jour: {formatTimeAgo(lastIoTUpdate)}
                    </span>
                  )}
                </div>
              )}
              <select 
                value={selectedBassin} 
                onChange={(e) => {
                  console.log('🔄 Changement selectedBassin:', e.target.value);
                  setSelectedBassin(e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {bassinsLoading ? (
                  <option>Chargement...</option>
                ) : bassins.length === 0 ? (
                  <option>Aucun bassin</option>
                ) : (
                  bassins.map((b: any) => (
                    <option key={b._id} value={b._id || b.nom || b.name}>
                      {b.nom || b.name || b._id}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: "Utilisateurs actifs", 
              value: utilisateurs.length.toString(), 
              icon: <Users className="w-6 h-6" />, 
              trend: `${usersByRole.operateur} opérateurs`, 
              color: "from-blue-500 to-cyan-500",
              status: "normal"
            },
            { 
              title: "Alertes critiques", 
              value: filteredByBassinAlertes.filter((a: any) => a.type === "error").length.toString(), 
              icon: <AlertTriangle className="w-6 h-6" />, 
              trend: "À traiter", 
              color: "from-red-500 to-pink-500",
              status: "alert"
            },
            { 
              title: "IoT Connectés", 
              value: localIotStatus?.stats ? `${localIotStatus.stats.online}/${localIotStatus.stats.total}` : "0/0", 
              icon: <Wifi className="w-6 h-6" />, 
              trend: localIotStatus?.stats?.online > 0 ? "Systèmes actifs" : "Aucun IoT connecté", 
              color: localIotStatus?.stats?.online > 0 ? "from-green-500 to-emerald-500" : "from-red-500 to-pink-500",
              status: localIotStatus?.stats?.online > 0 ? "normal" : "error"
            },
            { 
              title: "Performance", 
              value: "98.5%", 
              icon: <Activity className="w-6 h-6" />, 
              trend: "+2.3%", 
              color: "from-purple-500 to-indigo-500",
              status: "normal"
            }
          ].map((kpi, index) => (
            <Card key={index} className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <p className={`text-sm mt-1 ${
                    kpi.status === 'normal' ? 'text-green-600' : 
                    kpi.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {kpi.trend}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${kpi.color} flex items-center justify-center text-white`}>
                  {kpi.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Section avancée des bassins d'aquaculture */}
        <Card className="p-6 bg-white shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🐟</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Bassins d'aquaculture</h3>
              <span className="ml-2 text-sm text-gray-500">
                {bassins?.length || 0} bassins actifs
                {localIotStatus && (
                  <span className="ml-2 text-xs">
                    ({bassins?.filter((b: any) => getBassinIoTStatus(b._id).connected).length || 0} connectés IoT)
                  </span>
                )}
              </span>
            </div>
            <input
              type="text"
              placeholder="Rechercher un bassin..."
              className="border rounded-lg px-3 py-2 w-full md:w-64"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>
          {bassinsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <span className="ml-2 text-gray-600">Chargement des bassins...</span>
            </div>
          ) : bassins && bassins.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {bassins.filter((b: any) => (b.nom || b.name || '').toLowerCase().includes(userSearch.toLowerCase())).map((bassin: any, index: number) => {
                // Calcul des stats et statut
                const bassinMesures = Array.isArray(mesures) ? mesures.filter((m: any) => (m.bassinId || m.bassin) === bassin._id) : [];
                const derniereMesure = bassinMesures.length > 0 ? bassinMesures.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
                const temperature = derniereMesure?.temperature ?? 'N/A';
                const ph = derniereMesure?.ph ?? 'N/A';
                const oxygen = derniereMesure?.oxygen ?? 'N/A';
                const salinity = derniereMesure?.salinity ?? 'N/A';
                const turbidity = derniereMesure?.turbidity ?? 'N/A';
                let status = 'normal', statusColor = 'bg-green-500', statusText = 'Normal', statusIcon = '✅';
                if (temperature !== 'N/A') {
                  const temp = parseFloat(temperature);
                  if (temp < 18 || temp > 30) {
                    status = 'warning'; statusColor = 'bg-yellow-500'; statusText = 'Température critique'; statusIcon = '⚠️';
                  }
                }
                if (ph !== 'N/A') {
                  const phValue = parseFloat(ph);
                  if (phValue < 6.5 || phValue > 8.5) {
                    status = 'error'; statusColor = 'bg-red-500'; statusText = 'pH critique'; statusIcon = '⛔';
                  }
                }
                const { connected, device } = getBassinIoTStatus(bassin._id);
                return (
                  <div key={`${bassin._id || index}-${forceUpdate}-${connected}`} className="relative group flex justify-center">
                    <div className={`relative rounded-2xl p-10 border-2 border-transparent hover:border-cyan-300 transition-all duration-500 ease-in-out hover:shadow-lg cursor-pointer flex flex-col h-full min-h-[340px] w-full max-w-xl overflow-hidden ${
                      connected ? 'bg-gradient-to-br from-blue-50 to-cyan-50' : 'bg-gradient-to-br from-gray-50 to-slate-100'
                    }`}>
                      {/* Badge statut - masqué si IoT offline */}
                      {connected && (
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${statusColor} animate-pulse`}></div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            status === 'normal' ? 'bg-green-100 text-green-800' :
                            status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {statusIcon} {statusText}
                          </span>
                        </div>
                      )}
                      
                      {/* Indicateur IoT */}
                      <div className="absolute top-6 left-6 flex items-center gap-2">
                        {connected ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium animate-pulse transition-all duration-300">
                            <Wifi className="w-3 h-3" />
                            <span>IoT Connecté</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium transition-all duration-300">
                            <WifiOff className="w-3 h-3" />
                            <span>IoT Offline</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Cercle principal plus grand */}
                      <div className="flex flex-col items-center mb-4">
                        {/* SVG cercle 2D pour bassin Aquafresh */}
                        <svg width="120" height="120" viewBox="0 0 120 120" className="mb-2">
                          {/* Berges du bassin */}
                          <circle cx="60" cy="60" r="56" fill="#bcdffb" stroke="#0ea5e9" strokeWidth="8" />
                          {/* Eau avec transition animée */}
                          <circle 
                            cx="60" 
                            cy="60" 
                            r="48" 
                            fill={connected ? "#38bdf8" : "#94a3b8"} 
                            fillOpacity="0.85"
                            className="transition-all duration-500 ease-in-out"
                          />
                          {/* Filet ou ponton central */}
                          <rect x="40" y="58" width="40" height="6" rx="3" fill="#e0e7ef" stroke="#64748b" strokeWidth="1.5" opacity="0.7" />
                          {/* Poisson stylisé */}
                          <ellipse cx="80" cy="70" rx="10" ry="4" fill="#fbbf24" />
                          <circle cx="88" cy="70" r="1.5" fill="#78350f" />
                          <path d="M92 70 Q98 67 92 73" stroke="#fbbf24" strokeWidth="2" fill="none" />
                          {/* Reflets d'eau */}
                          <ellipse cx="60" cy="50" rx="18" ry="3" fill="#fff" fillOpacity="0.10" />
                          <ellipse cx="70" cy="80" rx="10" ry="2" fill="#fff" fillOpacity="0.08" />
                        </svg>
                        <h4 className="font-bold text-gray-900 text-xl mb-1 truncate max-w-[200px]">
                          {bassin.nom || bassin.name || `Bassin ${index + 1}`}
                        </h4>
                        <span className="text-sm text-gray-500">{bassin.stade || 'En production'}</span>
                      </div>
                      {/* Paramètres */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2" title="Température de l'eau (18-30°C recommandé)"><span>🌡️</span><span className={`font-semibold ${temperature !== 'N/A' && parseFloat(temperature) > 25 ? 'text-red-600' : temperature !== 'N/A' && parseFloat(temperature) < 20 ? 'text-blue-600' : 'text-gray-900'}`}>{temperature !== 'N/A' ? `${temperature}°C` : 'N/A'}</span></div>
                        <div className="flex items-center gap-2" title="pH de l'eau (6.5-8.5 recommandé)"><span>🧪</span><span className={`font-semibold ${ph !== 'N/A' && parseFloat(ph) > 8 ? 'text-red-600' : ph !== 'N/A' && parseFloat(ph) < 7 ? 'text-blue-600' : 'text-gray-900'}`}>{ph !== 'N/A' ? ph : 'N/A'}</span></div>
                        <div className="flex items-center gap-2" title="Oxygène dissous (mg/L)"><span>💧</span><span className={`font-semibold ${oxygen !== 'N/A' && parseFloat(oxygen) < 5 ? 'text-red-600' : oxygen !== 'N/A' && parseFloat(oxygen) < 6 ? 'text-yellow-600' : 'text-gray-900'}`}>{oxygen !== 'N/A' ? `${oxygen} mg/L` : 'N/A'}</span></div>
                        <div className="flex items-center gap-2" title="Salinité (ppt)"><span>🧂</span><span className="font-semibold text-gray-900">{salinity !== 'N/A' ? salinity : 'N/A'}</span></div>
                        <div className="flex items-center gap-2" title="Turbidité (NTU)"><span>🌫️</span><span className="font-semibold text-gray-900">{turbidity !== 'N/A' ? turbidity : 'N/A'}</span></div>
                      </div>
                      {/* Dernière mesure */}
                      <div className="text-xs text-gray-500 mb-2">
                        Dernière mesure : {derniereMesure ? new Date(derniereMesure.date).toLocaleString() : 'Aucune'}
                        {!connected && <span className="text-red-600 ml-2">(IoT déconnecté)</span>}
                        {connected && device && (
                          <span className="text-green-600 ml-2 animate-pulse">
                            ✓ Dernière activité: {device.lastSeen ? formatTimeAgo(new Date(device.lastSeen)) : 'Maintenant'}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto w-full">
                        <div className="flex flex-row flex-nowrap gap-2 w-full justify-center items-center pt-4 border-t border-gray-200 bg-white/60 rounded-b-2xl">
                          <button 
                            onClick={() => openBassinDetails(bassin)}
                            className="flex-1 min-w-[90px] max-w-[140px] flex items-center justify-center gap-1 px-2 py-1 rounded bg-cyan-100 text-cyan-700 hover:bg-cyan-200 text-sm font-medium transition whitespace-nowrap"
                          >
                            <span>🔎</span> Détails
                          </button>
                          <button 
                            onClick={() => openBassinHistory(bassin)}
                            className="flex-1 min-w-[90px] max-w-[140px] flex items-center justify-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium transition whitespace-nowrap"
                          >
                            <span>📈</span> Historique
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🐟</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun bassin configuré</h4>
              <p className="text-gray-600 mb-4">Ajoutez votre premier bassin pour commencer le monitoring</p>
              <button
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm"
                onClick={() => setShowAddBassin(true)}
              >
                Ajouter un bassin
              </button>
            </div>
          )}
        </Card>

        {/* Table des 5 dernières mesures complètes */}
        <Card className="p-6 bg-white shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-cyan-600" />
              <h3 className="text-lg font-semibold text-gray-900">5 dernières mesures complètes</h3>
            </div>
            <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm" onClick={exportMesuresCSV}>Exporter CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Bassin</th>
                  <th className="p-2 text-left">Température</th>
                  <th className="p-2 text-left">pH</th>
                  <th className="p-2 text-left">Oxygène</th>
                  <th className="p-2 text-left">Salinité</th>
                  <th className="p-2 text-left">Turbidité</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const all = Array.isArray(mesures) ? mesures : [];
                  // Trie par date décroissante et prend les 5 dernières mesures
                  const last5 = all
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5);
                  return last5.map((m: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 whitespace-nowrap">{m.date || m.timestamp || m.createdAt ? new Date(m.date || m.timestamp || m.createdAt).toLocaleString() : '-'}</td>
                      <td className="p-2 whitespace-nowrap">{m.bassin || m.bassinId || '-'}</td>
                      <td className="p-2 whitespace-nowrap">{typeof m.temperature !== 'undefined' ? m.temperature : '-'}</td>
                      <td className="p-2 whitespace-nowrap">{typeof m.ph !== 'undefined' ? m.ph : '-'}</td>
                      <td className="p-2 whitespace-nowrap">{typeof m.oxygen !== 'undefined' ? m.oxygen : (typeof m.oxygene !== 'undefined' ? m.oxygene : '-')}</td>
                      <td className="p-2 whitespace-nowrap">{typeof m.salinity !== 'undefined' ? m.salinity : (typeof m.salinite !== 'undefined' ? m.salinite : '-')}</td>
                      <td className="p-2 whitespace-nowrap">{typeof m.turbidity !== 'undefined' ? m.turbidity : (typeof m.turbidite !== 'undefined' ? m.turbidite : '-')}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Gestion des utilisateurs (MongoDB)</h3>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Rechercher..." className="border rounded-lg px-3 py-2" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm" onClick={() => setShowAddUser(true)}><Plus className="w-4 h-4" /> Ajouter</button>
            </div>
          </div>
          {usersLoading && <div>Chargement...</div>}
          {usersError && <div className="text-red-600">Erreur de chargement</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Rôle</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user: any) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-2">
                      {editUserId === user._id ? (
                        <input className="border rounded px-2 py-1" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
                      ) : (
                        user.name || user.nom
                      )}
                    </td>
                    <td className="p-2">
                      {editUserId === user._id ? (
                        <input className="border rounded px-2 py-1" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="p-2">
                      {editUserId === user._id ? (
                        <select className="border rounded px-2 py-1" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                          <option value="admin">Administrateur</option>
                          <option value="operateur">Opérateur</option>
                          <option value="observateur">Observateur</option>
                        </select>
                      ) : (
                        user.role
                      )}
                    </td>
                    <td className="p-2 flex gap-2">
                      {editUserId === user._id ? (
                        <>
                          <button className="text-green-600" onClick={() => handleSaveUser(user._id)}>Enregistrer</button>
                          <button className="text-gray-500" onClick={() => setEditUserId(null)}>Annuler</button>
                        </>
                      ) : (
                        <>
                          <button className="text-blue-600" onClick={() => handleEditUser(user._id)}>Éditer</button>
                          <button className="text-red-600" onClick={() => handleDeleteUser(user._id)} disabled={deletingId === user._id}>{deletingId === user._id ? "Suppression..." : "Supprimer"}</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`px-3 py-1 rounded ${page === i + 1 ? "bg-cyan-600 text-white" : "bg-slate-100"}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          )}
        </Card>

        {showAddUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                onClick={() => setShowAddUser(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">Ajouter un utilisateur</h2>
              <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Nom"
                  className="border rounded-lg px-4 py-2"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="border rounded-lg px-4 py-2"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
                <select
                  className="border rounded-lg px-4 py-2"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="admin">Administrateur</option>
                  <option value="operateur">Opérateur</option>
                  <option value="observateur">Observateur</option>
                </select>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
                  disabled={adding}
                >
                  {adding ? "Ajout..." : "Ajouter"}
                </button>
              </form>
            </div>
          </div>
        )}

        <Card className="p-6 bg-white shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Alertes</h3>
            <select className="ml-auto border rounded px-2 py-1" value={alertFilter} onChange={e => setAlertFilter(e.target.value)}>
              <option value="">Toutes</option>
              <option value="error">Erreurs</option>
              <option value="warning">Avertissements</option>
              <option value="info">Informations</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredAlertes.slice(0, 10).map((alerte: any) => (
              <div key={alerte._id} className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${
                alerte.type === 'error' ? 'bg-red-50 border-red-500' :
                alerte.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{alerte.message}</div>
                  <div className="text-xs text-gray-500">{new Date(alerte.date).toLocaleString()}</div>
                </div>
                <button className="text-green-600" onClick={() => handleResolveAlerte(alerte._id)}>Résolue</button>
                <button className="text-red-600" onClick={async () => { await fetch(`/api/alertes/${alerte._id}`, { method: "DELETE" }); mutate("/api/alertes"); setToast({ type: "success", message: "Alerte supprimée" }); }}>Supprimer</button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-cyan-600" />
            <h3 className="text-lg font-semibold text-gray-900">Mesures</h3>
            <button className="ml-auto bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm" onClick={exportMesuresCSV}>Exporter CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Paramètre</th>
                  <th className="p-2 text-left">Valeur</th>
                  <th className="p-2 text-left">Bassin</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (!mesures || !Array.isArray(mesures)) return null;
                  // Trie par date décroissante
                  const sorted = [...mesures].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  // Regroupe par paramètre
                  const byParam: { [key: string]: any[] } = {};
                  for (const m of sorted) {
                    // Déduire le paramètre
                    let param = m.param;
                    if (!param) {
                      if (typeof m.temperature !== 'undefined') param = 'Température';
                      else if (typeof m.ph !== 'undefined') param = 'pH';
                      else if (typeof m.oxygene !== 'undefined') param = 'Oxygène';
                      else if (typeof m.salinite !== 'undefined') param = 'Salinité';
                      else if (typeof m.turbidite !== 'undefined') param = 'Turbidité';
                      else param = '-';
                    }
                    if (!byParam[param]) byParam[param] = [];
                    if (byParam[param].length < 10) byParam[param].push(m);
                  }
                  // Affiche chaque groupe
                  return Object.entries(byParam).map(([param, mesuresArr]) =>
                    mesuresArr.map((m, i) => {
                      // Déduire la valeur
                      let value = m.value;
                      if (typeof value === 'undefined') {
                        if (typeof m.temperature !== 'undefined') value = m.temperature;
                        else if (typeof m.ph !== 'undefined') value = m.ph;
                        else if (typeof m.oxygene !== 'undefined') value = m.oxygene;
                        else if (typeof m.salinite !== 'undefined') value = m.salinite;
                        else if (typeof m.turbidite !== 'undefined') value = m.turbidite;
                        else value = '-';
                      }
                      // Trouver le nom du bassin
                      let bassinNom = '-';
                      const bassinId = m.bassinId || m.bassin;
                      if (bassinId && bassins && Array.isArray(bassins)) {
                        const found = bassins.find((b: any) => b._id === bassinId || b.nom === bassinId || b.name === bassinId);
                        if (found) bassinNom = found.nom || found.name || found._id;
                        else bassinNom = bassinId;
                      }
                      return (
                        <tr key={param + '-' + i} className="border-b">
                          <td className="p-2">{new Date(m.date).toLocaleString()}</td>
                          <td className="p-2">{param}</td>
                          <td className="p-2">{value}</td>
                          <td className="p-2">{bassinNom}</td>
                        </tr>
                      );
                    })
                  );
                })()}
              </tbody>
            </table>
          </div>
        </Card>

        {showAddBassin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                onClick={() => setShowAddBassin(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">Ajouter un bassin</h2>
              <form onSubmit={handleAddBassin} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Nom du bassin"
                  className="border rounded-lg px-4 py-2"
                  value={newBassin.nom}
                  onChange={e => setNewBassin({ ...newBassin, nom: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Stade du bassin"
                  className="border rounded-lg px-4 py-2"
                  value={newBassin.stade}
                  onChange={e => setNewBassin({ ...newBassin, stade: e.target.value })}
                  required
                />
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm"
                  disabled={addingBassin}
                >
                  {addingBassin ? "Ajout en cours..." : "Ajouter"}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Évolution de la température</h3>
              <select
                className="ml-auto border rounded px-2 py-1"
                value={selectedBassinChart}
                onChange={e => setSelectedBassinChart(e.target.value)}
              >
                {bassinOptions.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
            </div>
            <div className="mb-2 text-sm text-gray-500">
              Bassin sélectionné : <span className="font-semibold text-cyan-700">{bassinOptions.find((b: any) => b.id === selectedBassinChart)?.nom || '-'}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit="°C" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des alertes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertesParType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {alertesParType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {alertesParType.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières mesures</h3>
            <div className="space-y-3">
              {derniereMesures.map((mesure: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      {mesure.param === "Température" && "🌡️"}
                      {mesure.param === "pH" && "🧪"}
                      {mesure.param === "Oxygène dissous" && "💧"}
                      {mesure.param === "Salinité" && "🧂"}
                      {mesure.param === "Turbidité" && "🌫️"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mesure.param}</p>
                      <p className="text-sm text-gray-500">{new Date(mesure.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{mesure.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes récentes</h3>
            <div className="space-y-3">
              {alertesArray.slice(0, 5).map((alerte: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alerte.type === 'error' ? 'bg-red-50 border-red-500' :
                  alerte.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alerte.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(alerte.date).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alerte.type === 'error' ? 'bg-red-100 text-red-800' :
                      alerte.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alerte.type || 'info'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Modal Détails du Bassin */}
      {showBassinDetails && selectedBassinForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setShowBassinDetails(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Détails du Bassin: {selectedBassinForModal.nom || selectedBassinForModal.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informations générales</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span className="font-medium">{selectedBassinForModal.nom || selectedBassinForModal.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stade:</span>
                    <span className="font-medium">{selectedBassinForModal.stade || 'Non défini'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-sm">{selectedBassinForModal._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut IoT:</span>
                    <span className={`font-medium ${getBassinIoTStatus(selectedBassinForModal._id).connected ? 'text-green-600' : 'text-red-600'}`}>
                      {getBassinIoTStatus(selectedBassinForModal._id).connected ? 'Connecté' : 'Déconnecté'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dernière mesure */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dernière mesure</h3>
                {(() => {
                  const bassinMesures = Array.isArray(mesures) ? mesures.filter((m: any) => (m.bassinId || m.bassin) === selectedBassinForModal._id) : [];
                  const derniereMesure = bassinMesures.length > 0 ? bassinMesures.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
                  
                  if (!derniereMesure) {
                    return <p className="text-gray-500">Aucune mesure disponible</p>;
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date(derniereMesure.date).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Température:</span>
                        <span className="font-medium">{derniereMesure.temperature || 'N/A'}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">pH:</span>
                        <span className="font-medium">{derniereMesure.ph || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Oxygène:</span>
                        <span className="font-medium">{derniereMesure.oxygen || 'N/A'} mg/L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salinité:</span>
                        <span className="font-medium">{derniereMesure.salinity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Turbidité:</span>
                        <span className="font-medium">{derniereMesure.turbidity || 'N/A'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Statistiques */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Statistiques</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const bassinMesures = Array.isArray(mesures) ? mesures.filter((m: any) => (m.bassinId || m.bassin) === selectedBassinForModal._id) : [];
                  const temperatures = bassinMesures.filter((m: any) => m.temperature).map((m: any) => parseFloat(m.temperature));
                  const phs = bassinMesures.filter((m: any) => m.ph).map((m: any) => parseFloat(m.ph));
                  const oxygens = bassinMesures.filter((m: any) => m.oxygen).map((m: any) => parseFloat(m.oxygen));
                  
                  return (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{bassinMesures.length}</div>
                        <div className="text-sm text-gray-600">Mesures totales</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {temperatures.length > 0 ? (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Temp. moyenne</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {phs.length > 0 ? (phs.reduce((a, b) => a + b, 0) / phs.length).toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">pH moyen</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {oxygens.length > 0 ? (oxygens.reduce((a, b) => a + b, 0) / oxygens.length).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Oxygène moyen</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique du Bassin */}
      {showBassinHistory && selectedBassinForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-6xl h-[90vh] flex flex-col relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setShowBassinHistory(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Historique du Bassin: {selectedBassinForModal.nom || selectedBassinForModal.name}
            </h2>
            
            {(() => {
              const bassinMesures = Array.isArray(mesures) ? mesures.filter((m: any) => (m.bassinId || m.bassin) === selectedBassinForModal._id) : [];
              const mesuresTriees = bassinMesures.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              if (mesuresTriees.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun historique disponible</h4>
                    <p className="text-gray-600">Aucune mesure n'a été enregistrée pour ce bassin</p>
                  </div>
                );
              }

              // Calcul de la pagination
              const totalPages = Math.ceil(mesuresTriees.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentMesures = mesuresTriees.slice(startIndex, endIndex);

              // Configuration des paramètres de graphique
              const graphConfig = {
                temperature: { 
                  label: 'Température', 
                  unit: '°C', 
                  color: '#06b6d4',
                  icon: '🌡️',
                  dataKey: 'temperature'
                },
                ph: { 
                  label: 'pH', 
                  unit: '', 
                  color: '#8b5cf6',
                  icon: '🧪',
                  dataKey: 'ph'
                },
                oxygen: { 
                  label: 'Oxygène', 
                  unit: ' mg/L', 
                  color: '#10b981',
                  icon: '💧',
                  dataKey: 'oxygen'
                },
                salinity: { 
                  label: 'Salinité', 
                  unit: ' ppt', 
                  color: '#f59e0b',
                  icon: '🧂',
                  dataKey: 'salinity'
                },
                turbidity: { 
                  label: 'Turbidité', 
                  unit: ' NTU', 
                  color: '#ef4444',
                  icon: '🌫️',
                  dataKey: 'turbidity'
                }
              };

              const currentConfig = graphConfig[selectedGraphParam as keyof typeof graphConfig];

              return (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Graphique avec filtre */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Évolution du paramètre
                      </h3>
                      <select
                        value={selectedGraphParam}
                        onChange={(e) => setSelectedGraphParam(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      >
                        <option value="temperature">🌡️ Température</option>
                        <option value="ph">🧪 pH</option>
                        <option value="oxygen">💧 Oxygène</option>
                        <option value="salinity">🧂 Salinité</option>
                        <option value="turbidity">🌫️ Turbidité</option>
                      </select>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={mesuresTriees.slice(0, 50).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          unit={currentConfig.unit}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                          formatter={(value: any) => [`${value}${currentConfig.unit}`, currentConfig.label]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={currentConfig.dataKey} 
                          stroke={currentConfig.color} 
                          strokeWidth={3}
                          dot={{ fill: currentConfig.color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: currentConfig.color, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tableau des mesures avec pagination */}
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Mesures ({mesuresTriees.length} total)</h3>
                      <div className="text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Température</th>
                            <th className="p-3 text-left">pH</th>
                            <th className="p-3 text-left">Oxygène</th>
                            <th className="p-3 text-left">Salinité</th>
                            <th className="p-3 text-left">Turbidité</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentMesures.map((mesure: any, index: number) => (
                            <tr key={startIndex + index} className="border-b hover:bg-gray-50">
                              <td className="p-3 whitespace-nowrap">
                                {new Date(mesure.date).toLocaleString()}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {mesure.temperature ? `${mesure.temperature}°C` : '-'}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {mesure.ph || '-'}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {mesure.oxygen ? `${mesure.oxygen} mg/L` : '-'}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {mesure.salinity || '-'}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {mesure.turbidity || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Affichage de {startIndex + 1} à {Math.min(endIndex, mesuresTriees.length)} sur {mesuresTriees.length} mesures
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Précédent
                          </button>
                          
                          {/* Numéros de page */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-3 py-1 text-sm rounded-lg ${
                                    currentPage === pageNum
                                      ? 'bg-cyan-600 text-white'
                                      : 'border hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Suivant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
} 