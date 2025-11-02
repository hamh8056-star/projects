"use client";

import { Card } from "@/components/ui";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, Activity, Settings, Zap, Eye, TrendingUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OperateurDashboard() {
  const { data: mesures, isLoading: mesuresLoading } = useSWR("/api/mesures", fetcher);
  const { data: alertes, isLoading: alertesLoading } = useSWR("/api/alertes", fetcher);
  const { data: bassins = [], isLoading: bassinsLoading } = useSWR("/api/bassins", fetcher);
  const [selectedBassin, setSelectedBassin] = useState<string>("");

  // Initialiser selectedBassin avec le premier bassin disponible
  useEffect(() => {
    if (bassins.length > 0 && selectedBassin === "") {
      const firstBassin = bassins[0];
      const initialValue = firstBassin._id || firstBassin.nom || firstBassin.name || "";
      console.log('🏊 [Opérateur] Initialisation selectedBassin:', { bassins, firstBassin, initialValue });
      setSelectedBassin(initialValue);
    }
  }, [bassins]);

  // S'assurer que mesures et alertes sont des tableaux
  const mesuresArray = Array.isArray(mesures) ? mesures : [];
  const alertesArray = Array.isArray(alertes) ? alertes : [];

  // Filtrer les données par bassin sélectionné
  const filteredMesures = selectedBassin 
    ? mesuresArray.filter((item: any) => {
        const itemBassin = item.bassinId || item.bassin || item.nomBassin;
        // console.log('🔍 [Opérateur] Filtre mesures:', { selectedBassin, itemBassin, match: itemBassin === selectedBassin });
        return itemBassin === selectedBassin;
      })
    : mesuresArray;

  const filteredAlertes = selectedBassin
    ? alertesArray.filter((item: any) => {
        const itemBassin = item.bassinId || item.bassin || item.nomBassin;
        // console.log('🔍 [Opérateur] Filtre alertes:', { selectedBassin, itemBassin, match: itemBassin === selectedBassin });
        return itemBassin === selectedBassin;
      })
    : alertesArray;

  // Données pour les graphiques
  const temperatureData = filteredMesures
    .filter((item: any) => item.param === "Température")
    .slice(-10)
    .map((item: any) => ({
      date: new Date(item.date).toLocaleTimeString(),
      value: parseFloat((item.value || "").replace(/[^\d.\-]/g, "")),
    }));

  const alertesParType = [
    { name: "Avertissements", value: filteredAlertes.filter((a: any) => a.type === "warning").length, color: "#f59e0b" },
    { name: "Erreurs", value: filteredAlertes.filter((a: any) => a.type === "error").length, color: "#ef4444" },
    { name: "Info", value: filteredAlertes.filter((a: any) => !a.type).length, color: "#3b82f6" },
  ];

  const derniereMesures = filteredMesures.slice(0, 5);

  // Tâches en cours pour l'opérateur
  const tachesEnCours = [
    { id: 1, titre: "Vérification pH Bassin 2", statut: "en_cours", priorite: "haute", temps: "15 min" },
    { id: 2, titre: "Maintenance capteur O2", statut: "planifie", priorite: "moyenne", temps: "30 min" },
    { id: 3, titre: "Contrôle température", statut: "termine", priorite: "basse", temps: "5 min" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Opérateur</h1>
            <p className="text-gray-600">Surveillance et interventions sur la ferme aquacole</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Système opérationnel</span>
            </div>
            <select 
              value={selectedBassin} 
              onChange={(e) => {
                console.log('🔄 [Opérateur] Changement selectedBassin:', e.target.value);
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

      <div className="p-6">
        {/* KPIs Cards - Focus sur les interventions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: "Alertes actives", 
              value: alertesArray.filter((a: any) => a.type === "error").length.toString(), 
              icon: <AlertTriangle className="w-6 h-6" />, 
              trend: "À traiter", 
              color: "from-red-500 to-pink-500",
              status: "alert"
            },
            { 
              title: "Tâches en cours", 
              value: tachesEnCours.filter(t => t.statut === "en_cours").length.toString(), 
              icon: <Clock className="w-6 h-6" />, 
              trend: "3 planifiées", 
              color: "from-blue-500 to-cyan-500",
              status: "normal"
            },
            { 
              title: "Systèmes OK", 
              value: "11/12", 
              icon: <CheckCircle className="w-6 h-6" />, 
              trend: "1 en maintenance", 
              color: "from-green-500 to-emerald-500",
              status: "warning"
            },
            { 
              title: "Efficacité", 
              value: "94.2%", 
              icon: <TrendingUp className="w-6 h-6" />, 
              trend: "+1.8%", 
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

        {/* Section des tâches et interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tâches en cours */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tâches en cours</h3>
            </div>
            <div className="space-y-3">
              {tachesEnCours.map((tache) => (
                <div key={tache.id} className={`p-3 rounded-lg border-l-4 ${
                  tache.statut === 'en_cours' ? 'bg-blue-50 border-blue-500' :
                  tache.statut === 'planifie' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-green-50 border-green-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{tache.titre}</p>
                      <p className="text-sm text-gray-500">{tache.temps}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tache.priorite === 'haute' ? 'bg-red-100 text-red-800' :
                      tache.priorite === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tache.priorite}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Voir toutes les tâches
            </button>
          </Card>

          {/* Interventions rapides */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Interventions rapides</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Alerte critique</span>
                </div>
                <p className="text-sm text-red-600 mt-1">pH Bassin 2 trop bas</p>
              </button>
              <button className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Maintenance</span>
                </div>
                <p className="text-sm text-yellow-600 mt-1">Capteur O2 à vérifier</p>
              </button>
              <button className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Surveillance</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">Contrôle température</p>
              </button>
            </div>
          </Card>

          {/* État des équipements */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">État des équipements</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm">Capteurs température</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">OK</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <span className="text-sm">Capteur O2 Bassin 2</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600">Maintenance</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm">Système de filtration</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">OK</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm">Pompes d'aération</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">OK</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Temperature Chart */}
          <Card className="p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution de la température</h3>
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

          {/* Alerts Distribution */}
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

        {/* Recent Data & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Measurements */}
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

          {/* Recent Alerts */}
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
      </div>
    </div>
  );
} 