import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/iot?bassinId=xxx&mac=xxx
export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const devices = await db.collection('iot_devices').find({}).toArray();
  return NextResponse.json(devices);
}

// POST /api/iot
export async function POST(req: Request) {
  const body = await req.json();
  const client = await clientPromise;
  const db = client.db();
  const device = {
    nom: body.nom,
    type: body.type,
    mac: body.mac,
    bassinId: body.bassinId,
    status: body.status || 'offline',
    lastValue: body.lastValue || '',
    lastUpdate: new Date(),
  };
  const result = await db.collection('iot_devices').insertOne(device);
  return NextResponse.json({ insertedId: result.insertedId });
}

// PUT /api/iot?id=xxx
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  const client = await clientPromise;
  const db = client.db();
  const update: any = { ...body, lastUpdate: new Date() };
  await db.collection('iot_devices').updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );
  return NextResponse.json({ success: true });
}

// DELETE /api/iot?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  await db.collection('iot_devices').deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
} 