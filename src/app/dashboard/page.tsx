"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import ObservateurDashboard from "@/components/dashboard/ObservateurDashboard";
import OperateurDashboard from "@/components/dashboard/OperateurDashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Afficher le dashboard approprié selon le rôle
  switch (session.user?.role) {
    case "observateur":
      return <AdminDashboard />;
    case "operateur":
      return <AdminDashboard />;
    case "distributeur":
      return <AdminDashboard />;
    case "admin":
    default:
      return <AdminDashboard />;
  }
} 