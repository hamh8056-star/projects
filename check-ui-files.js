// Script de vérification pour s'assurer que tous les fichiers UI existent
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/components/ui/card.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/Loader.tsx',
  'src/components/ui/index.ts',
  'src/components/dashboard/AdminDashboard.tsx',
  'src/components/dashboard/ObservateurDashboard.tsx',
  'src/components/dashboard/OperateurDashboard.tsx',
];

console.log('🔍 Vérification des fichiers UI...\n');

let allExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (!exists) {
    allExist = false;
  }
});

console.log('\n');

if (allExist) {
  console.log('✅ Tous les fichiers requis existent!');
  process.exit(0);
} else {
  console.log('❌ Certains fichiers sont manquants!');
  console.log('\nAssurez-vous que tous les fichiers sont présents et commités dans Git.');
  process.exit(1);
}

