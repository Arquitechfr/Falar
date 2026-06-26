import { create } from 'zustand';

interface CryptoState {
  privateKey: Uint8Array | null;
  publicKey: Uint8Array | null;
  setKeys: (privateKey: Uint8Array, publicKey: Uint8Array) => void;
  clearKeys: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
  privateKey: null,
  publicKey: null,
  setKeys: (privateKey, publicKey) => set({ privateKey, publicKey }),
  clearKeys: () => set({ privateKey: null, publicKey: null }),
}));
