import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    const email = "distributeur@aqua.com";
    const password = "distributeur";
    const normalizedEmail = email.trim().toLowerCase();
    
    // Chercher l'utilisateur existant
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
    
    // Si pas trouvé, chercher par rôle
    if (!user) {
      const distributeurs = await usersCollection.find({ role: "distributeur" }).toArray();
      if (distributeurs.length > 0) {
        user = distributeurs[0];
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (user) {
      // Mettre à jour l'utilisateur existant
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            email: normalizedEmail,
            name: "Distributeur 1",
            password: hashedPassword,
            role: "distributeur",
            actif: true,
            updatedAt: new Date()
          }
        }
      );
      
      // Vérifier que ça fonctionne
      const updatedUser = await usersCollection.findOne({ _id: user._id });
      const testPassword = await bcrypt.compare(password, updatedUser!.password);
      
      return NextResponse.json({
        success: true,
        action: "mis à jour",
        email: normalizedEmail,
        passwordTest: testPassword,
        user: {
          email: updatedUser!.email,
          name: updatedUser!.name,
          role: updatedUser!.role,
          actif: updatedUser!.actif
        }
      });
    } else {
      // Créer un nouvel utilisateur
      const result = await usersCollection.insertOne({
        name: "Distributeur 1",
        email: normalizedEmail,
        password: hashedPassword,
        role: "distributeur",
        actif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Vérifier que ça fonctionne
      const newUser = await usersCollection.findOne({ _id: result.insertedId });
      const testPassword = await bcrypt.compare(password, newUser!.password);
      
      return NextResponse.json({
        success: true,
        action: "créé",
        email: normalizedEmail,
        passwordTest: testPassword,
        user: {
          email: newUser!.email,
          name: newUser!.name,
          role: newUser!.role,
          actif: newUser!.actif
        }
      });
    }
  } catch (error) {
    console.error("Erreur lors de la correction:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    const email = "distributeur@aqua.com";
    const normalizedEmail = email.trim().toLowerCase();
    
    // Chercher l'utilisateur
    let user = await usersCollection.findOne({ email: normalizedEmail });
    
    if (!user) {
      user = await usersCollection.findOne({ 
        $or: [
          { email: email },
          { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } }
        ]
      });
    }
    
    if (!user) {
      const distributeurs = await usersCollection.find({ role: "distributeur" }).toArray();
      if (distributeurs.length > 0) {
        user = distributeurs[0];
      }
    }
    
    if (!user) {
      return NextResponse.json({
        found: false,
        message: "Utilisateur distributeur non trouvé"
      });
    }
    
    // Tester le mot de passe
    const testPassword = user.password ? await bcrypt.compare("distributeur", user.password) : false;
    
    return NextResponse.json({
      found: true,
      email: user.email,
      name: user.name,
      role: user.role,
      actif: user.actif,
      hasPassword: !!user.password,
      passwordTest: testPassword,
      needsFix: !user.password || !testPassword || user.actif === false || user.email !== normalizedEmail
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

