"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  QrCode, 
  Search, 
  Download, 
  Printer, 
  Package, 
  Fish, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { getPublicUrl } from "@/lib/publicUrl";

interface Lot {
  _id: string;
  nom: string;
  espece: string;
  quantite: number;
  dateCreation: string;
  stade: string;
  statut: string;
  bassinNom?: string;
  barcodeGenere?: boolean;
}

export default function DistributeurPage() {
  const { data: session } = useSession();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{
    qrCodeImage: string;
    qrCodeUrl: string;
    lot: any;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Protection accès : seuls distributeur, admin et opérateur peuvent accéder
  if (session && !["distributeur", "admin", "operateur"].includes(session.user?.role || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h1>
          <p className="text-gray-600">Cette page est réservée aux distributeurs.</p>
        </div>
      </div>
    );
  }

  // Récupérer tous les lots
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await fetch("/api/lots");
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les lots");
        }
        
        const data = await response.json();
        setLots(data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des lots");
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchLots();
  }, []);

  // Toast auto-disparition
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Générer un QR code pour un lot
  const generateQRCode = async (lot: Lot) => {
    setGenerating(true);
    setSelectedLot(lot);
    setQrCodeData(null);
    setError(null);
    
    try {
      console.log(`[Distributeur] Génération QR code pour lot: ${lot._id}`);
      const response = await fetch(`/api/lots/${lot._id}/qrcode`);
      
      console.log(`[Distributeur] Réponse API:`, response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[Distributeur] Erreur API:`, errorData);
        throw new Error(errorData.error || "Impossible de générer le QR code");
      }
      
      const data = await response.json();
      console.log(`[Distributeur] Données reçues:`, {
        hasImage: !!data.qrCodeImage,
        imageLength: data.qrCodeImage?.length,
        url: data.qrCodeUrl
      });
      
      if (!data.qrCodeImage) {
        throw new Error("L'image du QR code n'a pas été générée");
      }
      
      if (!data.qrCodeUrl) {
        throw new Error("L'URL du QR code n'a pas été générée");
      }
      
      setQrCodeData({
        qrCodeImage: data.qrCodeImage,
        qrCodeUrl: data.qrCodeUrl,
        lot: lot
      });
      
      console.log(`[Distributeur] QR code défini avec succès`);
      setToast({ type: "success", message: "QR code généré avec succès!" });
      
      // Mettre à jour la liste des lots
      setLots(lots.map(l => 
        l._id === lot._id ? { ...l, barcodeGenere: true } : l
      ));
    } catch (err: any) {
      console.error(`[Distributeur] Erreur:`, err);
      const errorMessage = err.message || "Erreur lors de la génération du QR code";
      setToast({ type: "error", message: errorMessage });
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Télécharger le QR code
  const downloadQRCode = () => {
    if (!qrCodeData) return;
    
    const link = document.createElement("a");
    link.href = qrCodeData.qrCodeImage;
    link.download = `qr-code-${selectedLot?.nom}-${selectedLot?._id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimer le QR code
  const printQRCode = () => {
    if (!qrCodeData) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${selectedLot?.nom}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .qrcode-container {
              text-align: center;
              padding: 30px;
              border: 2px solid #000;
              border-radius: 8px;
              margin: 20px;
              max-width: 400px;
            }
            .lot-info {
              margin-bottom: 20px;
            }
            .lot-info h2 {
              margin: 10px 0;
              font-size: 24px;
              color: #1f2937;
            }
            .lot-info p {
              margin: 5px 0;
              font-size: 14px;
              color: #4b5563;
            }
            .qrcode-wrapper {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
              background: white;
              border-radius: 8px;
              margin: 20px 0;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .instructions {
              margin-top: 20px;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .qrcode-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="qrcode-container">
            <div class="lot-info">
              <h2>${selectedLot?.nom}</h2>
              <p><strong>Espèce:</strong> ${selectedLot?.espece}</p>
              <p><strong>Quantité:</strong> ${selectedLot?.quantite} unités</p>
            </div>
            <div class="qrcode-wrapper">
              <img src="${qrCodeData.qrCodeImage}" alt="QR Code de traçabilité" />
            </div>
            <div class="instructions">
              <p><strong>📱 Scannez ce QR code</strong></p>
              <p>pour accéder au certificat de traçabilité complet</p>
              <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">AquaAI - Traçabilité Aquacole</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Filtrer les lots
  const filteredLots = lots.filter(lot =>
    lot.nom.toLowerCase().includes(search.toLowerCase()) ||
    lot.espece.toLowerCase().includes(search.toLowerCase()) ||
    lot._id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Génération de QR Codes</h1>
              <p className="text-gray-600">Générez des QR codes pour les sacs de poissons - Les clients pourront scanner pour voir le certificat de traçabilité</p>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des lots */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un lot..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredLots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Aucun lot trouvé</p>
                </div>
              ) : (
                filteredLots.map((lot) => (
                  <div
                    key={lot._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedLot?._id === lot._id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedLot(lot)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Fish className="w-4 h-4 text-blue-500" />
                          <h3 className="font-semibold text-gray-900">{lot.nom}</h3>
                          {lot.barcodeGenere && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              QR Code généré
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Espèce: {lot.espece}</p>
                        <p className="text-sm text-gray-600">Quantité: {lot.quantite} unités</p>
                        {lot.bassinNom && (
                          <p className="text-sm text-gray-600">Bassin: {lot.bassinNom}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateQRCode(lot);
                        }}
                        disabled={generating}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {generating && selectedLot?._id === lot._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                        Générer QR
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Aperçu du QR code */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aperçu du QR Code</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <strong>Erreur:</strong> {error}
              </div>
            )}
            
            {!qrCodeData ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                <QrCode className="w-16 h-16 mb-4" />
                <p>Sélectionnez un lot et générez un QR code</p>
                {generating && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Génération en cours...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Informations du lot */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{qrCodeData.lot.nom}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Espèce:</strong> {qrCodeData.lot.espece}</p>
                    <p><strong>Quantité:</strong> {qrCodeData.lot.quantite} unités</p>
                    <p><strong>ID du lot:</strong> {qrCodeData.lot._id}</p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-lg">
                  {qrCodeData.qrCodeImage ? (
                    <div className="bg-white p-4 rounded-lg shadow-inner">
                      <img
                        src={qrCodeData.qrCodeImage}
                        alt="QR Code de traçabilité"
                        className="w-64 h-64"
                        onError={(e) => {
                          console.error("[Distributeur] Erreur chargement image QR code");
                          setError("Erreur lors du chargement de l'image du QR code");
                        }}
                        onLoad={() => {
                          console.log("[Distributeur] Image QR code chargée avec succès");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600 text-sm">Erreur: L'image du QR code n'est pas disponible</p>
                    </div>
                  )}
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Scannez ce QR code pour accéder au certificat de traçabilité
                  </p>
                  <div className="mt-2 text-xs text-gray-500 text-center break-all px-2">
                    {qrCodeData.qrCodeUrl}
                  </div>
                  <a
                    href={qrCodeData.qrCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 justify-center"
                  >
                    Tester le lien <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                  <button
                    onClick={printQRCode}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Astuce:</strong> Imprimez ce QR code et collez-le sur le sac de poissons. Les clients pourront le scanner avec leur téléphone pour accéder au certificat de traçabilité complet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

