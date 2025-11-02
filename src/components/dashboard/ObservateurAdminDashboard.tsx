"use client";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ObservateurAdminDashboard() {
  const [mesures, setMesures] = useState<any[]>([]);
  const [alertes, setAlertes] = useState<any[]>([]);
  const [bassins, setBassins] = useState<any[]>([]);
  const [selectedParam, setSelectedParam] = useState("temperature");
  const [selectedBassin, setSelectedBassin] = useState("all");

  useEffect(() => {
    fetch("/api/mesures").then(r => r.json()).then(setMesures);
    fetch("/api/alertes").then(r => r.json()).then(setAlertes);
    fetch("/api/bassins").then(r => r.json()).then(setBassins);
  }, []);

  // Préparation des données pour le graphique
  const chartData = (Array.isArray(mesures) ? mesures : [])
    .filter(m => (selectedBassin === "all" || m.bassinId === selectedBassin))
    .map(m => ({
      date: new Date(m.date).toLocaleTimeString(),
      value: m[selectedParam],
    }))
    .slice(-30);

  // Dernières mesures
  const lastMesures = (Array.isArray(mesures) ? mesures : []).slice(0, 15);

  // Dernières alertes
  const lastAlertes = (Array.isArray(alertes) ? alertes : []).slice(0, 15);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">🐟</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Observateur (Avancé)</h1>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl shadow text-center">
          <div className="text-3xl font-bold">{mesures.length}</div>
          <div className="text-gray-600">Mesures totales</div>
        </div>
        <div className="p-6 bg-white rounded-xl shadow text-center">
          <div className="text-3xl font-bold">{alertes.length}</div>
          <div className="text-gray-600">Alertes (24h)</div>
        </div>
        <div className="p-6 bg-white rounded-xl shadow text-center">
          <div className="text-3xl font-bold">{bassins.length}</div>
          <div className="text-gray-600">Bassins surveillés</div>
        </div>
        <div className="p-6 bg-white rounded-xl shadow text-center">
          <div className="text-3xl font-bold">98.7%</div>
          <div className="text-gray-600">Qualité données</div>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex gap-4 mb-4">
          <select value={selectedParam} onChange={e => setSelectedParam(e.target.value)} className="border rounded px-3 py-2">
            <option value="temperature">Température</option>
            <option value="ph">pH</option>
            <option value="oxygen">Oxygène</option>
            <option value="salinity">Salinité</option>
            <option value="turbidity">Turbidité</option>
          </select>
          <select value={selectedBassin} onChange={e => setSelectedBassin(e.target.value)} className="border rounded px-3 py-2">
            <option value="all">Tous les bassins</option>
            {bassins.map(b => (
              <option key={b._id} value={b._id}>{b.nom || b.name || b._id}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau des mesures */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">Dernières mesures</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Bassin</th>
                <th className="px-4 py-2">Température</th>
                <th className="px-4 py-2">pH</th>
                <th className="px-4 py-2">Oxygène</th>
                <th className="px-4 py-2">Salinité</th>
                <th className="px-4 py-2">Turbidité</th>
              </tr>
            </thead>
            <tbody>
              {lastMesures.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-2">{new Date(m.date).toLocaleString()}</td>
                  <td className="px-4 py-2">{m.bassinId || m.bassin || "?"}</td>
                  <td className="px-4 py-2">{m.temperature ?? "-"}</td>
                  <td className="px-4 py-2">{m.ph ?? "-"}</td>
                  <td className="px-4 py-2">{m.oxygen ?? "-"}</td>
                  <td className="px-4 py-2">{m.salinity ?? "-"}</td>
                  <td className="px-4 py-2">{m.turbidity ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tableau des alertes */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">Alertes récentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Bassin</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {lastAlertes.map((a, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-2">{new Date(a.date).toLocaleString()}</td>
                  <td className="px-4 py-2">{a.bassinId || a.bassin || "?"}</td>
                  <td className="px-4 py-2">{a.type}</td>
                  <td className="px-4 py-2">{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 