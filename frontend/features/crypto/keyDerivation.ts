import { scrypt } from '@noble/hashes/scrypt.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { fromByteArray } from 'base64-js';
import { InteractionManager } from 'react-native';

const SCRYPT_PARAMS = { N: 2 ** 12, r: 8, p: 1, dkLen: 32 };

export interface Keypair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyBase64: string;
}

export async function deriveKeypair(password: string, phone: string, keySalt?: string): Promise<Keypair> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      const encoder = new TextEncoder();
      const salt = keySalt
        ? encoder.encode(`falar:v2:${phone}:${keySalt}`)
        : encoder.encode(`falar:v1:${phone}`);
      const masterKey = scrypt(encoder.encode(password), salt, SCRYPT_PARAMS);
      const publicKey = x25519.getPublicKey(masterKey);
      resolve({
        privateKey: masterKey,
        publicKey,
        publicKeyBase64: fromByteArray(publicKey),
      });
    });
  });
}
