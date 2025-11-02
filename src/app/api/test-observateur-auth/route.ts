import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: "Email et mot de passe requis" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Normaliser l'email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Chercher l'utilisateur
    const user = await usersCollection.findOne({ email: normalizedEmail });
    
    const result: any = {
      email: normalizedEmail,
      userFound: !!user,
      hasPassword: !!user?.password,
      isActive: user?.actif !== false,
      passwordMatch: false,
      role: user?.role || null,
      name: user?.name || null,
      userId: user?._id?.toString() || null,
      steps: []
    };

    if (!user) {
      result.steps.push("❌ Utilisateur non trouvé dans la base de données");
      // Chercher toutes les variantes
      const allUsers = await usersCollection.find({}).toArray();
      const observateurVariants = allUsers.filter(u => 
        u.role === "observateur" || 
        u.email?.toLowerCase().includes("observateur")
      );
      result.observateurVariants = observateurVariants.map(u => ({
        email: u.email,
        role: u.role,
        hasPassword: !!u.password,
        actif: u.actif
      }));
      return NextResponse.json(result, { status: 404 });
    }

    result.steps.push("✅ Utilisateur trouvé");

    if (!user.password) {
      result.steps.push("❌ L'utilisateur n'a pas de mot de passe hashé");
      return NextResponse.json(result, { status: 400 });
    }

    result.steps.push("✅ Mot de passe hashé trouvé");

    if (user.actif === false) {
      result.steps.push("❌ L'utilisateur est inactif");
      return NextResponse.json(result, { status: 403 });
    }

    result.steps.push("✅ Utilisateur actif");

    // Tester le mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    result.passwordMatch = isValid;

    if (!isValid) {
      result.steps.push("❌ Le mot de passe ne correspond pas");
      // Essayer de hasher le mot de passe fourni pour comparaison
      const testHash = await bcrypt.hash(password, 10);
      result.testHashPreview = testHash.substring(0, 20) + "...";
      result.storedHashPreview = user.password.substring(0, 20) + "...";
      return NextResponse.json(result, { status: 401 });
    }

    result.steps.push("✅ Mot de passe correct");
    result.steps.push("✅ Authentification réussie!");

    return NextResponse.json(result);
  } catch (error) {
    console.error("[TEST AUTH] Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

