// app/(authentication)/_layout.tsx
import { Stack } from 'expo-router'; // Correct: Import Stack from expo-router
import React from 'react'; // Keep React import

// You typically don't need auth state management directly in a nested layout like this.
// The main app/_layout.tsx handles the overall auth check and conditionally renders
// this (authentication) group or the main app group.
// So, removing getAuth, onAuthStateChanged, GoogleSignin, useEffect, useState from here.

const AuthStackLayout = () => {
  return (
    <Stack>
      {/*
        'index' will be the default route for this (authentication) group.
        If your Login screen is located at `app/(authentication)/index.js`,
        then this is the correct way to define it.
        The 'component' prop is NOT used in expo-router's Stack.Screen.
      */}
      <Stack.Screen
        name="index" // Corresponds to app/(authentication)/index.js (your Login screen)
        options={{ headerShown: false }}
      />
      {/*
        If you have a separate file named `Login.js` inside `app/(authentication)`,
        you would list it here. Otherwise, 'index' is typically your main entry.
        I'm commenting it out, assuming 'index' is your primary login screen.
      */}
      {/*
      <Stack.Screen
        name="Login" // Corresponds to app/(authentication)/Login.js
        options={{ headerShown: false }}
      />
      */}
      <Stack.Screen
        name="SignIn" // Corresponds to app/(authentication)/SignIn.js
        options={{ headerShown: false }}
      />
      {/* Add any other authentication-related screens within this group as needed */}
    </Stack>
  );
};

export default AuthStackLayout;