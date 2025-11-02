"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { RefreshCw, Wifi, Zap, Settings, AlertTriangle, CheckCircle, Plus, X, Monitor, Smartphone } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import dynamic from 'next/dynamic';

const QrReader = dynamic(() => import('react-qr-reader').then(mod => mod.QrReader), { ssr: false });

// Exemple de mock, à remplacer par un fetch sur /api/iot si disponible
const mockDevices = [
  { id: 1, name: "Capteur Température Bassin 1", type: "capteur", status: "online", value: "22.4°C", lastUpdate: new Date(), icon: <Wifi className="w-5 h-5" /> },
  { id: 2, name: "Pompe Oxygène Bassin 2", type: "actionneur", status: "offline", value: "Arrêtée", lastUpdate: new Date(), icon: <Zap className="w-5 h-5" /> },
  { id: 3, name: "Capteur pH Bassin 3", type: "capteur", status: "online", value: "7.2", lastUpdate: new Date(), icon: <Wifi className="w-5 h-5" /> },
  { id: 4, name: "Électrovanne Bassin 1", type: "actionneur", status: "online", value: "Ouverte", lastUpdate: new Date(), icon: <Settings className="w-5 h-5" /> },
];

export default function IotPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nom, setNom] = useState("");
  const [type, setType] = useState("sensor");
  const [bassinId, setBassinId] = useState("");
  const [status, setStatus] = useState("online");
  const [adding, setAdding] = useState(false);
  const [bassins, setBassins] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string|null>(null);
  const [mesures, setMesures] = useState<any[]>([]);
  const [mac, setMac] = useState("");
  const [showEdit, setShowEdit] = useState<any | null>(null);
  const [editDevice, setEditDevice] = useState<any>({ _id: "", nom: "", type: "sensor", mac: "", bassinId: "", status: "online" });
  const [editing, setEditing] = useState(false);
  const [showQrScan, setShowQrScan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Charger les bassins pour le dropdown
  useEffect(() => {
    fetch("/api/bassins").then(res => res.json()).then(setBassins);
  }, []);

  // Charger les devices IoT réels
  async function loadDevices() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/iot/devices");
      if (!res.ok) throw new Error("Erreur lors du chargement des devices");
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des IoT");
    } finally {
      setLoading(false);
    }
  }

  // Charger les statuts en temps réel
  async function loadStatus() {
    try {
      const res = await fetch("/api/iot/status");
      if (!res.ok) throw new Error("Erreur lors du chargement des statuts");
      const data = await res.json();
      
      // Mettre à jour les devices avec les statuts
      setDevices(prevDevices => {
        return prevDevices.map(device => {
          const statusDevice = data.devices.find((d: any) => d._id === device._id);
          return statusDevice ? { ...device, ...statusDevice } : device;
        });
      });
      
      // Afficher les statistiques
      if (data.stats) {
        console.log("📊 Statistiques IoT:", data.stats);
      }
    } catch (err) {
      console.error("Erreur chargement statuts:", err);
    }
  }

  // Rafraîchir les devices
  async function refreshDevices() {
    setRefreshing(true);
    try {
      await loadDevices();
      await loadStatus();
      setFeedback("Devices mis à jour");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback("Erreur lors du rafraîchissement");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { 
    loadDevices(); 
    loadStatus();
  }, []);

  // Rafraîchissement automatique des statuts
  useEffect(() => {
    const statusInterval = setInterval(loadStatus, 10000); // Toutes les 10 secondes
    return () => clearInterval(statusInterval);
  }, []);

  // Connexion WebSocket pour mesures temps réel et notifications IoT
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_IOT_WS_TOKEN || 'TON_TOKEN_SECRET';
    // Utiliser l'URL WebSocket depuis les variables d'environnement ou localhost par défaut
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? 
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:4001` : 
      'ws://localhost:4001');
    const ws = new WebSocket(`${wsBaseUrl}/?token=${token}&type=web`);
    
    ws.onopen = () => {
      console.log("🔌 WebSocket connecté pour IoT monitoring");
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
      const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'iot_status_snapshot':
            // Réception des statuts initiaux
            console.log("📊 Snapshot des statuts IoT reçu:", data.data);
            if (data.data.devices) {
              setDevices(prevDevices => {
                return prevDevices.map(device => {
                  const statusDevice = data.data.devices.find((d: any) => d._id === device._id);
                  return statusDevice ? { ...device, ...statusDevice } : device;
                });
              });
            }
            break;
            
          case 'iot_status_update':
            // Notification de changement de statut
            console.log("📱 Mise à jour statut IoT:", data.event, data.data);
            
            if (data.event === 'iot_status_changed') {
              setDevices(prevDevices => {
                return prevDevices.map(device => {
                  if (device.mac === data.data.mac) {
                    return {
                      ...device,
                      status: data.data.status,
                      lastSeen: data.data.lastSeen
                    };
                  }
                  return device;
                });
              });
              
              // Mettre à jour la timestamp de dernière mise à jour
              setLastUpdate(new Date());
              
              // Afficher une notification
              const statusText = data.data.status === 'online' ? 'en ligne' : 'hors ligne';
              setFeedback(`Device ${data.data.mac} est maintenant ${statusText}`);
              setTimeout(() => setFeedback(null), 3000);
            }
            break;
            
          case 'mesure':
            // Mesures temps réel
        setMesures(prev => [...prev.slice(-49), data]); // max 50 points
            break;
            
          default:
            console.log("📨 Message WebSocket reçu:", data.type);
        }
      } catch (err) {
        console.error("Erreur parsing WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("Erreur WebSocket:", error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket déconnecté");
      setWsConnected(false);
    };

    return () => { ws.close(); };
  }, []);

  // Ajout d'un IoT
  async function handleAddIot(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/iot/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, type, mac, bassinId, status })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout");
      }
      
      setShowAdd(false);
      setNom(""); 
      setType("sensor"); 
      setMac(""); 
      setBassinId(""); 
      setStatus("online");
      setFeedback("IoT ajouté avec succès");
      loadDevices();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  }

  // Edition d'un IoT
  function openEditDevice(device: any) {
    setEditDevice({ ...device });
    setShowEdit(device._id);
  }

  async function handleEditDevice(e: React.FormEvent) {
    e.preventDefault();
    setEditing(true);
    try {
      const res = await fetch(`/api/iot/devices/${editDevice._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nom: editDevice.nom, 
          type: editDevice.type, 
          mac: editDevice.mac, 
          bassinId: editDevice.bassinId, 
          status: editDevice.status 
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la modification");
      }
      
      setShowEdit(null);
      setFeedback("IoT modifié avec succès");
      loadDevices();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setEditing(false);
    }
  }

  // Supprimer un IoT
  async function handleDeleteDevice(deviceId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet appareil ?")) return;
    
    try {
      const res = await fetch(`/api/iot/devices/${deviceId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }
      
      setFeedback("IoT supprimé avec succès");
      loadDevices();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  }

  // Filtrer les devices non associés
  const unassignedDevices = devices.filter(d => !d.bassinId);
  
  // Helper pour vérifier si un device est récemment vu
  function isRecentlySeen(device: any) {
    if (!device.lastSeen) return false;
    const timeDiff = Date.now() - new Date(device.lastSeen).getTime();
    return timeDiff < 2 * 60 * 1000; // 2 minutes
  }

  // Helper pour formater le temps écoulé
  function getTimeAgo(lastSeen: string) {
    const timeDiff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Maintenant';
  }

  // Helper pour obtenir l'icône selon le type
  function getDeviceIcon(type: string) {
    switch (type) {
      case 'sensor': return <Wifi className="w-5 h-5" />;
      case 'actuator': return <Settings className="w-5 h-5" />;
      case 'controller': return <Monitor className="w-5 h-5" />;
      default: return <Smartphone className="w-5 h-5" />;
    }
  }

  // Helper pour obtenir le statut en français
  function getStatusText(status: string) {
    switch (status) {
      case 'online': return 'En ligne';
      case 'offline': return 'Hors ligne';
      case 'error': return 'Erreur';
      default: return status;
    }
  }

  // Helper pour obtenir la classe CSS du statut avec animation
  function getStatusClass(status: string) {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-700 animate-pulse';
      case 'offline': return 'bg-red-100 text-red-700';
      case 'error': return 'bg-orange-100 text-orange-700 animate-pulse';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  // Helper pour obtenir l'icône de statut
  function getStatusIcon(status: string) {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'offline': return <X className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyan-800 mb-2">Gestion des objets connectés (IoT)</h1>
            <p className="text-gray-600">Surveillez et contrôlez vos capteurs et actionneurs en temps réel.</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm" 
              onClick={refreshDevices}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> 
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
            <button 
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm" 
              onClick={() => setShowAdd(true)}
            >
            <Plus className="w-4 h-4" /> Ajouter un IoT
          </button>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 bg-cyan-100 text-cyan-800 px-4 py-2 rounded shadow inline-block">{feedback}</div>
        )}

        {loading && <div className="text-center py-8">Chargement des objets connectés...</div>}
        
        {error && <div className="text-red-600 bg-red-100 p-4 rounded mb-4">Erreur : {error}</div>}

        {/* Section MAC non associées */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-cyan-700">MAC non associées détectées</h2>
            <button 
              className="ml-2 px-3 py-1 text-xs bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200" 
              onClick={loadDevices}
            >
              Détecter
            </button>
          </div>
          
          {unassignedDevices.length === 0 ? (
            <div className="text-gray-400 text-sm bg-white p-4 rounded border">Aucune MAC non associée détectée.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedDevices.map(device => (
                <div key={device.mac} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm">{device.mac}</span>
                    <div className="flex gap-1">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Nouveau</span>
                      {isRecentlySeen(device) && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Vu récemment</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QRCodeCanvas value={device.mac} size={40} />
                      <div className="text-xs text-gray-500">
                        {device.ipAddress && <div>IP: {device.ipAddress}</div>}
                        {device.lastSeen && (
                          <div>Vu: {new Date(device.lastSeen).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      className="px-3 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700" 
                      onClick={() => { setShowAdd(true); setMac(device.mac); }}
                    >
                      Associer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grille des devices IoT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.map(device => (
            <Card key={device._id} className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                {getDeviceIcon(device.type)}
                <span className="font-semibold text-cyan-700 flex-1">{device.nom}</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(device.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(device.status)}`}>
                    {getStatusText(device.status)}
                </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{device.type}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Bassin:</span>
                  <span className="font-medium">
                    {bassins.find(b => b._id === device.bassinId)?.nom || device.bassinId || "-"}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>MAC:</span>
                  <span className="font-mono text-xs">{device.mac || "-"}</span>
                </div>
                
                {device.ipAddress && (
                  <div className="flex justify-between">
                    <span>IP:</span>
                    <span className="font-mono text-xs">{device.ipAddress}</span>
                  </div>
                )}
                
                {device.lastSeen && (
                  <div className="flex justify-between">
                    <span>Dernière vue:</span>
                    <span className={`text-xs ${isRecentlySeen(device) ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {new Date(device.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
                {/* Indicateur de temps écoulé */}
                {device.lastSeen && (
                  <div className="flex justify-between">
                    <span>Temps écoulé:</span>
                    <span className={`text-xs ${isRecentlySeen(device) ? 'text-green-600' : 'text-red-600'}`}>
                      {getTimeAgo(device.lastSeen)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <button 
                  className="flex-1 text-cyan-600 hover:underline text-xs" 
                  onClick={() => openEditDevice(device)}
                >
                  Modifier
                </button>
                <button 
                  className="flex-1 text-red-600 hover:underline text-xs" 
                  onClick={() => handleDeleteDevice(device._id)}
                >
                  Supprimer
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal ajout IoT */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" 
                onClick={() => setShowAdd(false)}
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-4">Ajouter un IoT</h2>
              
              <form onSubmit={handleAddIot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du device</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Capteur Température Bassin 1" 
                    className="w-full border rounded-lg px-4 py-2" 
                    value={nom} 
                    onChange={e => setNom(e.target.value)} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    className="w-full border rounded-lg px-4 py-2" 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="sensor">Capteur</option>
                    <option value="actuator">Actionneur</option>
                    <option value="controller">Contrôleur</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse MAC</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="A4:CF:12:34:56:78" 
                      className="flex-1 border rounded-lg px-4 py-2 font-mono" 
                      value={mac} 
                      onChange={e => setMac(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      className="bg-cyan-100 text-cyan-700 px-3 py-2 rounded text-sm hover:bg-cyan-200" 
                      onClick={() => setShowQrScan(true)}
                    >
                      QR
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bassin associé</label>
                  <select 
                    className="w-full border rounded-lg px-4 py-2" 
                    value={bassinId} 
                    onChange={e => setBassinId(e.target.value)}
                  >
                    <option value="">Aucun bassin</option>
                    {bassins.map(bassin => (
                      <option key={bassin._id} value={bassin._id}>
                        {bassin.nom}
                      </option>
                    ))}
                </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400" 
                    onClick={() => setShowAdd(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50" 
                    disabled={adding}
                  >
                    {adding ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal édition IoT */}
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" 
                onClick={() => setShowEdit(null)}
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-4">Modifier l'IoT</h2>
              
              <form onSubmit={handleEditDevice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du device</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-4 py-2" 
                    value={editDevice.nom} 
                    onChange={e => setEditDevice({...editDevice, nom: e.target.value})} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    className="w-full border rounded-lg px-4 py-2" 
                    value={editDevice.type} 
                    onChange={e => setEditDevice({...editDevice, type: e.target.value})}
                  >
                    <option value="sensor">Capteur</option>
                    <option value="actuator">Actionneur</option>
                    <option value="controller">Contrôleur</option>
                </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse MAC</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-4 py-2 font-mono" 
                    value={editDevice.mac} 
                    onChange={e => setEditDevice({...editDevice, mac: e.target.value})} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bassin associé</label>
                  <select 
                    className="w-full border rounded-lg px-4 py-2" 
                    value={editDevice.bassinId || ""} 
                    onChange={e => setEditDevice({...editDevice, bassinId: e.target.value})}
                  >
                    <option value="">Aucun bassin</option>
                    {bassins.map(bassin => (
                      <option key={bassin._id} value={bassin._id}>
                        {bassin.nom}
                      </option>
                    ))}
                </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select 
                    className="w-full border rounded-lg px-4 py-2" 
                    value={editDevice.status} 
                    onChange={e => setEditDevice({...editDevice, status: e.target.value})}
                  >
                  <option value="online">En ligne</option>
                  <option value="offline">Hors ligne</option>
                    <option value="error">Erreur</option>
                </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400" 
                    onClick={() => setShowEdit(null)}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50" 
                    disabled={editing}
                  >
                    {editing ? 'Modification...' : 'Modifier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal QR Scanner */}
        {showQrScan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" 
                onClick={() => setShowQrScan(false)}
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-4">Scanner QR Code</h2>
              
              <div className="mb-4">
                <QrReader
                  onResult={(result: any, error: any) => {
                    if (error) {
                      console.error(error);
                      setFeedback("Erreur lors du scan QR");
                    }
                    if (result) {
                      const data = result.getText ? result.getText() : result.text;
                      setMac(data);
                      setShowQrScan(false);
                      setFeedback("MAC scannée avec succès");
                    }
                  }}
                  constraints={{ facingMode: 'environment' }}
                />
            </div>
              
              <button 
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400" 
                onClick={() => setShowQrScan(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 