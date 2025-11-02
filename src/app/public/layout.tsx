"use client";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Contenu principal sans sidebar ni header */}
      {children}
    </div>
  );
} 