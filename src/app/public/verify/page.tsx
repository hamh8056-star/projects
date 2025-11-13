"use client";

import { useState } from "react";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Fish, 
  Shield,
  AlertCircle,
  Loader2,
  ArrowRight,
  Award
} from "lucide-react";
import { getPublicUrl } from "@/lib/publicUrl";

interface LotData {
  _id: string;
  nom: string;
  espece: string;
  quantite: number;
  dateCreation: string;
  stade: string;
  statut: string;
  poidsMoyen?: number;
  tailleMoyenne?: number;
  bassinNom?: string;
  qrCodeGenere?: boolean;
}

export default function VerifyPage() {
  const [lotId, setLotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lot, setLot] = useState<LotData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lotId.trim()) {
      setError("Veuillez saisir un ID de certificat");
      return;
    }

    setLoading(true);
    setError(null);
    setLot(null);

    try {
      const response = await fetch(`/api/lots/public/${lotId.trim()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Certificat non trouvé. Veuillez vérifier l'ID saisi.");
        } else {
          setError("Erreur lors de la vérification du certificat");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLot(data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue lors de la vérification");
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non spécifiée";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const traduireStade = (stade: string) => {
    const traductions: { [key: string]: string } = {
      alevin: "Alevin",
      juvenile: "Juvénile",
      adulte: "Adulte",
      reproducteur: "Reproducteur"
    };
    return traductions[stade] || stade;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* En-tête */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-8 px-4 md:px-8 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Vérification de Certificat</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Vérifiez l'authenticité d'un certificat AquaAI en saisissant son identifiant unique.
          </p>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {/* Formulaire de vérification */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="lotId" className="block text-sm font-medium text-gray-700 mb-2">
                ID du certificat
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="lotId"
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  placeholder="Ex: 691217d28a3b4aa6987b27a2"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      Vérifier
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Saisissez l'ID du certificat que vous souhaitez vérifier
              </p>
            </div>
          </form>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Erreur de vérification</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Résultat de vérification - Certificat valide */}
        {lot && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* En-tête de succès */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Certificat Authentique</h2>
                  <p className="text-green-100">Ce certificat a été vérifié et est valide</p>
                </div>
              </div>
            </div>

            {/* Informations du certificat */}
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="text-blue-500" size={24} />
                  <h3 className="text-xl font-bold text-gray-800">Informations du Certificat</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ID du certificat</p>
                      <p className="font-mono text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded">
                        {lot._id}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nom du lot</p>
                      <p className="font-medium text-gray-800">{lot.nom}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Espèce</p>
                      <p className="font-medium text-gray-800">{lot.espece}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Quantité</p>
                      <p className="font-medium text-gray-800">{lot.quantite} poissons</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Stade de développement</p>
                      <p className="font-medium text-gray-800">{traduireStade(lot.stade)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date de création</p>
                      <p className="font-medium text-gray-800">{formatDate(lot.dateCreation)}</p>
                    </div>
                    
                    {lot.bassinNom && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Bassin d'élevage</p>
                        <p className="font-medium text-gray-800">{lot.bassinNom}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Statut</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        lot.statut === 'recolte' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lot.statut === 'recolte' ? 'Récolté' : 'En cours'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex flex-wrap gap-4">
                  <a
                    href={`${getPublicUrl(true)}/public/tracabilite/${lot._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-2"
                  >
                    Voir le certificat complet
                    <ArrowRight size={18} />
                  </a>
                  
                  <button
                    onClick={() => {
                      setLot(null);
                      setLotId("");
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Vérifier un autre certificat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section d'aide */}
        {!lot && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-blue-800 font-semibold mb-2">Comment trouver l'ID du certificat ?</h3>
                <ul className="text-blue-700 space-y-2 text-sm">
                  <li>• L'ID se trouve sur le certificat PDF que vous avez reçu</li>
                  <li>• Vous pouvez également le scanner via le QR code sur le certificat</li>
                  <li>• L'ID est un code unique de 24 caractères (ex: 691217d28a3b4aa6987b27a2)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <Fish size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">AquaAI</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Système de traçabilité et certification aquacole
          </p>
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} AquaAI - Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}

