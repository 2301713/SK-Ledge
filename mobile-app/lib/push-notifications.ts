import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

const TOKEN_STORAGE_KEY = "skledge.pushToken";

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
  (
    Constants.expoConfig?.extra as
      | { eas?: { projectId?: string } }
      | undefined
  )?.eas?.projectId ??
  (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

let cachedToken: string | null = null;
let inFlight: Promise<string | null> | null = null;

async function requestToken(): Promise<string | null> {
  if (!Device.isDevice || !EAS_PROJECT_ID) return null;

  if (Platform.OS === "android") {
    await setNotificationChannelAsync("default", {
      name: "Default",
      importance: AndroidImportance.HIGH,
    });
  }

  const existing = await getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  const token = (
    await getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })
  ).data;

  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

/**
 * Best-effort: a push opt-out must never block the application or dashboard.
 */
export async function registerPushToken(): Promise<string | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const token =
        cachedToken ??
        (await AsyncStorage.getItem(TOKEN_STORAGE_KEY)) ??
        (await requestToken());

      if (!token) return null;

      // Upsert every time: on a shared device the token may still be mapped to
      // a previous account, and the RPC reassigns it to the current session.
      const { error } = await supabase.rpc("register_push_token", {
        p_expo_token: token,
        p_platform: Platform.OS,
      });
      if (error) throw error;

      cachedToken = token;
      return token;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function unregisterPushToken(): Promise<void> {
  const token =
    cachedToken ?? (await AsyncStorage.getItem(TOKEN_STORAGE_KEY));

  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);

  if (!token) return;

  try {
    await supabase.rpc("remove_push_token", { p_expo_token: token });
  } catch {
    // Logging out must not fail because push cleanup did.
  }
}
