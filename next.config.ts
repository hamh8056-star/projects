import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Désactiver ESLint pendant les builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Désactiver la vérification TypeScript pendant les builds
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Améliorer la résolution des modules pour les composants UI
    if (!config.resolve) {
      config.resolve = {};
    }
    
    // Configurer les alias de chemin explicitement
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Ajouter l'alias @ pour pointer vers src
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    
    // S'assurer que les extensions sont correctement résolues
    if (!config.resolve.extensions) {
      config.resolve.extensions = [];
    }
    
    // Prioriser .tsx et .ts pour la résolution
    config.resolve.extensions = [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
      ...config.resolve.extensions.filter((ext: string) => 
        !['.tsx', '.ts', '.jsx', '.js', '.json'].includes(ext)
      ),
    ];
    
    return config;
  },
};

export default nextConfig;
