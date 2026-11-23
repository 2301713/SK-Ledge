import "../global.css";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { supabase } from "@/lib/supabase";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Stack, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname(); // Switched from useSegments
  const [sessionChecked, setSessionChecked] = useState(false);
  const pathnameRef = useRef(pathname);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  // Read through a ref so a new route never re-creates the auth subscription.
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const handleRouting = useCallback(
    (session: { user: unknown } | null) => {
      // Clean, straightforward string matching. No tuple type errors!
      // OAuth screens manage their own navigation: the callback still needs a
      // session while it verifies the vendor role, and a new Google account
      // must be allowed to finish its application while signed in.
      const currentPath = pathnameRef.current;
      const isAuthFlowScreen = currentPath.startsWith("/auth/");
      const isAuthScreen =
        currentPath === "/" || currentPath === "/register" || isAuthFlowScreen;

      if (!session && !isAuthScreen) {
        // User is NOT logged in, but trying to access private screens -> Kick to Login
        router.replace("/");
      } else if (session && isAuthScreen && !isAuthFlowScreen) {
        // User IS logged in, but sitting on Login/Register -> Push to Dashboard
        router.replace("/(tabs)/home");
      }
    },
    [router],
  );

  useEffect(() => {
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
  }, [handleRouting]);

  if (!sessionChecked || !fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Public Auth Screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="register" />

          {/* Private Tabbed Screens */}
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ErrorBoundary>
    </>
  );
}
