import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH] ❌ Credentials manquantes");
            return null;
          }

          const client = await clientPromise;
          const db = client.db();
          // Normaliser l'email (trim et lowercase)
          const normalizedEmail = credentials.email.trim().toLowerCase();
          console.log(`[AUTH] 🔍 Recherche utilisateur avec email: "${normalizedEmail}"`);
          
          // Chercher l'utilisateur avec l'email normalisé
          let user = await db.collection("users").findOne({ email: normalizedEmail });
          
          // Si pas trouvé, chercher par email non normalisé (au cas où)
          if (!user) {
            console.log(`[AUTH] ⚠️ Utilisateur non trouvé avec email normalisé, recherche alternative...`);
            user = await db.collection("users").findOne({ 
              $or: [
                { email: credentials.email },
                { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } }
              ]
            });
          }
          
          // Si toujours pas trouvé et que c'est un observateur, chercher par rôle
          if (!user && normalizedEmail.includes("observateur")) {
            console.log(`[AUTH] ⚠️ Recherche par rôle "observateur"...`);
            const observateurs = await db.collection("users").find({ role: "observateur" }).toArray();
            if (observateurs.length > 0) {
              user = observateurs[0];
              console.log(`[AUTH] ℹ️ Observateur trouvé avec email: "${user.email}"`);
            }
          }
          
          if (!user) {
            console.log(`[AUTH] ❌ Utilisateur non trouvé: ${credentials.email}`);
            // Lister tous les utilisateurs pour debug
            const allUsers = await db.collection("users").find({}).toArray();
            console.log(`[AUTH] 📋 Utilisateurs dans la base:`, allUsers.map(u => ({ email: u.email, role: u.role })));
            return null;
          }

          console.log(`[AUTH] ✅ Utilisateur trouvé: ${user.email} (role: ${user.role}, actif: ${user.actif})`);

          // Vérifier si l'utilisateur est actif
          // Si actif est undefined, on considère qu'il est actif (comportement par défaut)
          if (user.actif !== undefined && user.actif === false) {
            console.log(`[AUTH] ❌ Utilisateur inactif: ${credentials.email}`);
            return null;
          }
          
          // Si actif est undefined, on le considère comme actif
          if (user.actif === undefined) {
            console.log(`[AUTH] ℹ️ Champ 'actif' non défini pour ${credentials.email}, considéré comme actif par défaut`);
          }

          // Vérifier si le mot de passe existe
          if (!user.password) {
            console.log(`[AUTH] ❌ Utilisateur sans mot de passe: ${credentials.email}`);
            return null;
          }

          console.log(`[AUTH] 🔐 Vérification du mot de passe...`);

          // Vérifier le mot de passe hashé
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            console.log(`[AUTH] ❌ Mot de passe incorrect pour: ${credentials.email}`);
            // Pour debug, vérifier si le hash est valide
            const isHashValid = user.password.startsWith("$2");
            console.log(`[AUTH] ℹ️ Hash valide: ${isHashValid}, Longueur: ${user.password.length}`);
            return null;
          }

          console.log(`[AUTH] ✅ Connexion réussie: ${credentials.email} (${user.role})`);
          
          // Retourner l'utilisateur (sans le mot de passe)
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email || normalizedEmail, // Utiliser l'email normalisé si user.email est différent
            role: user.role || "user"
          };
        } catch (error) {
          console.error("[AUTH] ❌ Erreur lors de l'authentification:", error);
          if (error instanceof Error) {
            console.error("[AUTH] Stack:", error.stack);
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
};

// Vérifier que NEXTAUTH_SECRET est défini
if (!process.env.NEXTAUTH_SECRET) {
  console.error("⚠️ ERREUR CRITIQUE: NEXTAUTH_SECRET n'est pas défini dans les variables d'environnement!");
  console.error("⚠️ L'authentification ne fonctionnera pas sans cette variable.");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 