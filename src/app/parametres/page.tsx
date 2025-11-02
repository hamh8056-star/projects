"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Edit, Database, Lock, RefreshCcw, Settings, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui";

export default function ParametresPage() {
  // States pour chaque section
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showUri, setShowUri] = useState(false);
  const [showEditUri, setShowEditUri] = useState(false);
  const [feedback, setFeedback] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  // Password form
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  // Mongo URI
  const [mongoUri, setMongoUri] = useState<string>("...");
  const [editUri, setEditUri] = useState(mongoUri);

  // Logique floue - paramètres par défaut
  const [fuzzyParams, setFuzzyParams] = useState({
    temperature: {
      min: 18,
      max: 30,
      warning_low: 20,
      warning_high: 28,
      critical_low: 18,
      critical_high: 30
    },
    ph: {
      min: 6.5,
      max: 8.5,
      warning_low: 7.0,
      warning_high: 8.0,
      critical_low: 6.5,
      critical_high: 8.5
    },
    oxygen: {
      min: 4,
      max: 12,
      warning_low: 5,
      warning_high: 10,
      critical_low: 4,
      critical_high: 12
    },
    salinity: {
      min: 25,
      max: 35,
      warning_low: 28,
      warning_high: 32,
      critical_low: 25,
      critical_high: 35
    },
    turbidity: {
      min: 0,
      max: 50,
      warning_low: 5,
      warning_high: 30,
      critical_low: 0,
      critical_high: 50
    }
  });

  const [showFuzzyModal, setShowFuzzyModal] = useState(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parametres/mongodb-uri")
      .then(res => res.json())
      .then(data => {
        if (data.uri) {
          setMongoUri(data.uri);
          setEditUri(data.uri);
        }
      });

    // Charger la configuration de logique floue
    fetch("/api/parametres/fuzzy-logic")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setFuzzyParams(data.config);
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement de la configuration floue:', error);
      });
  }, []);

  // Handlers
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    if (newPwd !== confirmPwd) {
      setFeedback("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/utilisateurs/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || "Erreur lors du changement de mot de passe");
        setLoading(false);
        return;
      }
      setFeedback("Mot de passe changé avec succès !");
      setShowPwdModal(false);
      setOldPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch {
      setFeedback("Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUri = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    setTimeout(() => {
      setMongoUri(editUri);
      setFeedback("URI MongoDB modifiée avec succès !");
      setLoading(false);
      setShowEditUri(false);
    }, 1000);
  };

  const handleResetDb = async () => {
    setLoading(true);
    setFeedback(null);
    setTimeout(() => {
      setFeedback("Base de données réinitialisée !");
      setLoading(false);
      setShowDbModal(false);
    }, 1200);
  };

  // Fonctions pour la logique floue
  const handleEditFuzzyParam = (paramName: string) => {
    setEditingParam(paramName);
    setShowFuzzyModal(true);
  };

  const handleSaveFuzzyParam = async (paramName: string, newValues: any) => {
    try {
      setLoading(true);
      const updatedConfig = {
        ...fuzzyParams,
        [paramName]: newValues
      };

      const response = await fetch("/api/parametres/fuzzy-logic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config: updatedConfig }),
      });

      const data = await response.json();

      if (data.success) {
        setFuzzyParams(updatedConfig);
        setFeedback(`Paramètres ${getParamDisplayName(paramName)} mis à jour avec succès !`);
        setShowFuzzyModal(false);
        setEditingParam(null);
      } else {
        setFeedback("Erreur lors de la sauvegarde des paramètres");
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setFeedback("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const getParamDisplayName = (paramName: string) => {
    const names = {
      temperature: 'Température',
      ph: 'pH',
      oxygen: 'Oxygène',
      salinity: 'Salinité',
      turbidity: 'Turbidité'
    };
    return names[paramName as keyof typeof names] || paramName;
  };

  const getParamUnit = (paramName: string) => {
    const units = {
      temperature: '°C',
      ph: '',
      oxygen: 'mg/L',
      salinity: 'ppt',
      turbidity: 'NTU'
    };
    return units[paramName as keyof typeof units] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <header className="w-full max-w-5xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="text-cyan-500 w-8 h-8" />
          <h1 className="text-3xl font-bold text-cyan-800 drop-shadow-sm">Paramètres</h1>
        </div>
        <p className="text-gray-600 text-lg">Gérez la sécurité, la base de données et les options avancées de votre application.</p>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-8 px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section Base de données */}
          <Card className="p-10 bg-white/95 shadow-lg border border-cyan-100 rounded-2xl flex flex-col gap-8 min-w-0">
            <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-700 mb-1"><Database className="text-cyan-400" /> Base de données</h2>
            <p className="text-gray-600 text-sm mb-4">Gérez la connexion à la base MongoDB et les opérations critiques.</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">URI MongoDB :</span>
              <span className="text-gray-600 select-all font-mono">
                {showUri ? mongoUri : "••••••••••••••"}
              </span>
              <button onClick={() => setShowUri(v => !v)} className="ml-1 text-xs text-cyan-600 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded">
                {showUri ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button onClick={() => { setEditUri(mongoUri); setShowEditUri(true); }} className="ml-1 text-xs text-cyan-600 hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded">
                <Edit size={16} /> Modifier
              </button>
            </div>
            <button
              onClick={() => setShowDbModal(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 shadow focus:outline-none focus:ring-2 focus:ring-red-400 w-full justify-center text-base"
            >
              <RefreshCcw size={20} /> Réinitialiser la base de données
            </button>
          </Card>
        </div>

        {/* Section Logique Floue */}
        <Card className="p-10 bg-white/95 shadow-lg border border-cyan-100 rounded-2xl">
          <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-700 mb-6">
            <SlidersHorizontal className="text-cyan-400" /> Configuration de la Logique Floue
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Configurez les seuils d'alerte pour chaque paramètre aquacole. La logique floue génère des alertes intelligentes basées sur ces seuils.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(fuzzyParams).map(([paramName, values]) => (
              <div key={paramName} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    {paramName === 'temperature' && '🌡️'}
                    {paramName === 'ph' && '🧪'}
                    {paramName === 'oxygen' && '💧'}
                    {paramName === 'salinity' && '🧂'}
                    {paramName === 'turbidity' && '🌫️'}
                    {getParamDisplayName(paramName)}
                  </h3>
                  <button
                    onClick={() => handleEditFuzzyParam(paramName)}
                    className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                  >
                    <Edit size={16} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Normal:</span>
                    <span className="font-medium">
                      {values.warning_low} - {values.warning_high} {getParamUnit(paramName)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Avertissement:</span>
                    <span className="font-medium text-yellow-600">
                      {values.critical_low} - {values.critical_high} {getParamUnit(paramName)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Critique:</span>
                    <span className="font-medium text-red-600">
                      &lt; {values.critical_low} ou &gt; {values.critical_high} {getParamUnit(paramName)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
      {/* Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 bg-cyan-700 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in flex items-center gap-4">
          <span>{feedback}</span>
          <button className="ml-2 text-xs underline" onClick={() => setFeedback(null)}>Fermer</button>
        </div>
      )}
      {/* Modals */}
      {showEditUri && (
        <Modal onClose={() => setShowEditUri(false)}>
          <form onSubmit={handleEditUri} className="space-y-6">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-cyan-700"><Edit className="text-cyan-400" /> Modifier l'URI MongoDB</h3>
            <input type="text" className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-400 font-mono" value={editUri} onChange={e => setEditUri(e.target.value)} required />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" onClick={() => setShowEditUri(false)}>Annuler</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-semibold shadow" disabled={loading}>{loading ? "..." : "Valider"}</button>
            </div>
          </form>
        </Modal>
      )}
      {showDbModal && (
        <Modal onClose={() => setShowDbModal(false)}>
          <div className="space-y-6">
            <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2"><RefreshCcw /> Confirmer la réinitialisation</h3>
            <p>Cette action va supprimer toutes les données et réinitialiser la base. Êtes-vous sûr ?</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" onClick={() => setShowDbModal(false)}>Annuler</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow" onClick={handleResetDb} disabled={loading}>{loading ? "..." : "Oui, réinitialiser"}</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Modal Configuration Logique Floue */}
      {showFuzzyModal && editingParam && (
        <FuzzyConfigModal
          paramName={editingParam}
          paramValues={fuzzyParams[editingParam as keyof typeof fuzzyParams]}
          onSave={(newValues) => handleSaveFuzzyParam(editingParam, newValues)}
          onClose={() => {
            setShowFuzzyModal(false);
            setEditingParam(null);
          }}
          unit={getParamUnit(editingParam)}
          displayName={getParamDisplayName(editingParam)}
        />
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cyan-200/80 via-blue-200/80 to-blue-100/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
        {children}
      </div>
    </div>
  );
}

function FuzzyConfigModal({ paramName, paramValues, onSave, onClose, unit, displayName }: {
  paramName: string;
  paramValues: any;
  onSave: (newValues: any) => void;
  onClose: () => void;
  unit: string;
  displayName: string;
}) {
  const [values, setValues] = useState(paramValues);

  const handleSave = () => {
    onSave(values);
  };

  const updateValue = (field: string, value: number) => {
    setValues((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cyan-200/80 via-blue-200/80 to-blue-100/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-cyan-700">
          {paramName === 'temperature' && '🌡️'}
          {paramName === 'ph' && '🧪'}
          {paramName === 'oxygen' && '💧'}
          {paramName === 'salinity' && '🧂'}
          {paramName === 'turbidity' && '🌫️'}
          Configuration {displayName}
        </h3>
        
        <div className="space-y-6">
          {/* Seuils d'avertissement */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 border-b pb-2">Seuils d'avertissement (Zone jaune)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seuil bas {unit}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={values.warning_low}
                  onChange={(e) => updateValue('warning_low', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seuil haut {unit}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={values.warning_high}
                  onChange={(e) => updateValue('warning_high', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Seuils critiques */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 border-b pb-2">Seuils critiques (Zone rouge)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seuil bas {unit}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={values.critical_low}
                  onChange={(e) => updateValue('critical_low', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seuil haut {unit}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={values.critical_high}
                  onChange={(e) => updateValue('critical_high', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Aperçu des zones */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Aperçu des zones d'alerte</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-600 font-medium">🔴 Critique:</span>
                <span className="text-red-600">
                  &lt; {values.critical_low} ou &gt; {values.critical_high} {unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600 font-medium">🟡 Avertissement:</span>
                <span className="text-yellow-600">
                  {values.critical_low} - {values.warning_low} ou {values.warning_high} - {values.critical_high} {unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 font-medium">🟢 Normal:</span>
                <span className="text-green-600">
                  {values.warning_low} - {values.warning_high} {unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" 
            onClick={onClose}
          >
            Annuler
          </button>
          <button 
            type="button" 
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-semibold shadow" 
            onClick={handleSave}
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
} 