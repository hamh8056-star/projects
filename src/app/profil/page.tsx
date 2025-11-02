"use client";
import { useSession } from "next-auth/react";
import { User, Mail, Shield, KeyRound, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProfilPage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string|null>(null);
  const [pwFeedback, setPwFeedback] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!session?.user) return <div className="min-h-screen flex items-center justify-center text-red-600">Vous devez être connecté pour accéder à votre profil.</div>;

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      if (!session?.user) throw new Error();
      const res = await fetch("/api/utilisateurs/" + session.user.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) throw new Error();
      setFeedback("Profil mis à jour avec succès");
    } catch {
      setFeedback("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwFeedback(null);
    if (newPassword !== confirmPassword) {
      setPwFeedback("Les mots de passe ne correspondent pas");
      setPwLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/utilisateurs/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPwFeedback("Mot de passe changé avec succès");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setPwFeedback(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-800 mb-2">Profil utilisateur</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et votre mot de passe.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Card gauche : avatar, infos, nom/email */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 flex-1 w-full max-w-none flex flex-col items-center gap-6">
            <div className="flex flex-row items-center gap-4 w-full mb-2 justify-center">
              <div className="w-16 h-16 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-3xl">
                {session.user.name ? session.user.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xl font-bold text-cyan-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-500" /> {session.user.name || "Utilisateur"}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm">
                  <Shield className="w-4 h-4" /> {session.user.role || "Utilisateur"}
                </div>
              </div>
            </div>
            <form onSubmit={handleProfile} className="w-full flex flex-col gap-4 mt-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mt-auto" disabled={loading}>
                <Save className="w-4 h-4" /> {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
              {feedback && <div className="text-center text-sm mt-2 text-cyan-700">{feedback}</div>}
            </form>
          </div>
          {/* Card droite : mot de passe */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 flex-1 w-full max-w-none flex flex-col gap-6 min-w-[280px] mx-auto">
            <form onSubmit={handlePassword} className="w-full flex flex-col gap-4 flex-1">
              <div className="font-semibold text-cyan-800 flex items-center gap-2 mb-1 mt-2"><KeyRound className="w-4 h-4" /> Changer le mot de passe</div>
              <input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="Ancien mot de passe" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
              <input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="Nouveau mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              <input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mt-auto" disabled={pwLoading}>
                <KeyRound className="w-4 h-4" /> {pwLoading ? "Changement..." : "Changer le mot de passe"}
              </button>
              {pwFeedback && <div className={`text-center text-sm mt-2 ${pwFeedback.includes("succès") ? "text-green-700" : "text-red-600"}`}>{pwFeedback}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 