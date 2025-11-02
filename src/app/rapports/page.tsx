"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Calendar, BarChart3, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const mockRapports = [
  {
    id: 1,
    type: "Rapport quotidien",
    date: new Date(),
    description: "Synthèse des mesures et alertes du jour.",
    url: "/api/rapports/quotidien.pdf"
  },
  {
    id: 2,
    type: "Rapport hebdomadaire",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    description: "Analyse des tendances sur 7 jours.",
    url: "/api/rapports/hebdo.pdf"
  },
  {
    id: 3,
    type: "Rapport mensuel",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    description: "Tendances et statistiques du mois.",
    url: "/api/rapports/mensuel.pdf"
  }
];

export default function RapportsPage() {
  const [rapports] = useState(mockRapports);
  const [page, setPage] = useState(1);
  
  // Fetch real data
  const { data: mesures, isLoading: mesuresLoading } = useSWR("/api/mesures", fetcher);
  const { data: alertes, isLoading: alertesLoading } = useSWR("/api/alertes", fetcher);
  const { data: bassins, isLoading: bassinsLoading } = useSWR("/api/bassins", fetcher);

  // Pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(rapports.length / itemsPerPage);
  const paginatedRapports = rapports.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  // Calculate real statistics
  const mesuresArray = Array.isArray(mesures?.mesures) ? mesures.mesures : (Array.isArray(mesures) ? mesures : []);
  const alertesArray = Array.isArray(alertes) ? alertes : [];
  
  // Calculate temperature average
  const temperatureAvg = (() => {
    const tempMesures = mesuresArray.filter((m: any) => m.temperature !== undefined && m.temperature !== null);
    if (tempMesures.length === 0) return 0;
    const sum = tempMesures.reduce((acc: number, m: any) => acc + parseFloat(m.temperature || "0"), 0);
    return (sum / tempMesures.length).toFixed(1);
  })();
  
  // Calculate critical alerts (danger type)
  const criticalAlerts = alertesArray.filter((a: any) => a.type === "danger" || a.type === "error").length;
  
  // Calculate total measures
  const totalMesures = mesuresArray.length;
  
  // Calculate pH average
  const phAvg = (() => {
    const phMesures = mesuresArray.filter((m: any) => m.ph !== undefined && m.ph !== null);
    if (phMesures.length === 0) return 0;
    const sum = phMesures.reduce((acc: number, m: any) => acc + parseFloat(m.ph || "0"), 0);
    return (sum / phMesures.length).toFixed(1);
  })();

  // Helper function to get date range based on report type
  function getDateRange(reportType: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (reportType) {
      case "Rapport quotidien":
        return { startDate: today, endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case "Rapport hebdomadaire":
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { startDate: weekStart, endDate: now };
      case "Rapport mensuel":
        const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { startDate: monthStart, endDate: now };
      default:
        return { startDate: today, endDate: now };
    }
  }
  
  // Filter data based on report type
  function getFilteredData(reportType: string) {
    const { startDate, endDate } = getDateRange(reportType);
    
    const filteredMesures = mesuresArray.filter((m: any) => {
      const mesureDate = new Date(m.date);
      return mesureDate >= startDate && mesureDate <= endDate;
    });
    
    const filteredAlertes = alertesArray.filter((a: any) => {
      const alerteDate = new Date(a.date);
      return alerteDate >= startDate && alerteDate <= endDate;
    });
    
    return { filteredMesures, filteredAlertes };
  }

  // Export Excel
  async function handleExportExcel(rapport: any) {
    const XLSX = await import("xlsx");
    const { filteredMesures, filteredAlertes } = getFilteredData(rapport.type);
    
    // Prepare data for Excel
    const data: any[] = [];
    
    // Add summary section
    data.push({ Section: "Résumé", Champ: "", Valeur: "" });
    data.push({ Section: "", Champ: "Période", Valeur: `${rapport.date.toLocaleDateString('fr-FR')}` });
    data.push({ Section: "", Champ: "Mesures totales", Valeur: filteredMesures.length });
    data.push({ Section: "", Champ: "Alertes totales", Valeur: filteredAlertes.length });
    data.push({ Section: "", Champ: "", Valeur: "" });
    
    // Add measures section
    data.push({ Section: "Mesures", Champ: "", Valeur: "" });
    if (filteredMesures.length > 0) {
      filteredMesures.slice(0, 50).forEach((m: any) => {
        data.push({
          Section: "",
          Champ: new Date(m.date).toLocaleString('fr-FR'),
          Valeur: `${m.temperature ? m.temperature + '°C' : ''}${m.ph ? ', pH: ' + m.ph : ''}${m.oxygen ? ', O2: ' + m.oxygen : ''}${m.salinity ? ', Sal: ' + m.salinity : ''}${m.turbidity ? ', Turb: ' + m.turbidity : ''}`,
          Bassin: m.bassinNom || m.bassin || 'N/A'
        });
      });
    }
    data.push({ Section: "", Champ: "", Valeur: "" });
    
    // Add alerts section
    data.push({ Section: "Alertes", Champ: "", Valeur: "" });
    if (filteredAlertes.length > 0) {
      filteredAlertes.forEach((a: any) => {
        data.push({
          Section: "",
          Champ: new Date(a.date).toLocaleString('fr-FR'),
          Valeur: a.message || a.value,
          Type: a.type || 'info',
          Bassin: a.bassin || 'N/A'
        });
      });
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapport");
    XLSX.writeFile(wb, `${rapport.type.replace(/ /g, "_")}.xlsx`);
  }
  
  // Export PDF
  async function handleExportPDF(rapport: any) {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(18);
    doc.text(rapport.type, 14, yPosition);
    yPosition += 10;
    
    // Date and description
    doc.setFontSize(12);
    doc.text(`Date: ${rapport.date.toLocaleDateString('fr-FR')}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Description: ${rapport.description}`, 14, yPosition);
    yPosition += 10;
    
    // Get filtered data
    const { filteredMesures, filteredAlertes } = getFilteredData(rapport.type);
    
    // Summary section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Résumé", 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Mesures totales: ${filteredMesures.length}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Alertes totales: ${filteredAlertes.length}`, 14, yPosition);
    yPosition += 10;
    
    // Recent measures table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Mesures récentes", 14, yPosition);
    yPosition += 8;
    
    if (filteredMesures.length > 0) {
      const mesuresData = filteredMesures.slice(0, 15).map((m: any) => [
        new Date(m.date).toLocaleDateString('fr-FR'),
        m.temperature ? `${m.temperature}°C` : '-',
        m.ph ? m.ph.toString() : '-',
        m.oxygen ? `${m.oxygen} mg/L` : '-',
        m.bassinNom || m.bassin || 'N/A'
      ]);
      
    autoTable(doc, {
        startY: yPosition,
        head: [["Date", "Température", "pH", "Oxygène", "Bassin"]],
        body: mesuresData,
      theme: 'grid',
        headStyles: { fillColor: [6, 182, 212] },
        styles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });
      yPosition = ((doc as any).lastAutoTable?.finalY || yPosition) + 10;
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Aucune mesure disponible", 14, yPosition);
      yPosition += 10;
    }
    
    // Alerts table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Alertes", 14, yPosition);
    yPosition += 8;
    
    if (filteredAlertes.length > 0) {
      const alertesData = filteredAlertes.slice(0, 15).map((a: any) => [
        new Date(a.date).toLocaleDateString('fr-FR'),
        a.message || a.value || '-',
        a.type || 'info',
        a.bassin || 'N/A'
      ]);
      
    autoTable(doc, {
        startY: yPosition,
        head: [["Date", "Message", "Type", "Bassin"]],
        body: alertesData,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212] },
        styles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Aucune alerte disponible", 14, yPosition);
    }
    
    doc.save(`${rapport.type.replace(/ /g, "_")}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header avec titre */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Rapports & Export
            </h1>
            <p className="text-gray-600 mt-1">Consultez, téléchargez ou exportez les rapports de la ferme aquacole</p>
          </div>
        </div>
        
        {/* Cartes statistiques modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rapports disponibles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{rapports.length}</p>
                <p className="text-sm mt-1 text-green-600">Tous formats</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Température moyenne</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {mesuresLoading ? "..." : `${temperatureAvg}°C`}
                </p>
                <p className="text-sm mt-1 text-green-600">Stable</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertes critiques</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {alertesLoading ? "..." : criticalAlerts}
                </p>
                <p className="text-sm mt-1 text-red-600">À traiter</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
      </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">98.5%</p>
                <p className="text-sm mt-1 text-green-600">+2.3%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Rapports */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-600" /> Rapports disponibles
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedRapports.map(r => (
                <div key={r.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-cyan-100 p-2 rounded-full">
                      <FileText className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{r.type}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        {r.date.toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mb-3">{r.description}</p>
                  <div className="flex gap-2 mt-3">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => handleExportExcel(r)}
                    >
                      <BarChart3 className="w-4 h-4" /> Excel
                    </button>
            <button
                      className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => handleExportPDF(r)}
            >
                      <Download className="w-4 h-4" /> PDF
            </button>
          </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination */}
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
        
      </div>
    </div>
  );
} 
