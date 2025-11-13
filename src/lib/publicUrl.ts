/**
 * Fonction utilitaire pour obtenir l'URL publique de l'application
 * Détecte automatiquement l'environnement (local vs production)
 */

/**
 * Obtient l'URL publique de l'application côté client
 * @param useCurrentUrl Si true, utilise l'URL actuelle pour les liens (local), sinon utilise l'URL publique pour les QR codes
 * @returns L'URL publique à utiliser pour les liens et QR codes
 */
export function getPublicUrl(useCurrentUrl: boolean = false): string {
  // Si on est côté serveur, retourner l'URL par défaut
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || "https://projects-amber-nu.vercel.app";
  }

  // Priorité 1: Détecter automatiquement selon l'URL actuelle
  const currentOrigin = window.location.origin;
  
  // Si on est sur Vercel (production), toujours utiliser l'URL Vercel
  if (currentOrigin.includes('vercel.app') || currentOrigin.includes('vercel.com')) {
    return currentOrigin;
  }
  
  // Si on est en local et qu'on veut utiliser l'URL actuelle (pour les liens de navigation)
  if (useCurrentUrl) {
    return currentOrigin;
  }
  
  // Priorité 2: Variable d'environnement (pour les QR codes et partage)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  
  // Si on est en localhost ou IP locale, utiliser l'URL Vercel pour les QR codes
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1') || currentOrigin.match(/^http:\/\/\d+\.\d+\.\d+\.\d+/)) {
    return "https://projects-amber-nu.vercel.app";
  }
  
  // Par défaut, utiliser l'origin actuel
  return currentOrigin;
}

/**
 * Obtient l'URL publique de l'application côté serveur
 * @param origin L'origin de la requête (optionnel)
 * @param useCurrentUrl Si true, utilise l'URL actuelle pour les liens (local), sinon utilise l'URL publique pour les QR codes
 * @returns L'URL publique à utiliser
 */
export function getPublicUrlServer(origin?: string | null, useCurrentUrl: boolean = false): string {
  // Priorité 1: Variable d'environnement
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // Priorité 2: Détecter selon l'origin de la requête
  if (origin) {
    // Si on est sur Vercel, toujours utiliser l'URL Vercel
    if (origin.includes('vercel.app') || origin.includes('vercel.com')) {
      return origin.replace(/\/$/, '');
    }
    
    // Si on est en local et qu'on veut utiliser l'URL actuelle (pour les liens de navigation)
    if (useCurrentUrl) {
      return origin.replace(/\/$/, '');
    }
    
    // Si on est en localhost ou IP locale, utiliser Vercel pour les QR codes
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.match(/^http:\/\/\d+\.\d+\.\d+\.\d+/)) {
      return "https://projects-amber-nu.vercel.app";
    }
  }

  // Par défaut, utiliser l'URL Vercel pour les QR codes
  return "https://projects-amber-nu.vercel.app";
}

