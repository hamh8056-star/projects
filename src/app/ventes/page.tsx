"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Package,
  DollarSign,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Save
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface Vente {
  _id: string;
  lotId: string;
  lot?: {
    _id: string;
    nom: string;
    espece: string;
  };
  quantite: number;
  dateVente: string;
  distributeurId: string;
  client?: {
    nom: string;
    email?: string;
    telephone?: string;
  };
  prixUnitaire: number;
  prixTotal: number;
  statut: string;
  notes?: string;
  createdAt: string;
}

interface Lot {
  _id: string;
  nom: string;
  espece: string;
  quantite: number;
  statut: string;
}

export default function VentesPage() {
  const { data: session } = useSession();
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<string>("");
  const [quantite, setQuantite] = useState<number>(1);
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [clientNom, setClientNom] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientTelephone, setClientTelephone] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clients, setClients] = useState<any[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Actions
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [venteToDelete, setVenteToDelete] = useState<Vente | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Protection accès : seuls les distributeurs peuvent accéder
  if (session && session.user?.role !== "distributeur") {
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

  // Charger les ventes, lots et clients
  useEffect(() => {
    fetchVentes();
    fetchLotsAndClients();
  }, [page]);

  const fetchLotsAndClients = async () => {
    try {
      const [lotsRes, clientsRes] = await Promise.all([
        fetch("/api/lots"),
        fetch("/api/clients")
      ]);

      if (!lotsRes.ok || !clientsRes.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const lotsData = await lotsRes.json();
      const clientsData = await clientsRes.json();
      
      setClients(clientsData);
      
      // Filtrer les lots disponibles pour la vente (quantité > 0 et statut approprié)
      const lotsDisponibles = lotsData.filter((lot: Lot) => {
        const quantiteValide = lot.quantite > 0;
        const statutValide = 
          lot.statut === "actif" || 
          lot.statut === "prêt à vendre" || 
          lot.statut === "disponible" ||
          lot.statut === "en cours" ||
          !lot.statut; // Si pas de statut, on l'inclut quand même
        return quantiteValide && statutValide;
      });
      setLots(lotsDisponibles);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    }
  };

  const fetchVentes = async () => {
    setLoading(true);
    try {
      const ventesRes = await fetch(`/api/ventes?page=${page}&limit=${limit}`);
      
      if (!ventesRes.ok) {
        throw new Error("Erreur lors du chargement des ventes");
      }

      const data = await ventesRes.json();
      
        setVentes(data.ventes || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
        setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      setLoading(false);
      console.error(err);
    }
  };

  // Toast auto-disparition
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Créer une vente
  const handleCreateVente = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Si un client est sélectionné, utiliser ses informations
      let client = null;
      if (selectedClientId) {
        const selectedClient = clients.find(c => c._id === selectedClientId);
        if (selectedClient) {
          client = {
            nom: selectedClient.nom,
            email: selectedClient.email || undefined,
            telephone: selectedClient.telephone || undefined
          };
        }
      } else if (clientNom) {
        // Sinon, utiliser les informations saisies manuellement
        client = {
          nom: clientNom,
          email: clientEmail || undefined,
          telephone: clientTelephone || undefined
        };
      }

      const response = await fetch("/api/ventes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: selectedLot,
          quantite,
          prixUnitaire,
          client,
          notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de la vente");
      }

      const newVente = await response.json();
      setVentes([newVente, ...ventes]);
      setToast({ type: "success", message: "Vente enregistrée avec succès!" });
      
      // Réinitialiser le formulaire
      setShowAddModal(false);
      setSelectedLot("");
      setQuantite(1);
      setPrixUnitaire(0);
      setSelectedClientId("");
      setClientNom("");
      setClientEmail("");
      setClientTelephone("");
      setNotes("");

      // Recharger les lots pour mettre à jour les quantités
      const lotsRes = await fetch("/api/lots");
      if (lotsRes.ok) {
        const lotsData = await lotsRes.json();
        // Filtrer les lots disponibles pour la vente (quantité > 0 et statut approprié)
        const lotsDisponibles = lotsData.filter((lot: Lot) => {
          const quantiteValide = lot.quantite > 0;
          const statutValide = 
            lot.statut === "actif" || 
            lot.statut === "prêt à vendre" || 
            lot.statut === "disponible" ||
            lot.statut === "en cours" ||
            !lot.statut; // Si pas de statut, on l'inclut quand même
          return quantiteValide && statutValide;
        });
        setLots(lotsDisponibles);
      }
    } catch (err: any) {
      setError(err.message);
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrer les ventes (filtrage côté client pour la recherche)
  const filteredVentes = ventes.filter(vente => {
    const matchesSearch = 
      !search ||
      vente.lot?.nom.toLowerCase().includes(search.toLowerCase()) ||
      vente.lot?.espece.toLowerCase().includes(search.toLowerCase()) ||
      vente.client?.nom.toLowerCase().includes(search.toLowerCase()) ||
      vente._id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatut = !filterStatut || vente.statut === filterStatut;
    
    return matchesSearch && matchesStatut;
  });

  // Calculer les statistiques (sur toutes les ventes, pas seulement la page actuelle)
  const totalVentes = pagination.total;
  const totalQuantite = filteredVentes.reduce((sum, v) => sum + v.quantite, 0);
  const totalRevenus = filteredVentes.reduce((sum, v) => sum + v.prixTotal, 0);
  
  // Ouvrir modal de détails
  const handleViewDetails = async (venteId: string) => {
    try {
      const response = await fetch(`/api/ventes/${venteId}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const vente = await response.json();
      setSelectedVente(vente);
      setShowDetailModal(true);
    } catch (err: any) {
      setToast({ type: "error", message: err.message });
    }
  };
  
  // Ouvrir modal d'édition
  const handleOpenEdit = (vente: Vente) => {
    setSelectedVente(vente);
    setSelectedLot(vente.lotId);
    setQuantite(vente.quantite);
    setPrixUnitaire(vente.prixUnitaire || 0);
    setClientNom(vente.client?.nom || "");
    setClientEmail(vente.client?.email || "");
    setClientTelephone(vente.client?.telephone || "");
    setNotes(vente.notes || "");
    setSelectedClientId("");
    setShowEditModal(true);
  };
  
  // Mettre à jour une vente
  const handleUpdateVente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVente) return;
    
    setSubmitting(true);
    setError(null);

    try {
      // Si un client est sélectionné, utiliser ses informations
      let client = null;
      if (selectedClientId) {
        const selectedClient = clients.find(c => c._id === selectedClientId);
        if (selectedClient) {
          client = {
            nom: selectedClient.nom,
            email: selectedClient.email || undefined,
            telephone: selectedClient.telephone || undefined
          };
        }
      } else if (clientNom) {
        client = {
          nom: clientNom,
          email: clientEmail || undefined,
          telephone: clientTelephone || undefined
        };
      }

      const response = await fetch(`/api/ventes/${selectedVente._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: selectedLot,
          quantite,
          prixUnitaire,
          client,
          notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      setToast({ type: "success", message: "Vente mise à jour avec succès!" });
      setShowEditModal(false);
      setSelectedVente(null);
      
      // Recharger les données
      await fetchVentes();
      await fetchLotsAndClients();
    } catch (err: any) {
      setError(err.message);
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Ouvrir modal de confirmation de suppression
  const handleOpenDeleteModal = (vente: Vente) => {
    setVenteToDelete(vente);
    setShowDeleteModal(true);
  };

  // Confirmer et supprimer une vente
  const handleConfirmDelete = async () => {
    if (!venteToDelete) return;

    setDeletingId(venteToDelete._id);

    try {
      const response = await fetch(`/api/ventes/${venteToDelete._id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      setToast({ type: "success", message: "Vente supprimée avec succès!" });
      setShowDeleteModal(false);
      setVenteToDelete(null);
      
      // Recharger les données
      await fetchVentes();
      await fetchLotsAndClients();
      
      // Si on était sur la dernière page et qu'elle est maintenant vide, revenir à la page précédente
      if (ventes.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err: any) {
      setToast({ type: "error", message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Ventes</h1>
              <p className="text-gray-600">Enregistrez et suivez vos ventes</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Vente
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Ventes</p>
                <p className="text-2xl font-bold text-gray-900">{totalVentes}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Quantité Vendue</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuantite}</p>
                <p className="text-xs text-gray-500">unités</p>
              </div>
              <Package className="w-10 h-10 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenus Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalRevenus.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-gray-500">DA</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par lot, espèce, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Tous les statuts</option>
                <option value="completee">Complétée</option>
                <option value="en_attente">En attente</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Liste des ventes */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Historique des Ventes</h2>
          
          {filteredVentes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
              <p>Aucune vente trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lot</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Espèce</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantité</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Prix Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVentes.map((vente) => (
                    <tr key={vente._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(vente.dateVente || vente.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {vente.lot?.nom || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {vente.lot?.espece || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {vente.quantite}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {vente.client?.nom || (
                          <span className="text-gray-400">Non spécifié</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        {vente.prixTotal.toLocaleString('fr-FR')} DA
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vente.statut === "completee" 
                            ? "bg-green-100 text-green-700"
                            : vente.statut === "en_attente"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {vente.statut === "completee" ? "Complétée" : 
                           vente.statut === "en_attente" ? "En attente" : "Annulée"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(vente._id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(vente)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(vente)}
                            disabled={deletingId === vente._id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingId === vente._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Affichage de {(page - 1) * limit + 1} à {Math.min(page * limit, pagination.total)} sur {pagination.total} ventes
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          page === pageNum
                            ? "bg-blue-500 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Modal Ajouter Vente */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Nouvelle Vente</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateVente} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lot *
                    </label>
                    <select
                      value={selectedLot}
                      onChange={(e) => {
                        setSelectedLot(e.target.value);
                        const lot = lots.find(l => l._id === e.target.value);
                        if (lot) {
                          setQuantite(Math.min(quantite, lot.quantite));
                        }
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un lot</option>
                      {lots.map((lot) => (
                        <option key={lot._id} value={lot._id}>
                          {lot.nom} - {lot.espece} ({lot.quantite} disponibles)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={lots.find(l => l._id === selectedLot)?.quantite || 1}
                        value={quantite}
                        onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix Unitaire (DA)
                    </label>
                      <input
                        type="number"
                        min="0"
                        value={prixUnitaire}
                        onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {prixUnitaire > 0 && quantite > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Prix Total:</strong> {(prixUnitaire * quantite).toLocaleString('fr-FR')} DA
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client (optionnel)
                    </label>
                    <div className="space-y-3">
                      <select
                        value={selectedClientId}
                        onChange={(e) => {
                          setSelectedClientId(e.target.value);
                          if (e.target.value) {
                            const selectedClient = clients.find(c => c._id === e.target.value);
                            if (selectedClient) {
                              setClientNom(selectedClient.nom || "");
                              setClientEmail(selectedClient.email || "");
                              setClientTelephone(selectedClient.telephone || "");
                            }
                          } else {
                            setClientNom("");
                            setClientEmail("");
                            setClientTelephone("");
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un client existant</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.nom} {client.telephone ? `- ${client.telephone}` : ""}
                          </option>
                        ))}
                      </select>
                      
                      <div className="text-center text-sm text-gray-500">ou</div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Nom du client"
                          value={clientNom}
                          onChange={(e) => {
                            setClientNom(e.target.value);
                            setSelectedClientId(""); // Désélectionner le client si on saisit manuellement
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="email"
                            placeholder="Email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="tel"
                            placeholder="Téléphone"
                            value={clientTelephone}
                            onChange={(e) => setClientTelephone(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Link
                          href="/clients"
                          className="text-sm text-blue-600 hover:text-blue-700"
                          target="_blank"
                        >
                          + Gérer les clients
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Notes supplémentaires..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Enregistrer la vente
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Voir Détails */}
        {showDetailModal && selectedVente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Détails de la Vente</h2>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedVente(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de vente</label>
                      <p className="text-gray-900">{formatDate(selectedVente.dateVente || selectedVente.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedVente.statut === "completee" 
                          ? "bg-green-100 text-green-700"
                          : selectedVente.statut === "en_attente"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {selectedVente.statut === "completee" ? "Complétée" : 
                         selectedVente.statut === "en_attente" ? "En attente" : "Annulée"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lot</label>
                    <p className="text-gray-900">{selectedVente.lot?.nom || "N/A"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Espèce</label>
                    <p className="text-gray-900">{selectedVente.lot?.espece || "N/A"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                      <p className="text-gray-900">{selectedVente.quantite}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
                      <p className="text-gray-900">{selectedVente.prixUnitaire ? `${selectedVente.prixUnitaire.toLocaleString('fr-FR')} DA` : "N/A"}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix total</label>
                    <p className="text-gray-900 text-lg font-semibold">{selectedVente.prixTotal.toLocaleString('fr-FR')} DA</p>
                  </div>

                  {selectedVente.client && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations Client</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                          <p className="text-gray-900">{selectedVente.client.nom}</p>
                        </div>
                        {selectedVente.client.email && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p className="text-gray-900">{selectedVente.client.email}</p>
                          </div>
                        )}
                        {selectedVente.client.telephone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                            <p className="text-gray-900">{selectedVente.client.telephone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedVente.notes && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedVente.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenEdit(selectedVente);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedVente(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Modifier Vente */}
        {showEditModal && selectedVente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Modifier la Vente</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedVente(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleUpdateVente} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lot *
                    </label>
                    <select
                      value={selectedLot}
                      onChange={(e) => {
                        setSelectedLot(e.target.value);
                        const lot = lots.find(l => l._id === e.target.value);
                        if (lot) {
                          setQuantite(Math.min(quantite, lot.quantite + (selectedVente.lotId === e.target.value ? selectedVente.quantite : 0)));
                        }
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un lot</option>
                      {lots.map((lot) => {
                        const availableQty = lot._id === selectedVente.lotId 
                          ? lot.quantite + selectedVente.quantite 
                          : lot.quantite;
                        return (
                          <option key={lot._id} value={lot._id}>
                            {lot.nom} - {lot.espece} ({availableQty} disponibles)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={lots.find(l => l._id === selectedLot)?.quantite + (selectedVente.lotId === selectedLot ? selectedVente.quantite : 0) || 1}
                        value={quantite}
                        onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix Unitaire (DA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prixUnitaire}
                        onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {prixUnitaire > 0 && quantite > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Prix Total:</strong> {(prixUnitaire * quantite).toLocaleString('fr-FR')} DA
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client (optionnel)
                    </label>
                    <div className="space-y-3">
                      <select
                        value={selectedClientId}
                        onChange={(e) => {
                          setSelectedClientId(e.target.value);
                          if (e.target.value) {
                            const selectedClient = clients.find(c => c._id === e.target.value);
                            if (selectedClient) {
                              setClientNom(selectedClient.nom || "");
                              setClientEmail(selectedClient.email || "");
                              setClientTelephone(selectedClient.telephone || "");
                            }
                          } else {
                            setClientNom("");
                            setClientEmail("");
                            setClientTelephone("");
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un client existant</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.nom} {client.telephone ? `- ${client.telephone}` : ""}
                          </option>
                        ))}
                      </select>
                      
                      <div className="text-center text-sm text-gray-500">ou</div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Nom du client"
                          value={clientNom}
                          onChange={(e) => {
                            setClientNom(e.target.value);
                            setSelectedClientId("");
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="email"
                            placeholder="Email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="tel"
                            placeholder="Téléphone"
                            value={clientTelephone}
                            onChange={(e) => setClientTelephone(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Notes supplémentaires..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedVente(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Enregistrer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Confirmation Suppression */}
        {showDeleteModal && venteToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Confirmer la suppression</h2>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setVenteToDelete(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={deletingId === venteToDelete._id}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-center text-gray-700 mb-4">
                    Êtes-vous sûr de vouloir supprimer cette vente ?
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lot:</span>
                      <span className="text-sm font-medium text-gray-900">{venteToDelete.lot?.nom || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quantité:</span>
                      <span className="text-sm font-medium text-gray-900">{venteToDelete.quantite}</span>
                    </div>
                    {venteToDelete.client && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Client:</span>
                        <span className="text-sm font-medium text-gray-900">{venteToDelete.client.nom}</span>
                      </div>
                    )}
                    {venteToDelete.prixTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Prix total:</span>
                        <span className="text-sm font-medium text-gray-900">{venteToDelete.prixTotal.toLocaleString('fr-FR')} DA</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-center text-sm text-gray-500 mt-4">
                    La quantité sera restaurée dans le lot.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setVenteToDelete(null);
                    }}
                    disabled={deletingId === venteToDelete._id}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deletingId === venteToDelete._id}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deletingId === venteToDelete._id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

