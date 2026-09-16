import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const memoryStore: Record<string, string> = {};

export const appStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(name);
        }
      } catch {
        return memoryStore[name] || null;
      }
      return memoryStore[name] || null;
    }

    try {
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${name}.json`;
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists) {
          return await FileSystem.readAsStringAsync(fileUri);
        }
      }
    } catch (e) {
      console.warn(`[appStorage] getItem failed for ${name}:`, e);
    }
    return memoryStore[name] || null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    memoryStore[name] = value;
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(name, value);
        }
      } catch {}
      return;
    }

    try {
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${name}.json`;
        await FileSystem.writeAsStringAsync(fileUri, value);
      }
    } catch (e) {
      console.warn(`[appStorage] setItem failed for ${name}:`, e);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    delete memoryStore[name];
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(name);
        }
      } catch {}
      return;
    }

    try {
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${name}.json`;
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      }
    } catch (e) {
      console.warn(`[appStorage] removeItem failed for ${name}:`, e);
    }
  },
};
