import { x25519 } from '@noble/curves/ed25519.js';
import { fromByteArray } from 'base64-js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

export interface Keypair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyBase64: string;
}

export async function deriveKeypair(
  password: string,
  phone: string,
  keySalt?: string,
): Promise<Keypair> {
  const enc = new TextEncoder();
  const saltStr = keySalt
    ? `falar:v2:${phone}:${keySalt}`
    : `falar:v1:${phone}`;

  // Exécuter pbkdf2 de manière asynchrone pour éviter de bloquer le thread UI
  // Note: itérations réduites à 10_000 pour éviter blocage sur React Native
  // TODO: migrer vers react-native-quick-crypto pour PBKDF2 natif non-bloquant
  const bits = await new Promise<Uint8Array>((resolve) => {
    setTimeout(() => {
      resolve(
        pbkdf2(sha256, enc.encode(password), enc.encode(saltStr), {
          c: 10_000,
          dkLen: 32,
        }),
      );
    }, 0);
  });

  const privateKey = new Uint8Array(bits);
  const publicKey = x25519.getPublicKey(privateKey);

  return {
    privateKey,
    publicKey,
    publicKeyBase64: fromByteArray(publicKey),
  };
}
