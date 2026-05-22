import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve central database environment file
const dbEnvPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(dbEnvPath)) {
  console.error('❌ Error: backend/packages/database/.env does not exist.');
  process.exit(1);
}

const dbContent = fs.readFileSync(dbEnvPath, 'utf8');
// Matches active (uncommented) DATABASE_URL declaration
const match = dbContent.match(/^DATABASE_URL\s*=\s*(.*)$/m);
if (!match) {
  console.error('❌ Error: Active DATABASE_URL not found in backend/packages/database/.env.');
  console.error('💡 Please make sure you uncommented and populated the DATABASE_URL line.');
  process.exit(1);
}

const dbUrlLine = match[0];

const services = [
  'auth-service',
  'user-service',
  'notification-service',
  'performance-review-service',
  'feedback-service',
  'analytics-service'
];

console.log('🔄 Synchronizing DATABASE_URL environment variable to microservices...');

let successCount = 0;
for (const service of services) {
  const serviceEnvPath = path.resolve(__dirname, `../../services/${service}/.env`);
  if (!fs.existsSync(serviceEnvPath)) {
    console.log(`⚠️  Skipping ${service}: .env file not found.`);
    continue;
  }

  let content = fs.readFileSync(serviceEnvPath, 'utf8');
  if (content.match(/^DATABASE_URL\s*=/m)) {
    // Overwrite the existing active DATABASE_URL configuration
    content = content.replace(/^DATABASE_URL\s*=.*/m, dbUrlLine);
  } else {
    // Append it securely
    content += `\n\n# Synchronized DATABASE_URL\n${dbUrlLine}\n`;
  }
  
  fs.writeFileSync(serviceEnvPath, content, 'utf8');
  console.log(`✅ Propagated to backend/services/${service}/.env`);
  successCount++;
}

console.log(`\n🎉 Success! Propagated DATABASE_URL to ${successCount} microservices!`);
