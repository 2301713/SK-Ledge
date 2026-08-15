import "../global.css";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { supabase } from "@/lib/supabase";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname(); // Switched from useSegments
  const [sessionChecked, setSessionChecked] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    const handleRouting = (session: any) => {
      // Clean, straightforward string matching. No tuple type errors!
      const isAuthScreen = pathname === "/" || pathname === "/register";

      if (!session && !isAuthScreen) {
        // User is NOT logged in, but trying to access private screens -> Kick to Login
        router.replace("/");
      } else if (session && isAuthScreen) {
        // User IS logged in, but sitting on Login/Register -> Push to Dashboard
        router.replace("/(tabs)/home");
      }
    };

    // 1. Check the session immediately when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleRouting(session);
      setSessionChecked(true);
    });

    // 2. Listen for login/logout events in real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleRouting(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (!sessionChecked || !fontsLoaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public Auth Screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />

        {/* Private Tabbed Screens */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
