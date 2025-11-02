"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { 
  Activity, 
  Bell, 
  BarChart3, 
  Brain, 
  Smartphone, 
  Shield, 
  ArrowRight, 
  Play,
  CheckCircle,
  Users,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import AquacultureSlider from "@/components/AquacultureSlider";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Si l'utilisateur est authentifié, rediriger vers le dashboard
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Afficher un loader pendant la vérification de l'authentification
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher la page d'accueil
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 overflow-hidden">
        {/* Hero Section - Slider au début */}
        <main className="relative">
          {/* Image Slider - Full Width au top */}
          <AquacultureSlider />
          
          {/* Header transparent au-dessus du slider */}
          <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                {/* Logo à gauche */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">🐟</span>
                  </div>
                  <h1 className={`text-2xl font-bold drop-shadow-lg ${isScrolled ? 'text-gray-900' : 'text-white'}`}>AquaAI</h1>
                </div>
                
                {/* Menu de navigation au centre */}
                <nav className="hidden md:flex items-center space-x-8">
                  <a
                    href="#accueil"
                    className={`transition-colors font-medium drop-shadow-md ${isScrolled ? 'text-gray-900 hover:text-cyan-600' : 'text-white hover:text-cyan-200'}`}
                  >
                    Accueil
                  </a>
                  <a
                    href="#fonctionnalites"
                    className={`transition-colors font-medium drop-shadow-md ${isScrolled ? 'text-gray-900 hover:text-cyan-600' : 'text-white hover:text-cyan-200'}`}
                  >
                    Fonctionnalités
                  </a>
                  <a
                    href="#contact"
                    className={`transition-colors font-medium drop-shadow-md ${isScrolled ? 'text-gray-900 hover:text-cyan-600' : 'text-white hover:text-cyan-200'}`}
                  >
                    Contact
                  </a>
                </nav>
                
                {/* Bouton de connexion à droite */}
                <div className="flex items-center justify-end">
                  <a
                    href="/auth/signin"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    Connexion
                  </a>
                </div>
              </div>
            </div>
          </header>
          
          {/* Content with padding */}
          <div id="accueil" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
          
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <motion.h2 
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Gestion intelligente de votre
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 block"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: "200% 200%" }}
              >
                ferme aquacole
              </motion.span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Surveillez en temps réel vos bassins, optimisez la production et prenez des décisions éclairées 
              grâce à l'intelligence artificielle.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.a
                href="/auth/signin"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg flex items-center justify-center gap-2"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#features"
                className="border-2 border-cyan-500 text-cyan-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cyan-50 transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Play className="w-5 h-5" />
                Voir la démo
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Floating Stats */}
          <motion.div 
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            {[
              { icon: Users, value: "500+", label: "Fermes connectées" },
              { icon: TrendingUp, value: "98%", label: "Taux de satisfaction" },
              { icon: Zap, value: "24/7", label: "Surveillance continue" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg text-center"
                whileHover={{ y: -10, scale: 1.05 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, duration: 0.6, delay: 1.2 + index * 0.2 }}
              >
                <stat.icon className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
          </div>
        </main>

        {/* Features Section */}
        <section id="fonctionnalites" className="py-20 bg-white/50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Fonctionnalités principales
              </h3>
              <p className="text-lg text-gray-600">
                Tout ce dont vous avez besoin pour gérer efficacement votre ferme aquacole
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Activity,
                  title: "Surveillance en temps réel",
                  description: "Suivez la température, le pH, l'oxygène dissous et d'autres paramètres critiques",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Bell,
                  title: "Alertes intelligentes",
                  description: "Recevez des notifications instantanées en cas d'anomalie détectée",
                  color: "from-red-500 to-pink-500"
                },
                {
                  icon: BarChart3,
                  title: "Analyses avancées",
                  description: "Visualisez les tendances et optimisez vos processus de production",
                  color: "from-green-500 to-emerald-500"
                },
                {
                  icon: Brain,
                  title: "IA prédictive",
                  description: "Anticipez les problèmes et optimisez la croissance de vos poissons",
                  color: "from-purple-500 to-indigo-500"
                },
                {
                  icon: Smartphone,
                  title: "Accès mobile",
                  description: "Surveillez votre ferme depuis n'importe où avec notre application mobile",
                  color: "from-orange-500 to-red-500"
                },
                {
                  icon: Shield,
                  title: "Sécurité maximale",
                  description: "Vos données sont protégées avec les meilleures pratiques de sécurité",
                  color: "from-teal-500 to-cyan-500"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  whileHover={{ y: -10, scale: 1.02 }}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section 
          className="py-20 bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent"
          />
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.h3 
              className="text-3xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Prêt à révolutionner votre aquaculture ?
            </motion.h3>
            <motion.p 
              className="text-xl text-cyan-100 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Rejoignez les fermes aquacoles qui utilisent déjà AquaAI pour optimiser leur production
            </motion.p>
            <motion.a
              href="/auth/signin"
              className="bg-white text-cyan-600 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg inline-flex items-center gap-2"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </motion.a>
          </div>
        </motion.section>

        {/* Footer */}
        <footer id="contact" className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <motion.div 
                    className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="text-white font-bold">🐟</span>
                  </motion.div>
                  <span className="text-xl font-bold">AquaAI</span>
                </div>
                <p className="text-gray-400">
                  La solution intelligente pour l'aquaculture moderne.
                </p>
              </motion.div>
              {[
                { title: "Produit", links: ["Fonctionnalités", "Tarifs", "API"] },
                { title: "Support", links: ["Documentation", "Contact", "FAQ"] },
                { title: "Entreprise", links: ["À propos", "Blog", "Carrières"] }
              ].map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h4 className="font-semibold mb-4">{section.title}</h4>
                  <ul className="space-y-2 text-gray-400">
                    {section.links.map((link, linkIndex) => (
                      <motion.li 
                        key={linkIndex}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <a href="#" className="hover:text-white transition-colors">{link}</a>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <motion.div 
              className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p>&copy; 2024 AquaAI. Tous droits réservés.</p>
            </motion.div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}
