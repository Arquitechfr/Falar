import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../src/modules/users/user.model.js';
import { generateUsername } from '../src/utils/usernameGenerator.js';

const { MONGODB_URI } = process.env;

const log = (msg: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
  const colors: Record<string, string> = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}[${type.toUpperCase()}]${reset} ${msg}`);
};

function hashPhoneNumber(phoneNumber: string): string {
  return crypto
    .createHash('sha256')
    .update(phoneNumber)
    .digest('hex')
    .substring(0, 16);
}

function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

function generateTestPublicKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

async function createUser(phone: string, publicKey?: string, displayName?: string) {
  if (!validateE164(phone)) {
    log('Numéro de téléphone invalide. Format attendu: E.164 (ex: +33612345678)', 'error');
    process.exit(1);
  }

  const finalPublicKey = publicKey || generateTestPublicKey();
  if (!publicKey) {
    log(`Clé publique générée (test): ${finalPublicKey}`, 'info');
  }

  const phoneHash = hashPhoneNumber(phone);
  log(`Hash du téléphone: ${phoneHash}...`, 'info');

  const existingUser = await User.findOne({ phoneHash });
  if (existingUser) {
    log(`Utilisateur déjà existant avec ID: ${existingUser._id}`, 'warn');
    return existingUser;
  }

  const maskedPhone = phone.slice(0, 4) + '****' + phone.slice(-2);
  const username = await generateUsername(phone);

  const user = await User.create({
    phoneHash,
    phoneE164: phone,
    publicKey: finalPublicKey,
    displayName: displayName || maskedPhone,
    username,
  });

  log(`Utilisateur créé avec succès`, 'success');
  log(`ID: ${user._id}`, 'info');
  log(`Téléphone: ${user.phoneE164}`, 'info');
  log(`Username: ${user.username}`, 'info');
  log(`Display Name: ${user.displayName}`, 'info');

  return user;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    log('Usage: tsx --env-file=.env scripts/create-user.ts <phone> [publicKey] [displayName]', 'info');
    log('Exemple: tsx --env-file=.env scripts/create-user.ts "+33612345678"', 'info');
    log('Exemple avec clé: tsx --env-file=.env scripts/create-user.ts "+33612345678" "base64publickey" "John Doe"', 'info');
    process.exit(1);
  }

  const [phone, publicKey, displayName] = args;

  if (!MONGODB_URI) {
    log('MONGODB_URI non défini dans .env', 'error');
    process.exit(1);
  }

  try {
    log('Connexion à MongoDB...', 'info');
    await mongoose.connect(MONGODB_URI);
    log('Connecté à MongoDB', 'success');

    await createUser(phone, publicKey, displayName);

    await mongoose.disconnect();
    log('Déconnexion réussie', 'success');
    process.exit(0);
  } catch (err) {
    log(`Erreur: ${(err as Error).message}`, 'error');
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
