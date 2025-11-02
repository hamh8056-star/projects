import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const bassins = await db.collection('bassins').find().toArray();
  return NextResponse.json(bassins);
}

export async function POST(req: Request) {
  const body = await req.json();
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('bassins').insertOne(body);
  return NextResponse.json({ insertedId: result.insertedId });
} 