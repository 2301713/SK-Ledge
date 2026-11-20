import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile-app/.env, then restart the " +
      "dev server with `npx expo start -c`.",
  );
}

// During Expo's web static render the app is evaluated in Node, where
// AsyncStorage's web implementation touches `window` and crashes the render.
const memoryStorage = new Map<string, string>();
const ssrSafeStorage = {
  getItem: async (key: string) => memoryStorage.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    memoryStorage.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStorage.delete(key);
  },
};

const authStorage = typeof window === "undefined" ? ssrSafeStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
