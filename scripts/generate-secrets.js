#!/usr/bin/env node

/**
 * Script pour générer automatiquement les secrets nécessaires pour Railway
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 === GÉNÉRATION DES SECRETS POUR RAILWAY ===\n');

const nextAuthSecret = crypto.randomBytes(32).toString('base64');
const iotToken = crypto.randomBytes(16).toString('hex');

console.log('📋 Copiez ces valeurs dans Railway → Variables :\n');
console.log('─'.repeat(60));
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log(`IOT_WS_TOKEN=${iotToken}`);
console.log(`NEXT_PUBLIC_IOT_WS_TOKEN=${iotToken}`);
console.log('─'.repeat(60));

console.log('\n✅ Secrets générés avec succès !\n');
console.log('📝 Prochaines étapes :');
console.log('   1. Allez sur railway.app');
console.log('   2. Créez un nouveau projet');
console.log('   3. Connectez votre repository GitHub');
console.log('   4. Ajoutez ces variables dans Variables');
console.log('   5. Ajoutez MONGODB_URI (depuis MongoDB Atlas)');
console.log('   6. Ajoutez NEXTAUTH_URL (après avoir obtenu l\'URL Railway)');
console.log('\n');

