// app/_layout.js
import { Stack } from 'expo-router';
import React from 'react';

const RootLayout = () => {
  return (
    <Stack>
      
      <Stack.Screen
        name="index" // Assuming your Login screen is app/index.js
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login" // Assuming you have an app/Login.js for manual navigation
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignIn" // Assuming you have an app/SignIn.js
        options={{ headerShown: false }}
      />

      {/* Main App Screens - generally shown after authentication */}
      <Stack.Screen
        name="Home" // Corresponds to app/Home.js
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="mypage" // Corresponds to app/mypage.js
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Pay_contact" // Corresponds to app/Pay_contact.js
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camera" // Corresponds to app/Camera.js
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Contact" // Corresponds to app/Contact.js
        options={{ headerShown: false }}
      />
       <Stack.Screen
        name="Payment" // Corresponds to app/Contact.js
        options={{ headerShown: false }}
      />
      {/* Add other main app screens here as needed */}
    </Stack>
  );
};

export default RootLayout;