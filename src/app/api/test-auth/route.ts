import { NextResponse } from "next/server";

export async function GET() {
  const hasSecret = !!process.env.NEXTAUTH_SECRET;
  const secretLength = process.env.NEXTAUTH_SECRET?.length || 0;
  const hasMongoUri = !!process.env.MONGODB_URI;
  
  return NextResponse.json({
    nextauth: {
      secretExists: hasSecret,
      secretLength: secretLength,
      secretPreview: process.env.NEXTAUTH_SECRET ? 
        process.env.NEXTAUTH_SECRET.substring(0, 10) + "..." : 
        "NON DÉFINI"
    },
    mongodb: {
      uriExists: hasMongoUri,
      uriPreview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 20) + "..." : 
        "NON DÉFINI"
    },
    nodeEnv: process.env.NODE_ENV,
    message: hasSecret ? 
      "✅ NEXTAUTH_SECRET est défini" : 
      "❌ ERREUR: NEXTAUTH_SECRET n'est pas défini - L'authentification ne fonctionnera pas!"
  });
}

