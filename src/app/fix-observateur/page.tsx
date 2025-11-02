"use client";

import { useState } from "react";

export default function FixObservateurPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const checkUsers = async () => {
    setLoading(true);
    setStatus("Vérification des utilisateurs...");
    try {
      const response = await fetch("/api/check-users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setStatus(`✅ ${data.totalUsers} utilisateur(s) trouvé(s)`);
      } else {
        setStatus("❌ Erreur lors de la vérification");
      }
    } catch (error) {
      setStatus("❌ Erreur: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const fixObservateur = async () => {
    setLoading(true);
    setStatus("Correction de l'utilisateur observateur...");
    try {
      const response = await fetch("/api/fix-observateur", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setStatus(`✅ ${data.message} (Action: ${data.action})`);
        // Re-vérifier les utilisateurs
        await checkUsers();
      } else {
        setStatus("❌ Erreur: " + (data.error || "Erreur inconnue"));
      }
    } catch (error) {
      setStatus("❌ Erreur: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const testObservateurAuth = async () => {
    setLoading(true);
    setStatus("Test de l'authentification de l'observateur...");
    try {
      const response = await fetch("/api/test-observateur-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "observateur@aqua.com",
          password: "observateur"
        })
      });
      const data = await response.json();
      
      if (response.ok && data.passwordMatch) {
        setStatus(`✅ Test réussi! ${data.steps.join(" | ")}`);
      } else {
        setStatus(`❌ Test échoué: ${data.steps?.join(" | ") || data.error || "Erreur inconnue"}`);
        if (data.observateurVariants) {
          setStatus(prev => prev + `\n\nVariantes trouvées: ${JSON.stringify(data.observateurVariants, null, 2)}`);
        }
      }
      
      // Afficher les détails dans la console
      console.log("Test auth result:", data);
    } catch (error) {
      setStatus("❌ Erreur: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Correction Utilisateur Observateur
          </h1>
          <p className="text-gray-600 mb-6">
            Cette page permet de diagnostiquer et corriger le problème d'authentification de l'observateur.
          </p>

          <div className="space-y-4">
            <button
              onClick={checkUsers}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Vérification..." : "1. Vérifier les utilisateurs"}
            </button>

            <button
              onClick={fixObservateur}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
            >
              {loading ? "Correction..." : "2. Corriger l'observateur"}
            </button>

            <button
              onClick={testObservateurAuth}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
            >
              {loading ? "Test..." : "3. Tester l'authentification"}
            </button>

            <button
              onClick={async () => {
                setLoading(true);
                setStatus("Activation de l'utilisateur observateur...");
                try {
                  const response = await fetch("/api/activate-observateur", { method: "POST" });
                  const data = await response.json();
                  if (data.success) {
                    setStatus(`✅ ${data.message} (${data.modifiedCount} utilisateur(s) modifié(s))`);
                    await checkUsers();
                  } else {
                    setStatus("❌ Erreur: " + (data.error || "Erreur inconnue"));
                  }
                } catch (error) {
                  setStatus("❌ Erreur: " + (error instanceof Error ? error.message : String(error)));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
            >
              {loading ? "Activation..." : "4. Activer l'observateur"}
            </button>

            <button
              onClick={async () => {
                setLoading(true);
                setStatus("Recréation forcée de l'utilisateur observateur...");
                try {
                  const response = await fetch("/api/force-fix-observateur", { method: "POST" });
                  const data = await response.json();
                  if (data.success) {
                    setStatus(`✅ ${data.message} (${data.deletedCount} supprimé(s), passwordTest: ${data.passwordTest})`);
                    await checkUsers();
                  } else {
                    setStatus("❌ Erreur: " + (data.error || "Erreur inconnue"));
                  }
                } catch (error) {
                  setStatus("❌ Erreur: " + (error instanceof Error ? error.message : String(error)));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
            >
              {loading ? "Recréation..." : "5. FORCER la recréation"}
            </button>
          </div>

          {status && (
            <div className={`mt-4 p-4 rounded-lg ${
              status.includes("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {status}
            </div>
          )}
        </div>

        {users.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Utilisateurs dans la base de données
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Nom</th>
                    <th className="p-2 text-left">Rôle</th>
                    <th className="p-2 text-left">Actif</th>
                    <th className="p-2 text-left">Mot de passe</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b">
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === "admin" ? "bg-purple-100 text-purple-800" :
                          user.role === "operateur" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2">
                        {user.actif ? (
                          <span className="text-green-600">✅ Oui</span>
                        ) : (
                          <span className="text-red-600">❌ Non</span>
                        )}
                      </td>
                      <td className="p-2">
                        {user.hasPassword ? (
                          <span className="text-green-600">✅ Oui ({user.passwordLength} caractères)</span>
                        ) : (
                          <span className="text-red-600">❌ Non</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="font-bold text-yellow-900 mb-2">📝 Identifiants de test :</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li><strong>Admin:</strong> admin@aqua.com / admin</li>
            <li><strong>Opérateur:</strong> operateur@aqua.com / operateur</li>
            <li><strong>Observateur:</strong> observateur@aqua.com / observateur</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

