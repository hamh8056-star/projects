"use client";

import { Card } from "@/components/ui/card";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Package, TrendingUp, DollarSign, QrCode, AlertCircle, CheckCircle, ShoppingCart, Fish, Calendar } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DistributeurDashboard() {
  const { data: lots = [], isLoading: lotsLoading } = useSWR("/api/lots", fetcher);
  const { data: ventes = [], isLoading: ventesLoading } = useSWR("/api/ventes", fetcher);
  const [periode, setPeriode] = useState<"7j" | "30j" | "90j">("30j");

  // Calculer les statistiques
  const lotsDisponibles = Array.isArray(lots) ? lots.filter((lot: any) => 
    lot.statut === "prêt à vendre" || lot.statut === "disponible"
  ).length : 0;

  const totalLots = Array.isArray(lots) ? lots.length : 0;
  const ventesArray = Array.isArray(ventes) ? ventes : [];
  
  // Statistiques de ventes
  const totalVentes = ventesArray.length;
  const quantiteVendue = ventesArray.reduce((sum: number, vente: any) => sum + (vente.quantite || 0), 0);
  const revenusTotal = ventesArray.reduce((sum: number, vente: any) => sum + (vente.prixTotal || 0), 0);
  const qrCodesGenerees = Array.isArray(lots) ? lots.filter((lot: any) => lot.qrCodeGenere).length : 0;

  // Filtrer les ventes par période
  const getDateLimit = () => {
    const now = new Date();
    switch (periode) {
      case "7j":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30j":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90j":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
  };

  const ventesFiltrees = ventesArray.filter((vente: any) => {
    const dateVente = new Date(vente.dateVente || vente.createdAt);
    return dateVente >= getDateLimit();
  });

  // Données pour graphique de ventes
  const ventesParJour = ventesFiltrees.reduce((acc: any, vente: any) => {
    const date = new Date(vente.dateVente || vente.createdAt).toLocaleDateString('fr-FR');
    if (!acc[date]) {
      acc[date] = { date, quantite: 0, revenus: 0 };
    }
    acc[date].quantite += vente.quantite || 0;
    acc[date].revenus += vente.prixTotal || 0;
    return acc;
  }, {});

  const chartData = Object.values(ventesParJour).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Top espèces vendues
  const especesVendues = ventesFiltrees.reduce((acc: any, vente: any) => {
    const espece = vente.lot?.espece || "Inconnu";
    if (!acc[espece]) {
      acc[espece] = { name: espece, value: 0 };
    }
    acc[espece].value += vente.quantite || 0;
    return acc;
  }, {});

  const pieData = Object.values(especesVendues)
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  // Lots prioritaires (proches de la date limite ou disponibles)
  const lotsPrioritaires = Array.isArray(lots) ? lots
    .filter((lot: any) => lot.statut === "prêt à vendre" || lot.statut === "disponible")
    .slice(0, 5) : [];

  if (lotsLoading || ventesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Distributeur</h1>
          <p className="text-gray-600">Vue d'ensemble de vos activités de distribution</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Lots Disponibles</p>
                <p className="text-3xl font-bold">{lotsDisponibles}</p>
                <p className="text-blue-100 text-xs mt-1">sur {totalLots} lots</p>
              </div>
              <Package className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Ventes Total</p>
                <p className="text-3xl font-bold">{totalVentes}</p>
                <p className="text-green-100 text-xs mt-1">{quantiteVendue} unités</p>
              </div>
              <ShoppingCart className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Revenus</p>
                <p className="text-3xl font-bold">{revenusTotal.toLocaleString('fr-FR')} DA</p>
                <p className="text-purple-100 text-xs mt-1">sur {periode}</p>
              </div>
              <DollarSign className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm mb-1">QR Codes Générés</p>
                <p className="text-3xl font-bold">{qrCodesGenerees}</p>
                <p className="text-cyan-100 text-xs mt-1">lots étiquetés</p>
              </div>
              <QrCode className="w-12 h-12 opacity-80" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Graphique des ventes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Évolution des Ventes</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriode("7j")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    periode === "7j" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  7j
                </button>
                <button
                  onClick={() => setPeriode("30j")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    periode === "30j" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  30j
                </button>
                <button
                  onClick={() => setPeriode("90j")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    periode === "90j" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  90j
                </button>
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="quantite" stroke="#3B82F6" strokeWidth={2} name="Quantité" />
                  <Line yAxisId="right" type="monotone" dataKey="revenus" stroke="#10B981" strokeWidth={2} name="Revenus (DA)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>Aucune vente sur cette période</p>
              </div>
            )}
          </Card>

          {/* Top espèces */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Espèces Vendues</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>Aucune vente enregistrée</p>
              </div>
            )}
          </Card>
        </div>

        {/* Lots prioritaires */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Lots Prioritaires</h2>
            <Link
              href="/distributeur"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Voir tous les lots →
            </Link>
          </div>
          {lotsPrioritaires.length > 0 ? (
            <div className="space-y-3">
              {lotsPrioritaires.map((lot: any) => (
                <div
                  key={lot._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Fish className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lot.nom}</h3>
                      <p className="text-sm text-gray-600">
                        {lot.espece} • {lot.quantite} unités
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lot.qrCodeGenere ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        QR Code généré
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        QR Code à générer
                      </span>
                    )}
                    <Link
                      href={`/distributeur`}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      Générer QR
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2" />
              <p>Aucun lot disponible pour le moment</p>
            </div>
          )}
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/distributeur">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Générer QR Codes</h3>
                  <p className="text-sm text-gray-600">Créer des QR codes pour les lots</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/ventes">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gérer les Ventes</h3>
                  <p className="text-sm text-gray-600">Enregistrer et suivre les ventes</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/lots">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Voir les Lots</h3>
                  <p className="text-sm text-gray-600">Consulter tous les lots disponibles</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

