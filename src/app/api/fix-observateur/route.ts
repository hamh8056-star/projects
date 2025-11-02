import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Chercher l'utilisateur observateur avec différentes variantes d'email
    const emailVariants = [
      "observateur@aqua.com",
      "Observateur@aqua.com",
      "OBSERVATEUR@aqua.com",
      "observateur@aqua.com ".trim(),
      " observateur@aqua.com".trim()
    ];
    
    let observateur = null;
    let foundEmail = null;
    
    for (const email of emailVariants) {
      observateur = await usersCollection.findOne({ email: email });
      if (observateur) {
        foundEmail = email;
        break;
      }
    }
    
    // Si pas trouvé, chercher par rôle
    if (!observateur) {
      observateur = await usersCollection.findOne({ role: "observateur" });
      if (observateur) {
        foundEmail = observateur.email;
      }
    }
    
    const correctEmail = "observateur@aqua.com";
    const hashedPassword = await bcrypt.hash("observateur", 10);
    
    if (!observateur) {
      // Créer l'utilisateur observateur
      const result = await usersCollection.insertOne({
        name: "Observateur 1",
        email: correctEmail,
        password: hashedPassword,
        role: "observateur",
        actif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Utilisateur observateur créé avec succès",
        action: "créé",
        userId: result.insertedId.toString()
      });
    } else {
      // Mettre à jour complètement l'utilisateur observateur
      // Si l'email est différent, on le corrige aussi
      const updateData: any = { 
        password: hashedPassword,
        actif: true, // TOUJOURS mettre actif à true pour les observateurs
        name: "Observateur 1",
        role: "observateur",
        updatedAt: new Date()
      };
      
      // Si l'email était différent, le corriger
      if (foundEmail && foundEmail.toLowerCase() !== correctEmail) {
        updateData.email = correctEmail;
      }
      
      // Mettre à jour avec upsert pour s'assurer que tous les champs sont corrects
      const result = await usersCollection.updateOne(
        { _id: observateur._id },
        { $set: updateData }
      );
      
      // Vérifier que actif est bien à true après la mise à jour
      const updatedUser = await usersCollection.findOne({ _id: observateur._id });
      if (updatedUser && updatedUser.actif !== true) {
        // Forcer actif à true si ce n'est pas le cas
        await usersCollection.updateOne(
          { _id: observateur._id },
          { $set: { actif: true } }
        );
      }
      
      // Vérifier que le mot de passe fonctionne
      const testCompare = await bcrypt.compare("observateur", hashedPassword);
      
      return NextResponse.json({ 
        success: true, 
        message: "Utilisateur observateur mis à jour avec succès",
        action: "mis à jour",
        oldEmail: foundEmail,
        newEmail: correctEmail,
        modifiedCount: result.modifiedCount,
        passwordTest: testCompare,
        user: {
          _id: observateur._id.toString(),
          email: correctEmail,
          name: "Observateur 1",
          role: "observateur",
          actif: true,
          hasPassword: true
        }
      });
    }
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de la correction de l'utilisateur observateur",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    const observateur = await usersCollection.findOne(
      { email: "observateur@aqua.com" },
      { projection: { password: 0 } } // Exclure le mot de passe de la réponse
    );
    
    if (!observateur) {
      return NextResponse.json({ 
        exists: false,
        message: "Utilisateur observateur non trouvé" 
      });
    }
    
    return NextResponse.json({ 
      exists: true,
      user: observateur,
      hasPassword: true // On assume qu'il a un mot de passe si on arrive ici
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 });
  }
}

