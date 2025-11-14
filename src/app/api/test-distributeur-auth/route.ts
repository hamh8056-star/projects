import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email = "distributeur@aqua.com", password = "distributeur" } = await req.json();
    
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Normaliser l'email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Chercher l'utilisateur
    let user = await usersCollection.findOne({ email: normalizedEmail });
    
    // Si pas trouvé, chercher par email non normalisé
    if (!user) {
      user = await usersCollection.findOne({ 
        $or: [
          { email: email },
          { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } }
        ]
      });
    }
    
    // Si toujours pas trouvé, chercher par rôle
    if (!user) {
      const distributeurs = await usersCollection.find({ role: "distributeur" }).toArray();
      if (distributeurs.length > 0) {
        user = distributeurs[0];
      }
    }
    
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
      const distributeurVariants = allUsers.filter(u => 
        u.role === "distributeur" || 
        u.email?.toLowerCase().includes("distributeur")
      );
      result.distributeurVariants = distributeurVariants.map(u => ({
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
      result.steps.push("❌ L'utilisateur est inactif (actif: false)");
      return NextResponse.json(result, { status: 403 });
    }

    result.steps.push("✅ Utilisateur actif");

    // Tester le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    result.passwordMatch = passwordMatch;

    if (passwordMatch) {
      result.steps.push("✅ Mot de passe correct");
      return NextResponse.json(result, { status: 200 });
    } else {
      result.steps.push("❌ Mot de passe incorrect");
      result.steps.push(`ℹ️ Hash valide: ${user.password.startsWith("$2")}, Longueur: ${user.password.length}`);
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error("Erreur lors du test:", error);
    return NextResponse.json({ 
      error: "Erreur lors du test", 
      message: error instanceof Error ? error.message : "Erreur inconnue" 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Chercher tous les distributeurs
    const distributeurs = await usersCollection.find({ role: "distributeur" }).toArray();
    
    return NextResponse.json({
      count: distributeurs.length,
      distributeurs: distributeurs.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        actif: u.actif,
        hasPassword: !!u.password,
        passwordLength: u.password?.length || 0
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Erreur lors de la vérification", 
      message: error instanceof Error ? error.message : "Erreur inconnue" 
    }, { status: 500 });
  }
}

