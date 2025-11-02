import React from "react";

export function LoaderIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block border-2 border-blue-400 border-t-transparent rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

export default function Loader({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-blue-700 font-medium animate-pulse">{label}</span>
    </div>
  );
} 