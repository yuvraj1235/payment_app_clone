// RootLayout.tsx
import React, { SetStateAction, useEffect, useState } from "react";
import { Stack } from "expo-router"; // Assuming this is your entry point for expo-router
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'; // Corrected import for auth and its types
import 'react-native-get-random-values'; // Required for some Firebase/UUID functionalities

// Configure Google Sign-In with your webClientId
// Ensure process.env.EXPO_PUBLIC_WEB_CLIENT_ID is correctly set in your .env file
GoogleSignin.configure({
  webClientId: '117652753991-ft7ta0356tqh9snqjcpuig2kb51r3cbv.apps.googleusercontent.com',
});

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  // Type the user state as FirebaseAuthTypes.User (Firebase's User object) or null
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // Handle user state changes
  // The 'user' parameter here will be FirebaseAuthTypes.User or null
  function handleAuthStateChanged(firebaseUser: FirebaseAuthTypes.User | null) {
    setUser(firebaseUser);
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    // Correctly subscribe to Firebase authentication state changes
    // Call onAuthStateChanged on the auth() instance itself
    const subscriber = auth().onAuthStateChanged(handleAuthStateChanged);

    // Unsubscribe on component unmount to prevent memory leaks
    return subscriber;
  }, []); // Empty dependency array means this effect runs once on mount

  // If the app is still initializing (checking auth status), render nothing
  if (initializing) {
    return null;
  }

  return (
    <Stack>
      {/* Protected routes for authenticated users */}
      {/* guard={!!user} is correct to check if user is not null */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Protected routes for unauthenticated users (e.g., login/signup) */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(authentication)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}