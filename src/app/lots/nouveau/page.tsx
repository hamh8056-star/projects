"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Bassin {
  _id: string;
  nom: string;
}

export default function NouveauLotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bassins, setBassins] = useState<Bassin[]>([]);
  const [loadingBassins, setLoadingBassins] = useState(true);
  
  const [formData, setFormData] = useState({
    nom: "",
    espece: "",
    quantite: 0,
    bassinId: "",
    stade: "alevin",
    poidsMoyen: 0,
    tailleMoyenne: 0
  });
  
  // Récupérer la liste des bassins
  useEffect(() => {
    const fetchBassins = async () => {
      try {
        const response = await fetch("/api/bassins");
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les bassins");
        }
        
        const data = await response.json();
        setBassins(data);
        setLoadingBassins(false);
      } catch (err) {
        console.error("Erreur lors du chargement des bassins:", err);
        setLoadingBassins(false);
      }
    };
    
    fetchBassins();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "quantite" || name === "poidsMoyen" || name === "tailleMoyenne" 
        ? parseFloat(value) || 0 
        : value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création du lot");
      }
      
      const data = await response.json();
      router.push(`/lots/${data._id}`);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la création du lot");
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <Link 
          href="/lots" 
          className="text-cyan-600 hover:text-cyan-800 flex items-center gap-1 mb-2 w-fit"
        >
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Nouveau lot</h1>
        <p className="text-gray-600">Créez un nouveau lot pour suivre sa traçabilité</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du lot *
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Ex: Tilapia-2023-A1"
              />
            </div>
            
            <div>
              <label htmlFor="espece" className="block text-sm font-medium text-gray-700 mb-1">
                Espèce *
              </label>
              <input
                type="text"
                id="espece"
                name="espece"
                value={formData.espece}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Ex: Tilapia"
              />
            </div>
            
            <div>
              <label htmlFor="quantite" className="block text-sm font-medium text-gray-700 mb-1">
                Quantité *
              </label>
              <input
                type="number"
                id="quantite"
                name="quantite"
                value={formData.quantite}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Nombre de poissons"
              />
            </div>
            
            <div>
              <label htmlFor="bassinId" className="block text-sm font-medium text-gray-700 mb-1">
                Bassin *
              </label>
              <select
                id="bassinId"
                name="bassinId"
                value={formData.bassinId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                disabled={loadingBassins}
              >
                <option value="">Sélectionner un bassin</option>
                {bassins.map((bassin) => (
                  <option key={bassin._id} value={bassin._id}>
                    {bassin.nom}
                  </option>
                ))}
              </select>
              {loadingBassins && (
                <p className="text-xs text-gray-500 mt-1">Chargement des bassins...</p>
              )}
            </div>
            
            <div>
              <label htmlFor="stade" className="block text-sm font-medium text-gray-700 mb-1">
                Stade de développement
              </label>
              <select
                id="stade"
                name="stade"
                value={formData.stade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="alevin">Alevin</option>
                <option value="juvenile">Juvénile</option>
                <option value="adulte">Adulte</option>
                <option value="reproducteur">Reproducteur</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="poidsMoyen" className="block text-sm font-medium text-gray-700 mb-1">
                Poids moyen (g)
              </label>
              <input
                type="number"
                id="poidsMoyen"
                name="poidsMoyen"
                value={formData.poidsMoyen}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Poids moyen en grammes"
              />
            </div>
            
            <div>
              <label htmlFor="tailleMoyenne" className="block text-sm font-medium text-gray-700 mb-1">
                Taille moyenne (cm)
              </label>
              <input
                type="number"
                id="tailleMoyenne"
                name="tailleMoyenne"
                value={formData.tailleMoyenne}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Taille moyenne en centimètres"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-8">
            <Link
              href="/lots"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Création en cours...
                </>
              ) : (
                <>
                  <Save size={18} /> Créer le lot
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 