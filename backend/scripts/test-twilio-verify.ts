import twilio from 'twilio';
import readline from 'readline';
import crypto from 'crypto';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID,
} = process.env;

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

function validateEnv(): boolean {
  const required = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_VERIFY_SERVICE_SID',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    log(`Variables d'environnement manquantes : ${missing.join(', ')}`, 'error');
    log('Assurez-vous d\'avoir configuré TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_VERIFY_SERVICE_SID dans .env', 'warn');
    return false;
  }
  return true;
}

function validatePhoneNumber(phoneNumber: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
}

async function testSendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; verificationSid?: string }> {
  try {
    log('Envoi du code OTP...', 'info');
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        channel: 'sms',
        to: phoneNumber,
      });

    const phoneHash = hashPhoneNumber(phoneNumber);
    log(`OTP envoyé à ${phoneHash}... (SID: ${verification.sid})`, 'success');
    log(`Statut: ${verification.status}`, 'info');
    
    return {
      success: true,
      message: 'Code envoyé avec succès',
      verificationSid: verification.sid,
    };
  } catch (err) {
    const errorMessage = (err as Error).message;
    log(`Erreur envoi OTP: ${errorMessage}`, 'error');
    return {
      success: false,
      message: errorMessage,
    };
  }
}

async function testVerifyOtp(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
  try {
    log('Vérification du code...', 'info');
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    const verificationCheck = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    const phoneHash = hashPhoneNumber(phoneNumber);
    
    if (verificationCheck.status === 'approved') {
      log(`Code validé pour ${phoneHash}...`, 'success');
      return {
        success: true,
        message: 'Vérification réussie',
      };
    } else {
      log(`Code invalide pour ${phoneHash}... (statut: ${verificationCheck.status})`, 'error');
      return {
        success: false,
        message: `Code invalide (statut: ${verificationCheck.status})`,
      };
    }
  } catch (err) {
    const errorMessage = (err as Error).message;
    log(`Erreur vérification OTP: ${errorMessage}`, 'error');
    return {
      success: false,
      message: errorMessage,
    };
  }
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  log('Test Twilio Verify pour Falar', 'info');
  console.log('');

  if (!validateEnv()) {
    process.exit(1);
  }

  try {
    const phoneNumber = await askQuestion('Entrez votre numéro de téléphone (format E.164, ex: +33612345678): ');
    
    if (!validatePhoneNumber(phoneNumber)) {
      log('Format de numéro invalide. Doit être au format E.164 (ex: +33612345678)', 'error');
      process.exit(1);
    }

    const phoneHash = hashPhoneNumber(phoneNumber);
    log(`Numéro: ${phoneHash}...`, 'info');
    console.log('');

    const sendResult = await testSendOtp(phoneNumber);
    
    if (!sendResult.success) {
      log('Échec de l\'envoi du code OTP', 'error');
      process.exit(1);
    }

    console.log('');
    log('Veuillez saisir le code reçu par SMS', 'info');
    const code = await askQuestion('Code OTP (6 chiffres): ');

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      log('Code invalide. Doit contenir 6 chiffres.', 'error');
      process.exit(1);
    }

    console.log('');
    const verifyResult = await testVerifyOtp(phoneNumber, code);

    console.log('');
    if (verifyResult.success) {
      log('✓ Test Twilio Verify réussi', 'success');
      log('Le service est opérationnel', 'success');
      process.exit(0);
    } else {
      log('✗ Test Twilio Verify échoué', 'error');
      log(verifyResult.message, 'error');
      process.exit(1);
    }
  } catch (err) {
    log(`Erreur inattendue : ${(err as Error).message}`, 'error');
    process.exit(1);
  }
}

main();
