"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ObservateurSidebar from "./ObservateurSidebar";

interface ObservateurLayoutProps {
  children: React.ReactNode;
}

export default function ObservateurLayout({ children }: ObservateurLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Vérifier si l'utilisateur a le rôle observateur
    if (session.user?.role !== "observateur") {
      router.push("/dashboard"); // Rediriger vers le dashboard admin par défaut
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== "observateur") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <ObservateurSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
} 