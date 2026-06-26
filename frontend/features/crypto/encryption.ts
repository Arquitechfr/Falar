import { x25519 } from '@noble/curves/ed25519.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { toByteArray, fromByteArray } from 'base64-js';

export interface EncryptedMessage {
  encryptedPayload: string;
  nonce: string;
}

export function encryptMessage(
  plaintext: string,
  senderPrivKey: Uint8Array,
  recipientPubKeyBase64: string,
): EncryptedMessage {
  try {
    const recipientPubKey = toByteArray(recipientPubKeyBase64);
    const sharedSecret = x25519.getSharedSecret(senderPrivKey, recipientPubKey);
    const nonce = randomBytes(12);
    const cipher = chacha20poly1305(sharedSecret, nonce);
    const encrypted = cipher.encrypt(new TextEncoder().encode(plaintext));
    return {
      encryptedPayload: fromByteArray(encrypted),
      nonce: fromByteArray(nonce),
    };
  } catch {
    throw new Error('Encryption failed');
  }
}

export function decryptMessage(
  encryptedPayload: string,
  nonce: string,
  recipientPrivKey: Uint8Array,
  senderPubKeyBase64: string,
): string | null {
  try {
    const senderPubKey = toByteArray(senderPubKeyBase64);
    const sharedSecret = x25519.getSharedSecret(recipientPrivKey, senderPubKey);
    const cipher = chacha20poly1305(sharedSecret, toByteArray(nonce));
    const decrypted = cipher.decrypt(toByteArray(encryptedPayload));
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}
