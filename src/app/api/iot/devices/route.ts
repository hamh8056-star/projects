import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Types pour les IoT devices
interface IoTDevice {
  mac: string;
  nom: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  ipAddress?: string;
  bassinId?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Récupération des IoT devices
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mac = searchParams.get('mac');
    const status = searchParams.get('status');

    const client = await clientPromise;
    const db = client.db();

    // Construction du filtre
    const filter: any = {};
    if (mac) filter.mac = mac;
    if (status) filter.status = status;

    console.log(`📱 Récupération IoT devices avec filtre:`, filter);

    const devices = await db.collection("iot_devices")
      .find(filter)
      .sort({ lastSeen: -1 })
      .toArray();

    return NextResponse.json(devices);

  } catch (error) {
    console.error("❌ Erreur récupération IoT devices:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des IoT devices" 
    }, { status: 500 });
  }
}

// Création d'un nouvel IoT device
export async function POST(req: NextRequest) {
  try {
    const data: IoTDevice = await req.json();
    
    console.log(`📱 Création IoT device:`, {
      mac: data.mac,
      nom: data.nom,
      type: data.type
    });

    // Validation des données
    if (!data.mac || !data.nom || !data.type) {
      return NextResponse.json({ 
        error: "MAC, nom et type requis" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Vérifier si l'appareil existe déjà
    const existingDevice = await db.collection("iot_devices").findOne({ mac: data.mac });
    if (existingDevice) {
      return NextResponse.json({ 
        error: "Appareil avec cette MAC existe déjà",
        mac: data.mac
      }, { status: 409 });
    }

    // Préparation de l'objet à insérer
    const deviceToInsert = {
      mac: data.mac,
      nom: data.nom,
      type: data.type,
      status: data.status || 'offline',
      ipAddress: data.ipAddress || null,
      bassinId: data.bassinId || null,
      lastSeen: data.lastSeen ? new Date(data.lastSeen) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insertion de l'appareil
    const result = await db.collection("iot_devices").insertOne(deviceToInsert);

    console.log(`✅ IoT device créé:`, {
      id: result.insertedId,
      mac: data.mac,
      nom: data.nom
    });

    return NextResponse.json({ 
      success: true, 
      message: "IoT device créé avec succès",
      device: {
        id: result.insertedId,
        ...deviceToInsert
      }
    });

  } catch (error) {
    console.error("❌ Erreur création IoT device:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la création de l'IoT device",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} 