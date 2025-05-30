import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput, // Not used in this component, can be removed if not needed
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import { useNavigation } from 'expo-router'; // CORRECTED: Import useNavigation from expo-router
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'; // CORRECTED: Import statusCodes
import firestore from '@react-native-firebase/firestore';

// Configure Google Sign-In (should ideally be done once at app startup, e.g., in _layout.js or App.js)
GoogleSignin.configure({
  webClientId: process.env.WEB_CLIENT_ID, // Ensure this env variable is correctly set up in your Expo project
  // If you also need iOS or Android client IDs, add them here:
  // iosClientId: 'YOUR_IOS_CLIENT_ID',
  // androidClientId: 'YOUR_ANDROID_CLIENT_ID',
});

const Google = () => {
  const navigation = useNavigation();
  // Removed unused state variables (email, showPassword, password)
  const [loading, setLoading] = useState(false);

  const onGoogleButtonPress = async () => {
    setLoading(true);
    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();

      let idToken;
      if (signInResult.idToken) {
        idToken = signInResult.idToken;
      } else if (signInResult.user && signInResult.user.idToken) {
        idToken = signInResult.user.idToken;
      } else if (signInResult.data && signInResult.data.idToken) {
        idToken = signInResult.data.idToken;
      }

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token found after sign-in.');
      }

      // Create a Firebase credential with the Google ID token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with the credential
      const userSignIn = await auth().signInWithCredential(googleCredential);
      const user = userSignIn.user;

      console.log('User signed in with Google:', user.displayName, user.email, user.uid);

      // Save user data to Firestore, using { merge: true } to preserve existing fields
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set(
          {
            email: user.email,
            username: user.displayName,
            createdAt: firestore.FieldValue.serverTimestamp(),
            // Initialize balance to 0 for new users, or preserve if it exists
            balance: firestore.FieldValue.increment(0), // Use increment(0) to ensure field exists without overwriting
          },
          { merge: true } // IMPORTANT: This ensures existing fields like 'balance' are not overwritten
        );

      console.log('User data saved/merged to Firestore!');
     

    } catch (rawError) {
      console.error('*** RAW Google Sign-In Error Caught:', rawError);

      let errorMessage = 'An unexpected Google Sign-In error occurred.';
      let errorTitle = 'Google Sign-In Failed';

      if (rawError === undefined || rawError === null) {
        errorMessage = 'An extremely unusual error: The error object was null/undefined.';
      } else if (typeof rawError === 'object' && rawError !== null && rawError.code) {
        switch (rawError.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            errorMessage = 'Google Sign-In was cancelled by the user.';
            break;
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Google Sign-In is already in progress.';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Google Play Services are not available on this device.';
            break;
          case statusCodes.DEVELOPER_ERROR:
            errorMessage = 'DEVELOPER_ERROR: Your app\'s SHA-1 fingerprint is likely misconfigured in Firebase/Google Cloud Console. Please check your SHA-1 keys for debug and release builds, especially the App Signing Key from Google Play Console.';
            errorTitle = 'Configuration Error';
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'An account with this email already exists but with a different sign-in method.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'The Google credential is invalid or has expired.';
            break;
          default:
            errorMessage = rawError.message || `An unknown error occurred with code: ${rawError.code}`;
            break;
        }
      } else if (typeof rawError === 'object' && rawError !== null && rawError.message) {
        errorMessage = rawError.message;
      } else if (typeof rawError === 'string') {
        errorMessage = `An unexpected string error: ${rawError}`;
      } else {
        errorMessage = `An unexpected error type occurred. Check console for: ${JSON.stringify(rawError)}`;
      }

      Alert.alert(errorTitle, errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#66d9ef" /> {/* Consistent accent color */}
          <Text style={styles.loadingText}>Authenticating with Google...</Text>
        </View>
      )}
      <TouchableOpacity style={styles.googleButton} onPress={onGoogleButtonPress} disabled={loading}>
        <Image style={styles.googleIcon} source={require('../../assets/images/google.png')} />
      </TouchableOpacity>
    </View>
  );
};

export default Google;

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    margin: 10,
    padding: 5,
    borderRadius: 100,
    alignSelf: 'center',
    alignItems: 'center',
    // You can add a subtle background like '#3a3a3a' if you want it more prominent
    // backgroundColor: '#3a3a3a',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 5,
    // elevation: 5,
  },
  googleIcon: {
    height: 50,
    width: 50,
    borderRadius: 25, // Make it circular if the image is square
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, // Covers the entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it's on top
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  // Removed unused 'image' style
});