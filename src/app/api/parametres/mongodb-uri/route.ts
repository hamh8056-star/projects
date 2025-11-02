import { NextResponse } from 'next/server';

export async function GET() {
  const uri = process.env.MONGODB_URI || '';
  // En production, il faudrait ajouter une vérification d'authentification/autorisation ici
  return NextResponse.json({ uri });
} 