import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export function createHash(input: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(input)));
}
