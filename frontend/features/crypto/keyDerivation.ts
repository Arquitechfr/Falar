import { x25519 } from '@noble/curves/ed25519.js';
import { fromByteArray } from 'base64-js';

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

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltStr),
      iterations: 300_000,
      hash: 'SHA-256',
    },
    baseKey,
    256,
  );

  const privateKey = new Uint8Array(bits);
  const publicKey = x25519.getPublicKey(privateKey);

  return {
    privateKey,
    publicKey,
    publicKeyBase64: fromByteArray(publicKey),
  };
}
