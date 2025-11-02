"use client";

import { Card } from "@/components/ui";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";
import { Eye, BarChart3, TrendingUp, Calendar, Download, Filter, RefreshCw, Activity, AlertTriangle, Database, Clock, Target, Zap } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ObservateurDashboard() {
  const { data: mesures, isLoading: mesuresLoading, mutate: refreshMesures } = useSWR("/api/mesures", fetcher);
  const { data: alertes, isLoading: alertesLoading, mutate: refreshAlertes } = useSWR("/api/alertes", fetcher);
  const { data: bassins, isLoading: bassinsLoading } = useSWR("/api/bassins", fetcher);
  const { data: iotStatus, isLoading: iotLoading } = useSWR("/api/iot/status", fetcher);
  
  const [selectedBassin, setSelectedBassin] = useState("all");
  const [periode, setPeriode] = useState("24h");
  const [selectedParam, setSelectedParam] = useState("temperature");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshMesures();
      refreshAlertes();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshMesures, refreshAlertes]);

  // Données pour les graphiques
  const getChartData = (param: string) => {
    // S'assurer que mesures est un tableau
    const mesuresArray = Array.isArray(mesures) ? mesures : [];
    
    const filteredMesures = mesuresArray
      .filter((item: any) => {
        const paramMatch = param === 'temperature' ? item.temperature !== undefined :
                          param === 'ph' ? item.ph !== undefined :
                          param === 'oxygen' ? item.oxygen !== undefined :
                          param === 'salinity' ? item.salinity !== undefined :
                          param === 'turbidity' ? item.turbidity !== undefined : false;
        
        const bassinMatch = selectedBassin === "all" || 
                           (item.bassinId || item.bassin) === selectedBassin;
        
        return paramMatch && bassinMatch;
      })
      .slice(-20)
      .map((item: any) => ({
        date: new Date(item.date).toLocaleTimeString(),
        value: parseFloat(item[param] || "0"),
        bassin: item.bassinId || item.bassin || 'Inconnu'
      }));

    return filteredMesures;
  };

  const chartData = getChartData(selectedParam);

  // S'assurer que alertes et mesures sont des tableaux
  const alertesArray = Array.isArray(alertes) ? alertes : [];
  const mesuresArray = Array.isArray(mesures) ? mesures : [];
  const bassinsArray = Array.isArray(bassins) ? bassins : [];

  const alertesParType = [
    { name: "Avertissements", value: alertesArray.filter((a: any) => a.type === "warning").length, color: "#f59e0b" },
    { name: "Erreurs", value: alertesArray.filter((a: any) => a.type === "error").length, color: "#ef4444" },
    { name: "Info", value: alertesArray.filter((a: any) => !a.type || a.type === "info").length, color: "#3b82f6" },
  ];

  const derniereMesures = mesuresArray.slice(0, 8);

  // Statistiques avancées pour l'observateur
  const stats = {
    totalMesures: mesuresArray.length,
    alertesJour: alertesArray.filter((a: any) => {
      const alerteDate = new Date(a.date);
      const now = new Date();
      return (now.getTime() - alerteDate.getTime()) < 24 * 60 * 60 * 1000;
    }).length,
    moyenneTemperature: (() => {
      const tempMesures = mesuresArray.filter((m: any) => m.temperature !== undefined);
      if (tempMesures.length === 0) return 0;
      return tempMesures.reduce((acc: number, m: any) => acc + parseFloat(m.temperature || "0"), 0) / tempMesures.length;
    })(),
    iotConnectes: iotStatus?.stats?.online || 0,
    totalIoT: iotStatus?.stats?.total || 0,
    qualiteDonnees: "98.7%",
    tendance: "+2.1%"
  };

  const getParamDisplayName = (param: string) => {
    const names = {
      temperature: 'Température',
      ph: 'pH',
      oxygen: 'Oxygène',
      salinity: 'Salinité',
      turbidity: 'Turbidité'
    };
    return names[param as keyof typeof names] || param;
  };

  const getParamUnit = (param: string) => {
    const units = {
      temperature: '°C',
      ph: '',
      oxygen: ' mg/L',
      salinity: ' ppt',
      turbidity: ' NTU'
    };
    return units[param as keyof typeof units] || '';
  };

  const getParamIcon = (param: string) => {
    const icons = {
      temperature: '🌡️',
      ph: '🧪',
      oxygen: '💧',
      salinity: '🧂',
      turbidity: '🌫️'
    };
    return icons[param as keyof typeof icons] || '📊';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6">
        {/* KPIs Cards - Focus sur l'observation avancée */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: "Mesures totales", 
              value: stats.totalMesures.toString(), 
              icon: <Database className="w-6 h-6" />, 
              trend: "Cette période", 
              color: "from-blue-500 to-cyan-500",
              status: "normal"
            },
            { 
              title: "Alertes (24h)", 
              value: stats.alertesJour.toString(), 
              icon: <AlertTriangle className="w-6 h-6" />, 
              trend: "Surveillance active", 
              color: "from-orange-500 to-red-500",
              status: "normal"
            },
            { 
              title: "IoT Connectés", 
              value: `${stats.iotConnectes}/${stats.totalIoT}`, 
              icon: <Zap className="w-6 h-6" />, 
              trend: stats.iotConnectes > 0 ? "Systèmes actifs" : "Aucun IoT", 
              color: stats.iotConnectes > 0 ? "from-green-500 to-emerald-500" : "from-red-500 to-pink-500",
              status: stats.iotConnectes > 0 ? "normal" : "error"
            },
            { 
              title: "Qualité données", 
              value: stats.qualiteDonnees, 
              icon: <Target className="w-6 h-6" />, 
              trend: "Excellente", 
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

        {/* Section d'analyse et rapports améliorée */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Filtres et options avancées */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtres d'analyse</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paramètre principal</label>
                <select 
                  value={selectedParam}
                  onChange={(e) => setSelectedParam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="temperature">🌡️ Température</option>
                  <option value="ph">🧪 pH</option>
                  <option value="oxygen">💧 Oxygène</option>
                  <option value="salinity">🧂 Salinité</option>
                  <option value="turbidity">🌫️ Turbidité</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'alerte</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                  <option>Toutes les alertes</option>
                  <option>Erreurs critiques</option>
                  <option>Avertissements</option>
                  <option>Informations</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Période d'analyse</label>
                <select 
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="24h">Dernières 24h</option>
                  <option value="7j">7 derniers jours</option>
                  <option value="30j">30 derniers jours</option>
                  <option value="90j">90 derniers jours</option>
                </select>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Appliquer les filtres
              </button>
            </div>
          </Card>

          {/* Rapports disponibles améliorés */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Rapports disponibles</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-800">Rapport quotidien</p>
                    <p className="text-sm text-blue-600">Données du jour</p>
                  </div>
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
              </button>
              <button className="w-full p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Rapport hebdomadaire</p>
                    <p className="text-sm text-green-600">Analyse sur 7 jours</p>
                  </div>
                  <Download className="w-4 h-4 text-green-600" />
                </div>
              </button>
              <button className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-purple-800">Rapport mensuel</p>
                    <p className="text-sm text-purple-600">Tendances mensuelles</p>
                  </div>
                  <Download className="w-4 h-4 text-purple-600" />
                </div>
              </button>
              <button className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-orange-800">Rapport d'alertes</p>
                    <p className="text-sm text-orange-600">Analyse des incidents</p>
                  </div>
                  <Download className="w-4 h-4 text-orange-600" />
                </div>
              </button>
            </div>
          </Card>

          {/* Calendrier d'événements et statut IoT */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Statut système</h3>
            </div>
            <div className="space-y-3">
              {/* Statut IoT */}
              <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-800">IoT Connectés</p>
                    <p className="text-sm text-blue-600">{stats.iotConnectes}/{stats.totalIoT} actifs</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${stats.iotConnectes > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                </div>
              </div>
              
              {/* Dernière alerte */}
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="font-medium text-red-800">Alerte pH critique</p>
                <p className="text-sm text-red-600">Il y a 2 heures</p>
              </div>
              
              {/* Maintenance prévue */}
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                <p className="font-medium text-yellow-800">Maintenance prévue</p>
                <p className="text-sm text-yellow-600">Demain 10:00</p>
              </div>
              
              {/* Contrôle qualité */}
              <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <p className="font-medium text-green-800">Contrôle qualité</p>
                <p className="text-sm text-green-600">Dans 3 jours</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section améliorée */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Graphique principal avec sélecteur de paramètre */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Évolution {getParamDisplayName(selectedParam)}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{getParamIcon(selectedParam)}</span>
                <span>{getParamUnit(selectedParam)}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit={getParamUnit(selectedParam)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [`${value}${getParamUnit(selectedParam)}`, getParamDisplayName(selectedParam)]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06b6d4" 
                  fill="#06b6d4"
                  fillOpacity={0.3}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Alerts Distribution améliorée */}
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

        {/* Recent Data & Alerts améliorés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Measurements amélioré */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dernières mesures</h3>
              <span className="text-sm text-gray-500">{derniereMesures.length} mesures</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {derniereMesures.map((mesure: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      {mesure.temperature !== undefined && "🌡️"}
                      {mesure.ph !== undefined && "🧪"}
                      {mesure.oxygen !== undefined && "💧"}
                      {mesure.salinity !== undefined && "🧂"}
                      {mesure.turbidity !== undefined && "🌫️"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {mesure.bassinId || mesure.bassin || 'Bassin inconnu'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(mesure.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {mesure.temperature !== undefined && (
                      <span className="block text-sm font-semibold text-gray-900">
                        {mesure.temperature}°C
                      </span>
                    )}
                    {mesure.ph !== undefined && (
                      <span className="block text-sm font-semibold text-gray-900">
                        pH {mesure.ph}
                      </span>
                    )}
                    {mesure.oxygen !== undefined && (
                      <span className="block text-sm font-semibold text-gray-900">
                        {mesure.oxygen} mg/L
                      </span>
                    )}
                    {mesure.salinity !== undefined && (
                      <span className="block text-sm font-semibold text-gray-900">
                        {mesure.salinity} ppt
                      </span>
                    )}
                    {mesure.turbidity !== undefined && (
                      <span className="block text-sm font-semibold text-gray-900">
                        {mesure.turbidity} NTU
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Alerts amélioré */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alertes récentes</h3>
              <span className="text-sm text-gray-500">{alertesArray.length} alertes</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alertesArray.slice(0, 8).map((alerte: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alerte.type === 'error' ? 'bg-red-50 border-red-500' :
                  alerte.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alerte.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(alerte.date).toLocaleString()}
                      </p>
                      {alerte.bassinId && (
                        <p className="text-xs text-gray-400 mt-1">
                          Bassin: {alerte.bassinId}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
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
      </div>
    </div>
  );
} 