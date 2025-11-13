"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPublicUrl } from "@/lib/publicUrl";

interface Lot {
  _id: string;
  nom: string;
  espece: string;
  quantite: number;
  dateCreation: string;
  dateRecolte?: string;
  bassinId: string;
  bassinNom: string;
  stade: string;
  statut: string;
  poidsMoyen: number;
  tailleMoyenne: number;
  creePar: string;
  historiqueBassin: Array<{
    bassinId: string;
    bassinNom: string;
    dateDebut: string;
    dateFin: string | null;
  }>;
  statistiques: {
    temperature: { min: number | null; max: number | null; moyenne: number | null };
    ph: { min: number | null; max: number | null; moyenne: number | null };
    oxygene: { min: number | null; max: number | null; moyenne: number | null };
    salinite: { min: number | null; max: number | null; moyenne: number | null };
    turbidite: { min: number | null; max: number | null; moyenne: number | null };
  };
  evenements: Array<{
    type: string;
    description: string;
    date: string;
    utilisateur: string;
  }>;
  etatSante: string;
  qrCodeGenere: boolean;
  qrCodeUrl?: string;
}

export default function LotDetailPage() {
  const params = useParams();
  const lotId = params.id as string;
  const router = useRouter();
  
  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ qrCodeImage: string; qrCodeUrl: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [nouvelEvenement, setNouvelEvenement] = useState({ type: "", description: "" });
  const [showEvenementModal, setShowEvenementModal] = useState(false);
  
  // Récupérer les détails du lot
  useEffect(() => {
    const fetchLot = async () => {
      try {
        const response = await fetch(`/api/lots/${lotId}`);
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les informations du lot");
        }
        
        const data = await response.json();
        setLot(data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des données");
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchLot();
  }, [lotId]);
  
  // Générer un QR code
  const generateQRCode = async () => {
    setQrLoading(true);
    setShowQRModal(true);
    
    try {
      const response = await fetch(`/api/lots/${lotId}/qrcode`);
      
      if (!response.ok) {
        throw new Error("Impossible de générer le QR code");
      }
      
      const data = await response.json();
      setQrCodeData(data);
      
      // Mettre à jour l'état du lot
      if (lot) {
        setLot({ ...lot, qrCodeGenere: true, qrCodeUrl: data.qrCodeUrl });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQrLoading(false);
    }
  };
  
  // Ajouter un événement
  const ajouterEvenement = async () => {
    if (!nouvelEvenement.type || !nouvelEvenement.description) {
      return;
    }
    
    try {
      const response = await fetch(`/api/lots/${lotId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nouvelEvenement: {
            type: nouvelEvenement.type,
            description: nouvelEvenement.description,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error("Impossible d'ajouter l'événement");
      }
      
      const lotMisAJour = await response.json();
      setLot(lotMisAJour);
      setNouvelEvenement({ type: "", description: "" });
      setShowEvenementModal(false);
    } catch (err) {
      console.error(err);
    }
  };
  
  // Marquer comme récolté
  const marquerRecolte = async () => {
    if (!lot || lot.statut === "recolte") return;
    
    try {
      const response = await fetch(`/api/lots/${lotId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statut: "recolte",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Impossible de marquer le lot comme récolté");
      }
      
      const lotMisAJour = await response.json();
      setLot(lotMisAJour);
    } catch (err) {
      console.error(err);
    }
  };
  
  // Formater les dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  // Formater les valeurs numériques
  const formatNumber = (value: number | null) => {
    if (value === null) return "N/A";
    return value.toFixed(2);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    );
  }
  
  if (error || !lot) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h1>
            <p className="text-gray-600">{error || "Ce lot n'existe pas ou n'est plus disponible."}</p>
            <button
              onClick={() => router.push("/lots")}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/lots" className="text-blue-500 hover:underline mb-2 inline-block">
            &larr; Retour à la liste
          </Link>
          <h1 className="text-2xl font-bold">{lot.nom}</h1>
          <p className="text-gray-500">ID: {lot._id}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => generateQRCode()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {lot.qrCodeGenere ? "Voir QR Code" : "Générer QR Code"}
          </button>
          {lot.statut !== "recolte" && (
            <button
              onClick={() => marquerRecolte()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Marquer comme récolté
            </button>
          )}
          <button
            onClick={() => setShowEvenementModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
          >
            Ajouter événement
          </button>
          <Link href={`/lots/${lotId}/edit`} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
            Modifier
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">Espèce</p>
              <p className="font-medium">{lot.espece}</p>
            </div>
            <div>
              <p className="text-gray-500">Quantité</p>
              <p className="font-medium">{lot.quantite} poissons</p>
            </div>
            <div>
              <p className="text-gray-500">Stade</p>
              <p className="font-medium">{lot.stade}</p>
            </div>
            <div>
              <p className="text-gray-500">Statut</p>
              <p className="font-medium">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  lot.statut === "actif" ? "bg-green-100 text-green-800" : 
                  lot.statut === "recolte" ? "bg-blue-100 text-blue-800" : 
                  "bg-gray-100 text-gray-800"
                }`}>
                  {lot.statut}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-500">Poids moyen</p>
              <p className="font-medium">{lot.poidsMoyen} g</p>
            </div>
            <div>
              <p className="text-gray-500">Taille moyenne</p>
              <p className="font-medium">{lot.tailleMoyenne} cm</p>
            </div>
            <div>
              <p className="text-gray-500">Date de création</p>
              <p className="font-medium">{formatDate(lot.dateCreation)}</p>
            </div>
            {lot.dateRecolte && (
              <div>
                <p className="text-gray-500">Date de récolte</p>
                <p className="font-medium">{formatDate(lot.dateRecolte)}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Bassin actuel</p>
              <p className="font-medium">{lot.bassinNom}</p>
            </div>
            <div>
              <p className="text-gray-500">État de santé</p>
              <p className="font-medium">{lot.etatSante}</p>
            </div>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Statistiques de l'eau</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Température (°C)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Minimum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.temperature.min)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Moyenne</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.temperature.moyenne)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Maximum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.temperature.max)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">pH</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Minimum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.ph.min)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Moyenne</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.ph.moyenne)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Maximum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.ph.max)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Oxygène (mg/L)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Minimum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.oxygene.min)}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Moyenne</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.oxygene.moyenne)}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Maximum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.oxygene.max)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Salinité (g/L)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Minimum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.salinite.min)}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Moyenne</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.salinite.moyenne)}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Maximum</p>
                  <p className="text-lg font-medium">{formatNumber(lot.statistiques.salinite.max)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Historique des bassins */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Historique des bassins</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">Bassin</th>
                <th className="py-2 px-4 border-b text-left">Date début</th>
                <th className="py-2 px-4 border-b text-left">Date fin</th>
                <th className="py-2 px-4 border-b text-left">Durée</th>
              </tr>
            </thead>
            <tbody>
              {lot.historiqueBassin.map((historique, index) => {
                const dateDebut = new Date(historique.dateDebut);
                const dateFin = historique.dateFin ? new Date(historique.dateFin) : new Date();
                const dureeJours = Math.floor((dateFin.getTime() - dateDebut.getTime()) / (1000 * 3600 * 24));
                
                return (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="py-2 px-4 border-b">{historique.bassinNom}</td>
                    <td className="py-2 px-4 border-b">{formatDate(historique.dateDebut)}</td>
                    <td className="py-2 px-4 border-b">
                      {historique.dateFin ? formatDate(historique.dateFin) : "En cours"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {dureeJours} jour{dureeJours > 1 ? "s" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Événements */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-800">Événements</h2>
          <button
            onClick={() => setShowEvenementModal(true)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
          >
            + Ajouter
          </button>
        </div>
        
        {lot.evenements && lot.evenements.length > 0 ? (
          <div className="space-y-4">
            {lot.evenements.map((evenement, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between">
                  <p className="font-medium">{evenement.type}</p>
                  <p className="text-sm text-gray-500">{formatDate(evenement.date)}</p>
                </div>
                <p className="text-gray-700">{evenement.description}</p>
                <p className="text-xs text-gray-500 mt-1">Par: {evenement.utilisateur}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Aucun événement enregistré pour ce lot.</p>
        )}
      </div>
      
      {/* Modal QR Code */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">QR Code de traçabilité</h2>
              <button
                onClick={() => {
                  setShowQRModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            {qrLoading ? (
              <div className="text-center py-8">
                <div className="spinner h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Génération du QR code...</p>
              </div>
            ) : qrCodeData ? (
              <div className="text-center">
                <div className="mb-4">
                  <img 
                    src={qrCodeData.qrCodeImage} 
                    alt="QR Code" 
                    className="mx-auto border p-2"
                    width={200}
                    height={200}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Ce QR code permet d'accéder à toutes les informations de traçabilité du lot.
                </p>
                <div className="flex justify-between">
                  <a
                    href={qrCodeData.qrCodeImage}
                    download={`qrcode-lot-${lotId}.png`}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    Télécharger
                  </a>
                  <a
                    href={`${getPublicUrl(true)}/public/tracabilite/${lotId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    Tester le lien
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-500">Erreur lors de la génération du QR code</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal Événement */}
      {showEvenementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ajouter un événement</h2>
              <button
                onClick={() => setShowEvenementModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'événement
                </label>
                <select
                  id="type"
                  value={nouvelEvenement.type}
                  onChange={(e) => setNouvelEvenement({ ...nouvelEvenement, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="Alimentation">Alimentation</option>
                  <option value="Traitement">Traitement</option>
                  <option value="Maladie">Maladie</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={nouvelEvenement.description}
                  onChange={(e) => setNouvelEvenement({ ...nouvelEvenement, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Décrivez l'événement..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowEvenementModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={ajouterEvenement}
                  disabled={!nouvelEvenement.type || !nouvelEvenement.description}
                  className={`px-4 py-2 bg-blue-500 text-white rounded transition ${
                    !nouvelEvenement.type || !nouvelEvenement.description
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-600"
                  }`}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 