"use client";

import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import { 
  ArrowLeft, 
  Fish, 
  Thermometer, 
  Activity, 
  Droplets, 
  Waves, 
  Scale, 
  Ruler, 
  Calendar, 
  Info,
  Award,
  CheckCircle2,
  LineChart,
  Download,
  Clipboard,
  Share2
} from "lucide-react";
import Link from "next/link";
import { getPublicUrl } from "@/lib/publicUrl";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Enregistrer les composants ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Mesure {
  _id: string;
  timestamp: string;
  temperature: number;
  ph: number;
  oxygen: number;
  salinity: number;
  turbidity: number;
}

interface LotData {
  _id: string;
  nom: string;
  espece: string;
  quantite: number;
  dateCreation: string;
  stade: string;
  statut: string;
  poidsMoyen: number;
  tailleMoyenne: number;
  bassinId?: string;
  bassinNom: string;
  bassinType?: string;
  bassinVolume?: number;
  dateRecolteEstimee?: string;
  mesures?: Mesure[];
  statistiques?: {
    temperature?: { min: number; max: number; moyenne: number };
    ph?: { min: number; max: number; moyenne: number };
    oxygen?: { min: number; max: number; moyenne: number };
    salinity?: { min: number; max: number; moyenne: number };
    turbidity?: { min: number; max: number; moyenne: number };
  };
}

export default function TracabilitePage({ params }: { params: Promise<{ id: string }> }) {
  const [lot, setLot] = useState<LotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [mesuresHistoriques, setMesuresHistoriques] = useState<Mesure[]>([]);
  const [loadingMesures, setLoadingMesures] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const { id: lotId } = use(params);
  
  useEffect(() => {
    const fetchLotData = async () => {
      try {
        console.log(`[Tracabilité] Chargement du lot: ${lotId}`);
        
        // Utiliser la nouvelle API publique
        const response = await fetch(`/api/lots/public/${lotId}`);
        
        console.log(`[Tracabilité] Réponse API:`, response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[Tracabilité] Erreur API:`, errorData);
          
          if (response.status === 404) {
            throw new Error("Lot non trouvé. Vérifiez que l'ID du lot est correct.");
          }
          throw new Error(errorData.error || "Erreur lors du chargement des données");
        }
        
        const data = await response.json();
        console.log(`[Tracabilité] Données reçues:`, data);
        
        setLot(data);
        setLoading(false);
        
        // Si le lot a un bassin mais pas de mesures, charger les mesures séparément
        if (data.bassinId && (!data.mesures || data.mesures.length === 0)) {
          fetchMesuresHistoriques(data.bassinId);
        }
      } catch (err: any) {
        console.error(`[Tracabilité] Erreur:`, err);
        setError(err.message || "Une erreur est survenue");
        setLoading(false);
      }
    };
    
    if (lotId) {
      fetchLotData();
    } else {
      setError("ID de lot manquant dans l'URL");
      setLoading(false);
    }
  }, [lotId]);
  
  // Charger l'historique des mesures pour un bassin
  const fetchMesuresHistoriques = async (bassinId: string) => {
    try {
      setLoadingMesures(true);
      const response = await fetch(`/api/historique/bassin/${bassinId}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des mesures");
      }
      
      const data = await response.json();
      
      if (data.mesures && data.mesures.length > 0) {
        setMesuresHistoriques(data.mesures);
        
        // Mettre à jour le lot avec les nouvelles mesures et statistiques
        setLot(prevLot => {
          if (!prevLot) return null;
          
          return {
            ...prevLot,
            mesures: data.mesures,
            statistiques: {
              temperature: {
                min: data.statistics.temperature.min,
                max: data.statistics.temperature.max,
                moyenne: data.statistics.temperature.avg
              },
              ph: {
                min: data.statistics.ph.min,
                max: data.statistics.ph.max,
                moyenne: data.statistics.ph.avg
              },
              oxygen: {
                min: data.statistics.oxygen.min,
                max: data.statistics.oxygen.max,
                moyenne: data.statistics.oxygen.avg
              },
              salinity: {
                min: data.statistics.salinity.min,
                max: data.statistics.salinity.max,
                moyenne: data.statistics.salinity.avg
              },
              turbidity: {
                min: data.statistics.turbidity.min,
                max: data.statistics.turbidity.max,
                moyenne: data.statistics.turbidity.avg
              }
            }
          };
        });
      }
      
      setLoadingMesures(false);
    } catch (err) {
      console.error("Erreur lors du chargement des mesures:", err);
      setLoadingMesures(false);
    }
  };
  
  // Formater les dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non spécifiée";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Traduire le stade de développement
  const traduireStade = (stade: string) => {
    const traductions: { [key: string]: string } = {
      alevin: "Alevin",
      juvenile: "Juvénile",
      adulte: "Adulte",
      reproducteur: "Reproducteur"
    };
    
    return traductions[stade] || stade;
  };

  // Copier le lien dans le presse-papier
  const copierLien = () => {
    // Utiliser l'URL actuelle pour le lien copié (local si local, public si public)
    const publicUrl = getPublicUrl(true);
    const urlToCopy = `${publicUrl}/public/tracabilite/${lotId}`;
    navigator.clipboard.writeText(urlToCopy);
    setToastMessage("Lien copié dans le presse-papier");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Télécharger le certificat en PDF
  const telechargerCertificat = async () => {
    if (!lot) {
      setToastMessage("Erreur: Données du certificat non disponibles");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setToastMessage("Génération du PDF en cours...");
      setShowToast(true);

      // Importer dynamiquement les bibliothèques
      const jsPDF = (await import("jspdf")).default;
      const QRCode = (await import("qrcode")).default;
      
      // Générer le QR code avec l'URL publique de l'application
      // Utiliser la fonction utilitaire pour détecter automatiquement l'environnement
      const qrCodeBaseUrl = getPublicUrl();
      const qrCodeUrl = `${qrCodeBaseUrl}/public/tracabilite/${lotId}`;
      const qrCodeImage = await QRCode.toDataURL(qrCodeUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000", // Noir
          light: "#FFFFFF", // Blanc
        },
      });
      
      // Créer le PDF directement avec jsPDF (méthode plus fiable)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      let yPosition = margin;

      // Couleurs professionnelles
      const primaryColor = [0, 0, 0]; // Noir pour un look professionnel
      const accentColor = [34, 197, 94]; // Vert pour accents
      const textColor = [31, 41, 55]; // gray-800
      const borderColor = [200, 200, 200]; // Gris clair pour bordures

      // Créer une image de filigrane d'arrière-plan
      const createWatermarkImage = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800; // Haute résolution
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return null;
        
        // Fond transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Rotation pour effet diagonal
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); // Rotation de -30 degrés
        
        // Texte du filigrane en rouge
        ctx.fillStyle = 'rgba(220, 38, 38, 0.12)'; // Rouge avec transparence
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Texte principal
        ctx.fillText('AQUAAI', 0, -50);
        
        // Sous-texte
        ctx.font = 'bold 40px Arial';
        ctx.fillText('CERTIFICAT', 0, 50);
        ctx.fillText('OFFICIEL', 0, 100);
        
        ctx.restore();
        
        return canvas.toDataURL('image/png');
      };

      const watermarkImage = createWatermarkImage();

      // Fonction pour ajouter le filigrane en arrière-plan
      const addWatermarkToPage = (pageNum: number) => {
        if (watermarkImage) {
          // Positionner le filigrane au centre de la page, en arrière-plan
          const watermarkSize = 150; // Taille du filigrane
          const watermarkX = (pageWidth - watermarkSize) / 2;
          const watermarkY = (pageHeight - watermarkSize) / 2;
          // Utiliser 'FAST' pour le rendu rapide et placer en arrière-plan
          pdf.addImage(watermarkImage, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize, undefined, 'FAST');
        }
      };

      // Ajouter le filigrane sur la première page avant le contenu
      addWatermarkToPage(1);

      // Bordure décorative autour de la page
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(1);
      pdf.rect(5, 5, pageWidth - 10, pageHeight - 10, 'D');
      pdf.rect(8, 8, pageWidth - 16, pageHeight - 16, 'D');

      // En-tête professionnel
      const headerY = 25;
      
      // Ligne décorative en haut
      pdf.setDrawColor(...accentColor);
      pdf.setLineWidth(2);
      pdf.line(margin, headerY - 5, pageWidth - margin, headerY - 5);
      
      // Logo/Titre de l'entreprise (centré)
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text("AQUAAI", pageWidth / 2, headerY, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Laboratoire de Traçabilité Aquacole", pageWidth / 2, headerY + 7, { align: 'center' });
      pdf.text("Certificat d'Analyse et de Traçabilité", pageWidth / 2, headerY + 12, { align: 'center' });
      
      // Ligne décorative en bas de l'en-tête
      pdf.setDrawColor(...accentColor);
      pdf.setLineWidth(1);
      pdf.line(margin, headerY + 18, pageWidth - margin, headerY + 18);

      yPosition = headerY + 30;
      pdf.setTextColor(...textColor);

      // Section 1: Informations d'identification
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("1. INFORMATIONS D'IDENTIFICATION", margin, yPosition);
      yPosition += 8;

      // Tableau pour les informations
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(0.3);
      const tableStartY = yPosition;
      const col1X = margin;
      const col2X = margin + 70;
      const rowHeight = 7;

      const infoData = [
        { label: "Numéro de certificat:", value: lot._id },
        { label: "Nom du lot:", value: lot.nom },
        { label: "Espèce:", value: lot.espece },
        { label: "Quantité:", value: `${lot.quantite} unités` },
        { label: "Stade de développement:", value: traduireStade(lot.stade) },
        { label: "Date de création:", value: formatDate(lot.dateCreation) },
        { label: "Date de récolte estimée:", value: formatDate(lot.dateRecolteEstimee) || "Non spécifiée" },
        { label: "Bassin d'élevage:", value: lot.bassinNom || "Non spécifié" },
      ];

      infoData.forEach((item, index) => {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin + 10;
        }

        // Ligne du tableau
        pdf.setDrawColor(...borderColor);
        pdf.line(col1X, yPosition - 3, pageWidth - margin, yPosition - 3);
        
        // Label
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(60, 60, 60);
        pdf.text(item.label, col1X, yPosition);
        
        // Valeur
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textColor);
        const valueX = col2X;
        const maxWidth = pageWidth - margin - valueX;
        const lines = pdf.splitTextToSize(item.value, maxWidth);
        pdf.text(lines, valueX, yPosition);
        yPosition += Math.max(rowHeight, lines.length * 4 + 2);
      });

      // Fermer le tableau
      pdf.setDrawColor(...borderColor);
      pdf.line(col1X, yPosition - 3, pageWidth - margin, yPosition - 3);
      yPosition += 5;

      // Section 2: Caractéristiques physiques
      if (lot.tailleMoyenne || lot.poidsMoyen) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...primaryColor);
        pdf.text("2. CARACTÉRISTIQUES PHYSIQUES", margin, yPosition);
        yPosition += 8;

        pdf.setDrawColor(...borderColor);
        pdf.line(col1X, yPosition - 3, pageWidth - margin, yPosition - 3);
        
        if (lot.tailleMoyenne) {
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(60, 60, 60);
          pdf.text("Taille moyenne:", col1X, yPosition);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...textColor);
          pdf.text(`${lot.tailleMoyenne} cm`, col2X, yPosition);
          yPosition += rowHeight;
        }
        
        if (lot.poidsMoyen) {
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(60, 60, 60);
          pdf.text("Poids moyen:", col1X, yPosition);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...textColor);
          pdf.text(`${lot.poidsMoyen} g`, col2X, yPosition);
          yPosition += rowHeight;
        }
        
        pdf.setDrawColor(...borderColor);
        pdf.line(col1X, yPosition - 3, pageWidth - margin, yPosition - 3);
        yPosition += 10;
      }

      // Section 3: Paramètres environnementaux (si disponibles)
      if (lot.statistiques) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin + 10;
        }

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...primaryColor);
        pdf.text("3. PARAMÈTRES ENVIRONNEMENTAUX", margin, yPosition);
        yPosition += 8;

        // En-tête du tableau
        pdf.setFillColor(240, 240, 240);
        pdf.rect(col1X, yPosition - 5, pageWidth - 2 * margin, 6, 'F');
        pdf.setDrawColor(...borderColor);
        pdf.rect(col1X, yPosition - 5, pageWidth - 2 * margin, 6, 'D');
        
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...primaryColor);
        pdf.text("Paramètre", col1X + 2, yPosition - 1);
        pdf.text("Minimum", col1X + 50, yPosition - 1);
        pdf.text("Moyenne", col1X + 75, yPosition - 1);
        pdf.text("Maximum", col1X + 100, yPosition - 1);
        pdf.text("Unité", col1X + 130, yPosition - 1);
        yPosition += 5;

        const stats = [
          { label: "Température", data: lot.statistiques.temperature, unit: "°C" },
          { label: "pH", data: lot.statistiques.ph, unit: "" },
          { label: "Oxygène dissous", data: lot.statistiques.oxygen, unit: "mg/L" },
          { label: "Salinité", data: lot.statistiques.salinity, unit: "ppt" },
          { label: "Turbidité", data: lot.statistiques.turbidity, unit: "NTU" },
        ];

        stats.forEach((stat, index) => {
          if (stat.data) {
            if (yPosition > pageHeight - 60) {
              pdf.addPage();
              yPosition = margin + 10;
            }

            // Ligne du tableau
            pdf.setDrawColor(...borderColor);
            pdf.line(col1X, yPosition - 3, pageWidth - margin, yPosition - 3);
            
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(...textColor);
            pdf.text(stat.label, col1X + 2, yPosition);
            pdf.text(stat.data.min?.toFixed(2) || "N/A", col1X + 50, yPosition);
            pdf.text(stat.data.moyenne?.toFixed(2) || "N/A", col1X + 75, yPosition);
            pdf.text(stat.data.max?.toFixed(2) || "N/A", col1X + 100, yPosition);
            pdf.text(stat.unit, col1X + 130, yPosition);
            yPosition += 6;
          }
        });

        // Fermer le tableau
        pdf.setDrawColor(...borderColor);
        pdf.line(col1X, yPosition - 3, pageWidth - margin, yPosition - 3);
        yPosition += 10;
      }

      // Section de certification et signature (dernière page)
      const lastPage = pdf.getNumberOfPages();
      pdf.setPage(lastPage);
      
      // S'assurer qu'on a assez d'espace
      if (yPosition > pageHeight - 100) {
        yPosition = pageHeight - 100;
      }

      // Ligne de séparation
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Section de certification
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("CERTIFICATION", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textColor);
      const certText = `Je certifie que les informations contenues dans ce document sont exactes et complètes. Ce certificat atteste de la traçabilité complète du lot depuis sa création jusqu'à sa récolte, conformément aux normes de qualité AquaAI.`;
      const certLines = pdf.splitTextToSize(certText, pageWidth - 2 * margin);
      pdf.text(certLines, margin, yPosition);
      yPosition += certLines.length * 5 + 10;

      // Date de vérification
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Date de vérification: ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, yPosition);
      yPosition += 15;

      // Zone de signature
      const signatureY = yPosition;
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(0.5);
      pdf.line(margin, signatureY, margin + 60, signatureY);
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("Directeur Technique", margin, signatureY + 8);
      
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text("AquaAI - Laboratoire de Traçabilité", margin, signatureY + 12);

      // QR Code et Cachet sur toutes les pages
      for (let i = 1; i <= lastPage; i++) {
        pdf.setPage(i);
        
        // Ajouter le filigrane en arrière-plan sur chaque page
        addWatermarkToPage(i);
        
        // Numéro de page
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} sur ${lastPage}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );

        // QR Code et Cachet uniquement sur la dernière page
        if (i === lastPage) {
          // QR Code (en bas à gauche)
          const qrX = margin;
          const qrY = pageHeight - 50;
          const qrSize = 25;
          
          pdf.addImage(qrCodeImage, 'PNG', qrX, qrY, qrSize, qrSize);
          
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text("Vérification", qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
          pdf.text("en ligne", qrX + qrSize / 2, qrY + qrSize + 6, { align: 'center' });

          // Cachet officiel (en bas à droite)
          const stampX = pageWidth - 40;
          const stampY = pageHeight - 40;
          const stampRadius = 18;
          const redColor = [220, 38, 38]; // Rouge plus foncé pour professionnel

          // Cercle extérieur épais
          pdf.setDrawColor(...redColor);
          pdf.setLineWidth(2.5);
          pdf.circle(stampX, stampY, stampRadius, 'D');

          // Cercle intérieur
          pdf.setLineWidth(1);
          pdf.circle(stampX, stampY, stampRadius - 3, 'D');

          // Texte dans le cachet
          pdf.setTextColor(...redColor);
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "bold");
          pdf.text("CERTIFIÉ", stampX, stampY - 8, { align: 'center' });
          
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text("AQUAAI", stampX, stampY, { align: 'center' });
          
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "bold");
          pdf.text("OFFICIEL", stampX, stampY + 8, { align: 'center' });
        }
      }

      // Générer le blob et ouvrir dans un nouvel onglet
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (!newWindow) {
        // Si la popup est bloquée, télécharger directement
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `certificat-${lot.nom}-${lot._id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);

      setToastMessage("PDF généré avec succès!");
      setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      console.error("Erreur lors de la génération du PDF:", error);
      setToastMessage(`Erreur: ${error.message || "Erreur lors de la génération du PDF"}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  // Préparer les données pour les graphiques
  const preparerDonneesGraphique = (mesures: Mesure[] | undefined, metrique: string) => {
    if (!mesures || mesures.length === 0) return null;

    // Formater les données
    const labels = mesures.map(m => {
      const date = new Date(m.timestamp);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }).reverse();

    const donnees = mesures.map(m => m[metrique as keyof Mesure] as number).reverse();

    return {
      labels,
      datasets: [
        {
          label: metrique.charAt(0).toUpperCase() + metrique.slice(1),
          data: donnees,
          borderColor: getColorForMetric(metrique),
          backgroundColor: `${getColorForMetric(metrique)}20`,
          tension: 0.4,
          fill: true,
          pointRadius: 2,
        }
      ]
    };
  };

  // Déterminer la couleur pour chaque métrique
  const getColorForMetric = (metrique: string) => {
    switch (metrique) {
      case 'temperature': return '#ef4444'; // rouge
      case 'ph': return '#8b5cf6'; // violet
      case 'oxygen': return '#3b82f6'; // bleu
      case 'salinity': return '#06b6d4'; // cyan
      case 'turbidity': return '#84cc16'; // vert clair
      default: return '#3b82f6'; // bleu par défaut
    }
  };

  // Options communes pour les graphiques
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
  };

  // Déterminer si nous avons des données de mesures à afficher
  const hasMesures = (lot?.mesures && lot.mesures.length > 0) || mesuresHistoriques.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">Chargement des informations de traçabilité...</p>
          <p className="mt-2 text-gray-500 text-sm">Veuillez patienter</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 rounded-full bg-red-50 items-center justify-center mb-4">
            <div className="text-red-500 text-3xl">⚠️</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  if (!lot) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 rounded-full bg-amber-50 items-center justify-center mb-4">
            <div className="text-amber-500 text-3xl">🔍</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lot introuvable</h1>
          <p className="text-gray-600 mb-6">Les informations de ce lot ne sont pas disponibles.</p>
          <Link 
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast de notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down">
          <CheckCircle2 size={18} />
          <p>{toastMessage}</p>
        </div>
      )}
      
      {/* En-tête */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-8 px-4 md:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Fish size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Certificat de Traçabilité AquaAI</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Ce certificat garantit l'authenticité et la traçabilité complète des informations sur ce lot de poissons.
          </p>
        </div>
      </header>
      
      {/* Actions simplifiées */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-end h-14">
            <div className="flex items-center space-x-2">
              <button 
                onClick={copierLien}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center gap-1"
                title="Copier le lien"
              >
                <Clipboard size={18} />
                <span className="hidden sm:inline">Copier le lien</span>
              </button>
              <button 
                onClick={telechargerCertificat}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center gap-1"
                title="Imprimer le certificat en PDF"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    // Utiliser l'URL actuelle pour le partage (local si local, public si public)
                    const publicUrl = getPublicUrl(true);
                    const urlToShare = `${publicUrl}/public/tracabilite/${lotId}`;
                    navigator.share({
                      title: `Traçabilité du lot ${lot.nom}`,
                      text: `Informations de traçabilité pour le lot ${lot.nom} (${lot.espece})`,
                      url: urlToShare,
                    });
                  } else {
                    copierLien();
                  }
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center gap-1"
                title="Partager"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Partager</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenu principal sans onglets */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Titre du lot */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-xl shadow-md">
              <Fish size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{lot.nom}</h2>
              <p className="text-xl text-gray-600">Espèce: <span className="font-medium">{lot.espece}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1">
              <Calendar size={14} /> Créé le {formatDate(lot.dateCreation)}
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1">
              <Activity size={14} /> Stade: {traduireStade(lot.stade)}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1">
              <CheckCircle2 size={14} /> Certifié AquaAI
            </span>
          </div>
        </div>

        {/* Grille d'informations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Info className="text-blue-500" size={20} />
                Informations générales
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Scale size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantité</p>
                    <p className="font-medium text-lg">{lot.quantite} poissons</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Ruler size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Taille moyenne</p>
                    <p className="font-medium text-lg">{lot.tailleMoyenne || "N/A"} cm</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Scale size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Poids moyen</p>
                    <p className="font-medium text-lg">{lot.poidsMoyen || "N/A"} g</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stade</p>
                    <p className="font-medium text-lg">{traduireStade(lot.stade)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-lg font-medium text-gray-800 mb-4">Dates importantes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Date de création</p>
                    <p className="font-medium">{formatDate(lot.dateCreation)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Date de récolte estimée</p>
                    <p className="font-medium">{formatDate(lot.dateRecolteEstimee)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Waves className="text-cyan-500" size={20} />
                  Informations du bassin
                </h3>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                      <Waves size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bassin</p>
                      <p className="font-medium text-lg">{lot.bassinNom || "Non spécifié"}</p>
                    </div>
                  </div>
                  
                  {lot.bassinType && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Info size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type de bassin</p>
                        <p className="font-medium text-lg">{lot.bassinType}</p>
                      </div>
                    </div>
                  )}
                  
                  {lot.bassinVolume && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Droplets size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Volume</p>
                        <p className="font-medium text-lg">{lot.bassinVolume} m³</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Award size={20} />
                Certification AquaAI
              </h3>
              <p className="mb-4 text-blue-50">Ce lot est certifié conforme aux normes de qualité et de traçabilité AquaAI.</p>
              <div className="flex justify-center mt-4">
                <button 
                  onClick={telechargerCertificat}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center gap-2"
                >
                  <Download size={16} />
                  Télécharger le certificat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suivi environnemental */}
        {loadingMesures ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mb-12">
            <div className="inline-flex h-16 w-16 rounded-full bg-blue-50 items-center justify-center mb-4">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Chargement des données environnementales</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Nous récupérons les données des capteurs IoT pour ce bassin...
            </p>
          </div>
        ) : hasMesures ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">Suivi environnemental du bassin</h2>
            <p className="text-gray-600 mb-6">
              Ce lot est élevé dans le bassin "{lot?.bassinNom}" qui est équipé de capteurs IoT permettant 
              de surveiller en temps réel les paramètres environnementaux. Voici les données collectées au cours 
              des 30 derniers jours:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-red-50 p-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Thermometer className="text-red-500" size={20} />
                    Suivi de la température
                  </h3>
                </div>
                <div className="p-4">
                  {preparerDonneesGraphique(lot.mesures, "temperature") && (
                    <>
                      <Line 
                        data={preparerDonneesGraphique(lot.mesures, "temperature")!} 
                        options={chartOptions} 
                        height={180}
                      />
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Min:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.temperature?.min || "N/A"}°C</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Moyenne:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.temperature?.moyenne || "N/A"}°C</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.temperature?.max || "N/A"}°C</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Droplets className="text-purple-500" size={20} />
                    Suivi du pH
                  </h3>
                </div>
                <div className="p-4">
                  {preparerDonneesGraphique(lot.mesures, "ph") && (
                    <>
                      <Line 
                        data={preparerDonneesGraphique(lot.mesures, "ph")!} 
                        options={chartOptions} 
                        height={180}
                      />
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Min:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.ph?.min || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Moyenne:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.ph?.moyenne || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.ph?.max || "N/A"}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Droplets className="text-blue-500" size={20} />
                    Suivi de l'oxygène dissous
                  </h3>
                </div>
                <div className="p-4">
                  {preparerDonneesGraphique(lot.mesures, "oxygen") && (
                    <>
                      <Line 
                        data={preparerDonneesGraphique(lot.mesures, "oxygen")!} 
                        options={chartOptions} 
                        height={180}
                      />
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Min:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.oxygen?.min || "N/A"} mg/L</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Moyenne:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.oxygen?.moyenne || "N/A"} mg/L</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.oxygen?.max || "N/A"} mg/L</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Droplets className="text-cyan-500" size={20} />
                    Suivi de la salinité
                  </h3>
                </div>
                <div className="p-4">
                  {preparerDonneesGraphique(lot.mesures, "salinity") && (
                    <>
                      <Line 
                        data={preparerDonneesGraphique(lot.mesures, "salinity")!} 
                        options={chartOptions} 
                        height={180}
                      />
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Min:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.salinity?.min || "N/A"} ppt</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Moyenne:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.salinity?.moyenne || "N/A"} ppt</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max:</span> 
                          <span className="font-medium ml-1">{lot.statistiques?.salinity?.max || "N/A"} ppt</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 mb-12 border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Info size={20} className="text-blue-600" />
                Interprétation des données
              </h3>
              <p className="text-blue-700 mb-4">
                Les paramètres environnementaux du bassin sont essentiels pour assurer une croissance optimale 
                et un bien-être des poissons. Voici les plages idéales pour l'espèce {lot.espece}:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="font-medium text-blue-800 mb-1">Température</div>
                  <div className="text-blue-700">
                    Idéal: 23-27°C pour le stade {traduireStade(lot.stade)}
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="font-medium text-blue-800 mb-1">pH</div>
                  <div className="text-blue-700">
                    Idéal: 6.8-7.5 pour une bonne croissance
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="font-medium text-blue-800 mb-1">Oxygène dissous</div>
                  <div className="text-blue-700">
                    Idéal: {'>'}5mg/L pour éviter le stress
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="font-medium text-blue-800 mb-1">Salinité</div>
                  <div className="text-blue-700">
                    Idéal: {lot.espece.toLowerCase().includes('tilapia') ? '0-15' : '0-3'} ppt selon l'espèce
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mb-12">
            <div className="inline-flex h-20 w-20 rounded-full bg-blue-50 items-center justify-center mb-4">
              <LineChart size={32} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Données environnementales non disponibles</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {lot.bassinId 
                ? `Ce lot est élevé dans le bassin "${lot.bassinNom}" mais les données environnementales ne sont pas encore disponibles.`
                : "Ce lot n'est pas actuellement associé à un bassin équipé de capteurs IoT."}
            </p>
          </div>
        )}

        {/* Certificat d'authenticité */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Award className="text-green-600" size={20} />
                Certificat de traçabilité
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Ce certificat atteste que ce lot de poissons a été élevé dans des conditions 
                  contrôlées et tracées tout au long de son cycle de vie, suivant les bonnes pratiques 
                  d'aquaculture responsable.
                </p>
              </div>
              
              <div ref={certificateRef} className="border-2 border-green-100 rounded-lg p-6 bg-green-50/30 relative">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <Fish size={128} />
                </div>
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold text-green-800">Certificat d'Authenticité</h4>
                  <p className="text-sm text-green-700">AquaAI - Solutions de traçabilité aquacole</p>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-green-700 font-medium">ID du lot:</div>
                    <div className="col-span-2 font-mono">{lot._id}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-green-700 font-medium">Nom du lot:</div>
                    <div className="col-span-2">{lot.nom}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-green-700 font-medium">Espèce:</div>
                    <div className="col-span-2">{lot.espece}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-green-700 font-medium">Date de création:</div>
                    <div className="col-span-2">{formatDate(lot.dateCreation)}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-green-100">
                  <div className="text-xs text-green-700">
                    Vérifié le {new Date().toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span className="text-sm font-medium text-green-700">Certifié AquaAI</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={telechargerCertificat}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <Download size={16} />
                  Télécharger le certificat
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Info className="text-blue-500" size={20} />
                  Informations de vérification
                </h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Vous pouvez vérifier l'authenticité de ce certificat en utilisant l'une des 
                  méthodes suivantes:
                </p>
                
                <ul className="space-y-4">
                  <li className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-0.5">
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Scanner le QR code</p>
                      <p className="text-gray-600 text-sm">
                        Utilisez l'application AquaAI Scanner pour vérifier ce certificat.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-0.5">
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Vérifier en ligne</p>
                      <p className="text-gray-600 text-sm">
                        Visitez{" "}
                        <Link href="/public/verify" className="text-blue-600 hover:underline font-medium">
                          la page de vérification
                        </Link>{" "}
                        et saisissez l'ID du lot.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-gray-300 py-10 px-4 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="bg-white/10 p-2 rounded-lg">
                <Fish size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">AquaAI</h3>
                <p className="text-gray-400 text-sm">Traçabilité intelligente pour l'aquaculture</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-medium mb-3">À propos</h4>
                <p className="text-gray-400 text-sm">
                  AquaAI fournit des solutions de traçabilité avancées pour l'industrie aquacole, 
                  garantissant transparence et confiance tout au long de la chaîne de valeur.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-3">Liens utiles</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Accueil</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Solutions</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">À propos</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-3">Contact</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>contact@aquaai.com</li>
                  <li>+33 1 23 45 67 89</li>
                  <li>123 Rue de l'Innovation, 75000 Paris</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>© {new Date().getFullYear()} AquaAI - Tous droits réservés</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @media print {
          header, footer, .bg-white.border-b, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          body {
            background: white !important;
          }
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 