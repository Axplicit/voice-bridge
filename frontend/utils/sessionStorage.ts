import { Platform } from 'react-native';
import type { AuthUser } from '@/api/auth';

const AUTH_USER_KEY = 'voice_bridge_user';

let memoryStore: string | null = null;

function getSessionStorage(): Storage | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return null;
}

export function getSessionUser(): AuthUser | null {
  try {
    const storage = getSessionStorage();
    const raw = storage ? storage.getItem(AUTH_USER_KEY) : memoryStore;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string') {
      return {
        _id: parsed._id || '',
        userId: parsed.userId,
        name: parsed.name
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setSessionUser(user: AuthUser): void {
  const raw = JSON.stringify(user);
  const storage = getSessionStorage();
  if (storage) {
    storage.setItem(AUTH_USER_KEY, raw);
  } else {
    memoryStore = raw;
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.setItem(AUTH_USER_KEY, raw);
    });
  }
}

export function clearSessionUser(): void {
  const storage = getSessionStorage();
  if (storage) {
    storage.removeItem(AUTH_USER_KEY);
  } else {
    memoryStore = null;
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.removeItem(AUTH_USER_KEY);
    });
  }
}

export async function loadSessionUserFromStorage(): Promise<AuthUser | null> {
  if (Platform.OS === 'web') return null;
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string') {
      memoryStore = raw;
      return {
        _id: parsed._id || '',
        userId: parsed.userId,
        name: parsed.name
      };
    }
    return null;
  } catch {
    return null;
  }
}