"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SessionProvider from "@/components/providers/SessionProvider";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { SidebarProvider, useSidebar } from "@/components/contexts/SidebarContext";
import { usePathname } from "next/navigation";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRef, useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  const isPublicOrAuthPage = pathname === "/" || 
                              pathname.startsWith("/auth/signin") || 
                              pathname.startsWith("/auth/login") || 
                              pathname.startsWith("/public/");
  
  return (
    <>
      <AppHeader />
      <div className="flex h-screen bg-gray-50">
        {!isPublicOrAuthPage && <Sidebar />}
        <div className={`
          flex-1 transition-all duration-300
          ${!isPublicOrAuthPage ? (isCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}
        `}>
          {children}
        </div>
      </div>
    </>
  );
}

function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (pathname === "/" || 
      pathname.startsWith("/auth/signin") || 
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/public/")) return null;
      
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-blue-100 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center h-16 justify-between">
        <div className="flex items-center gap-4 justify-end ml-auto">
          <button className="relative p-2 rounded-full hover:bg-cyan-100 transition"><Bell className="w-6 h-6 text-cyan-700" /></button>
          <div className="relative" ref={menuRef}>
            <button
              className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu utilisateur"
            >
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border z-50 py-2 animate-fade-in">
                <a href="/profil" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-cyan-50">
                  <User className="w-4 h-4 text-cyan-600" /> Profil
                </a>
                <a href="/parametres" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-cyan-50">
                  <Settings className="w-4 h-4 text-cyan-600" /> Paramètres
                </a>
                <div className="my-2 border-t border-gray-100" />
                <button
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                  <LogOut className="w-4 h-4 text-red-500" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionProvider>
          <SidebarProvider>
            <AppContent>{children}</AppContent>
          </SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
