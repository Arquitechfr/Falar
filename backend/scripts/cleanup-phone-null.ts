import mongoose from 'mongoose';

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

async function main() {
  if (!MONGODB_URI) {
    log('MONGODB_URI non défini dans .env', 'error');
    process.exit(1);
  }

  try {
    log('Connexion à MongoDB...', 'info');
    await mongoose.connect(MONGODB_URI);
    log('Connecté à MongoDB', 'success');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    log('Recherche de documents avec phone: null...', 'info');
    const nullPhoneDocs = await usersCollection.find({ phone: null }).toArray();

    if (nullPhoneDocs.length === 0) {
      log('Aucun document avec phone: null trouvé', 'success');
    } else {
      log(`${nullPhoneDocs.length} document(s) avec phone: null trouvé(s)`, 'warn');
      
      for (const doc of nullPhoneDocs) {
        log(`Suppression du document _id: ${doc._id}`, 'info');
        await usersCollection.deleteOne({ _id: doc._id });
      }
      log(`${nullPhoneDocs.length} document(s) supprimé(s)`, 'success');
    }

    log('Vérification des indexes...', 'info');
    const indexes = await usersCollection.indexes();
    const phoneIndex = indexes.find(idx => idx.key?.phone);
    
    if (phoneIndex) {
      log(`Index trouvé sur 'phone': ${JSON.stringify(phoneIndex)}`, 'warn');
      log('Pour supprimer cet index, exécutez dans MongoDB shell:', 'info');
      log(`db.users.dropIndex('${phoneIndex.name}')`, 'info');
    } else {
      log('Aucun index sur le champ "phone" trouvé', 'success');
    }

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
