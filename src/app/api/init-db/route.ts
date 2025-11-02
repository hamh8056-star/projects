import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/init-db";

export async function POST() {
  try {
    const success = await initializeDatabase();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "Base de données initialisée avec succès" 
      });
    } else {
      return NextResponse.json({ 
        error: "Erreur lors de l'initialisation de la base de données" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de l'initialisation" 
    }, { status: 500 });
  }
} 