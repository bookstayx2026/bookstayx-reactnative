import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const SESSION_KEY = "bookstayx.auth.session.v1";
export async function readStoredSession() { if (Platform.OS === "web") return globalThis.localStorage?.getItem(SESSION_KEY) ?? null; return SecureStore.getItemAsync(SESSION_KEY); }
export async function writeStoredSession(value: string | null) { if (Platform.OS === "web") { if (value) globalThis.localStorage?.setItem(SESSION_KEY, value); else globalThis.localStorage?.removeItem(SESSION_KEY); return; } if (value) await SecureStore.setItemAsync(SESSION_KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }); else await SecureStore.deleteItemAsync(SESSION_KEY); }
