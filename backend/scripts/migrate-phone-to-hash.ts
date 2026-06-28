import mongoose from 'mongoose';
import crypto from 'crypto';
import { env } from '../src/config/env.js';

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
    .digest('hex');
}

async function migrate() {
  log('Migration des numéros de téléphone vers hash SHA-256', 'info');
  console.log('');

  try {
    await mongoose.connect(env.MONGODB_URI);
    log('Connecté à MongoDB', 'success');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const totalUsers = await usersCollection.countDocuments();
    log(`Nombre total d'utilisateurs: ${totalUsers}`, 'info');

    if (totalUsers === 0) {
      log('Aucun utilisateur à migrer', 'warn');
      await mongoose.disconnect();
      return;
    }

    const users = await usersCollection.find({}).toArray();

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        if (!user.phone) {
          log(`Utilisateur ${user._id}: pas de champ phone, ignoré`, 'warn');
          skipped++;
          continue;
        }

        if (user.phoneHash) {
          log(`Utilisateur ${user._id}: déjà migré, ignoré`, 'warn');
          skipped++;
          continue;
        }

        const phoneHash = hashPhoneNumber(user.phone);
        const phoneE164 = user.phone;

        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              phoneHash,
              phoneE164,
            },
            $unset: {
              phone: '',
            },
          }
        );

        const maskedPhone = phoneE164.slice(0, 4) + '****' + phoneE164.slice(-2);
        log(`Utilisateur ${user._id} (${maskedPhone}): migré`, 'success');
        migrated++;
      } catch (err) {
        log(`Erreur migration utilisateur ${user._id}: ${(err as Error).message}`, 'error');
        errors++;
      }
    }

    console.log('');
    log('Résultat de la migration', 'info');
    log(`Migrés: ${migrated}`, 'success');
    log(`Ignorés: ${skipped}`, 'warn');
    log(`Erreurs: ${errors}`, errors > 0 ? 'error' : 'info');

    await mongoose.disconnect();
    log('Déconnecté de MongoDB', 'info');

    if (errors > 0) {
      process.exit(1);
    }
  } catch (err) {
    log(`Erreur critique: ${(err as Error).message}`, 'error');
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

migrate();
