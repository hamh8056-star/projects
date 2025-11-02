import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const { mac } = await req.json();
  if (!mac) return NextResponse.json({ error: "MAC requise" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  const existing = await db.collection("iot_devices").findOne({ mac });
  if (existing) {
    await db.collection("iot_devices").updateOne({ mac }, { $set: { lastSeen: new Date() } });
    return NextResponse.json({ known: true, associated: !!existing.bassinId, device: existing });
  } else {
    const result = await db.collection("iot_devices").insertOne({ mac, lastSeen: new Date(), status: "discovered" });
    return NextResponse.json({ known: false, associated: false, insertedId: result.insertedId });
  }
} 