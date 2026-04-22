import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMProvider } from '../types';

interface StoredKey {
  id: string;
  provider: string;
  label: string | null;
  created_at: string;
}

interface SettingsState {
  storedKeys: StoredKey[];
  defaultProvider: LLMProvider;
  setStoredKeys: (keys: StoredKey[]) => void;
  addStoredKey: (key: StoredKey) => void;
  removeStoredKey: (id: string) => void;
  setDefaultProvider: (provider: LLMProvider) => void;
  hasKeyForProvider: (provider: LLMProvider) => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      storedKeys: [],
      defaultProvider: 'openai',

      setStoredKeys: (keys) => set({ storedKeys: keys }),
      addStoredKey: (key) =>
        set((s) => ({
          storedKeys: [...s.storedKeys.filter((k) => k.provider !== key.provider), key],
        })),
      removeStoredKey: (id) =>
        set((s) => ({ storedKeys: s.storedKeys.filter((k) => k.id !== id) })),
      setDefaultProvider: (provider) => set({ defaultProvider: provider }),
      hasKeyForProvider: (provider) =>
        get().storedKeys.some((k) => k.provider === provider),
    }),
    {
      name: 'research-agent-settings',
    }
  )
);
