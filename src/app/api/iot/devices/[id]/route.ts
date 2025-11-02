import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Mise à jour d'un IoT device
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const updateData = await req.json();

    console.log(`📱 Mise à jour IoT device ${deviceId}:`, updateData);

    // Validation de l'ID
    if (!ObjectId.isValid(deviceId)) {
      return NextResponse.json({ 
        error: "ID de device invalide" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Préparation des données à mettre à jour
    const updateFields: any = {
      updatedAt: new Date()
    };

    // Champs autorisés pour la mise à jour
    if (updateData.nom) updateFields.nom = updateData.nom;
    if (updateData.type) updateFields.type = updateData.type;
    if (updateData.status) updateFields.status = updateData.status;
    if (updateData.ipAddress !== undefined) updateFields.ipAddress = updateData.ipAddress;
    if (updateData.bassinId !== undefined) updateFields.bassinId = updateData.bassinId;
    if (updateData.lastSeen) updateFields.lastSeen = new Date(updateData.lastSeen);

    // Mise à jour du device
    const result = await db.collection("iot_devices").updateOne(
      { _id: new ObjectId(deviceId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: "IoT device non trouvé" 
      }, { status: 404 });
    }

    console.log(`✅ IoT device mis à jour:`, {
      id: deviceId,
      modifiedCount: result.modifiedCount
    });

    return NextResponse.json({ 
      success: true, 
      message: "IoT device mis à jour avec succès",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour IoT device:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la mise à jour de l'IoT device",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Récupération d'un IoT device spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;

    // Validation de l'ID
    if (!ObjectId.isValid(deviceId)) {
      return NextResponse.json({ 
        error: "ID de device invalide" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const device = await db.collection("iot_devices").findOne({
      _id: new ObjectId(deviceId)
    });

    if (!device) {
      return NextResponse.json({ 
        error: "IoT device non trouvé" 
      }, { status: 404 });
    }

    return NextResponse.json(device);

  } catch (error) {
    console.error("❌ Erreur récupération IoT device:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la récupération de l'IoT device" 
    }, { status: 500 });
  }
}

// Suppression d'un IoT device
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;

    // Validation de l'ID
    if (!ObjectId.isValid(deviceId)) {
      return NextResponse.json({ 
        error: "ID de device invalide" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("iot_devices").deleteOne({
      _id: new ObjectId(deviceId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: "IoT device non trouvé" 
      }, { status: 404 });
    }

    console.log(`✅ IoT device supprimé:`, {
      id: deviceId
    });

    return NextResponse.json({ 
      success: true, 
      message: "IoT device supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur suppression IoT device:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la suppression de l'IoT device" 
    }, { status: 500 });
  }
} 