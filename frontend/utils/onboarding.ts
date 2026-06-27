import * as SecureStore from 'expo-secure-store';

const KEY = 'falar_onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, 'true');
  } catch {
    // silent fail
  }
}
