"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const isHomePage = pathname === "/";
  const isAuthPage = pathname.startsWith("/auth");
  const isAuthenticated = session && status === "authenticated";

  // Redirection si non authentifié sur une page protégée
  useEffect(() => {
    if (status === "unauthenticated" && !isHomePage && !isAuthPage) {
      router.push("/auth/signin");
    }
  }, [status, isHomePage, isAuthPage, router]);

  // Pages publiques (sans sidebar)
  if (isHomePage || isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Pages protégées (avec sidebar seulement si authentifié)
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    );
  }

  // Chargement ou redirection en cours
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return <div className="min-h-screen">{children}</div>;
} 