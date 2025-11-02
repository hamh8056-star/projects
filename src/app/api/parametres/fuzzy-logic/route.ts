import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Récupérer les paramètres de logique floue depuis la base de données
    const fuzzyConfig = await db.collection('fuzzy_config').findOne({});
    
    // Paramètres par défaut si aucun n'existe
    const defaultConfig = {
      temperature: {
        min: 18,
        max: 30,
        warning_low: 20,
        warning_high: 28,
        critical_low: 18,
        critical_high: 30
      },
      ph: {
        min: 6.5,
        max: 8.5,
        warning_low: 7.0,
        warning_high: 8.0,
        critical_low: 6.5,
        critical_high: 8.5
      },
      oxygen: {
        min: 4,
        max: 12,
        warning_low: 5,
        warning_high: 10,
        critical_low: 4,
        critical_high: 12
      },
      salinity: {
        min: 25,
        max: 35,
        warning_low: 28,
        warning_high: 32,
        critical_low: 25,
        critical_high: 35
      },
      turbidity: {
        min: 0,
        max: 50,
        warning_low: 5,
        warning_high: 30,
        critical_low: 0,
        critical_high: 50
      }
    };

    return NextResponse.json({
      success: true,
      config: fuzzyConfig?.config || defaultConfig
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration floue:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration manquante' },
        { status: 400 }
      );
    }

    // Sauvegarder ou mettre à jour la configuration
    await db.collection('fuzzy_config').updateOne(
      {}, // filtre vide pour mettre à jour le premier document
      { $set: { config, updatedAt: new Date() } },
      { upsert: true } // créer si n'existe pas
    );

    return NextResponse.json({
      success: true,
      message: 'Configuration de logique floue mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la configuration floue:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la sauvegarde de la configuration' },
      { status: 500 }
    );
  }
} 