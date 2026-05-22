import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple .env parser to read DATABASE_URL without relying on external packages
function loadEnvDatabaseUrl() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return null;
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }
    const [key, ...valueParts] = trimmed.split('=');
    if (key.trim() === 'DATABASE_URL') {
      let value = valueParts.join('=').trim();
      // Remove surrounding quotes if any
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return value;
    }
  }
  return null;
}

async function testConnection() {
  console.log('🔍 Validating NATIVE MongoDB Atlas Connection...');
  
  const databaseUrl = loadEnvDatabaseUrl() || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL not found in environment or .env file.');
    console.error('💡 Please verify that backend/packages/database/.env contains DATABASE_URL.');
    process.exit(1);
  }

  // Obfuscate credentials for secure logging
  let maskedUrl = databaseUrl;
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.password) {
      parsed.password = '******';
    }
    maskedUrl = parsed.toString();
  } catch (e) {
    // If parsing fails, mask manually
    maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':******@');
  }

  console.log(`🔌 Attempting connection using native driver: ${maskedUrl}`);

  const client = new MongoClient(databaseUrl);

  try {
    const startTime = Date.now();
    await client.connect();
    
    // Run a ping command on the database to confirm connection
    console.log('📡 Connected successfully. Sending ping...');
    const db = client.db();
    await db.command({ ping: 1 });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ SUCCESS! Successfully connected natively to MongoDB Atlas in ${duration}s! ✨`);
    console.log('🚀 Connection fully verified. Ready for native seeding and server operations.');
  } catch (error) {
    console.error('\n❌ Connection failed with the following error:\n');
    console.error(error);
    
    console.log('\n🛠️  Troubleshooting Guide:');
    
    const errorStr = String(error);
    if (errorStr.includes('Authentication failed') || errorStr.includes('auth failed')) {
      console.log('👉 [AUTHENTICATION ERROR]: Please double-check the username and password in your DATABASE_URL.');
      console.log('   Ensure special characters in your password are properly URL-encoded (e.g., @ should be %40).');
    } else if (errorStr.includes('ENOTFOUND') || errorStr.includes('timed out') || errorStr.includes('ClosedConnection')) {
      console.log('👉 [NETWORK / FIREWALL ERROR]: Could not reach the MongoDB Atlas cluster.');
      console.log('   1. Check your internet connection.');
      console.log('   2. Log in to MongoDB Atlas and navigate to "Network Access".');
      console.log('   3. Ensure your current IP address (or 0.0.0.0/0 for all) is added to the IP Access List.');
    } else {
      console.log('👉 [CONFIGURATION ERROR]: General setup error.');
      console.log('   Ensure the connection string matches the format:');
      console.log('   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/epfms?retryWrites=true&w=majority');
    }
    
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
