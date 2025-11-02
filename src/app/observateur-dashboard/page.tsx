"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ObservateurAdminDashboard from "@/components/dashboard/ObservateurAdminDashboard";
import { useEffect } from "react";

export default function ObservateurDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/auth/signin");
    } else if (session.user?.role !== "observateur") {
      if (session.user?.role === "admin") router.replace("/dashboard");
      else if (session.user?.role === "operateur") router.replace("/dashboard");
      else router.replace("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user?.role !== "observateur") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement...
      </div>
    );
  }

  // Affiche le dashboard avancé pour observateur
  return <ObservateurAdminDashboard />;
} 