import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store has no web implementation — its own docs list Android/iOS/tvOS only, and the
// package's web build (ExpoSecureStore.web.ts) is a literal empty stub, so calling it directly on
// web throws ("getValueWithKeyAsync is not a function") instead of just not persisting anything.
// These wrappers degrade to "no stored value" on web so it doesn't crash the auth check on mount —
// useful since the README points at `expo start --web` for UI-only preview.
const supported = Platform.OS !== "web";

export async function getSecureItem(key: string): Promise<string | null> {
  if (!supported) return null;
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (!supported) return;
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (!supported) return;
  await SecureStore.deleteItemAsync(key);
}
