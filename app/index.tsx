import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator, // Import ActivityIndicator for loading state
} from 'react-native';
// Correct way to import auth from @react-native-firebase
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '117652753991-ft7ta0356tqh9snqjcpuig2kb51r3cbv.apps.googleusercontent.com',
});

const index = () => { // Changed back to 'index'
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // New loading state

  // You might want to check the auth state on mount to automatically navigate
  // if a user is already logged in, or handle it in your App.js/Navigator.
  // For simplicity, we'll keep the login form visible if not logged in.
  // If you want to automatically navigate, you'd add an onAuthStateChanged listener here.

  const loginUser = async () => { // Made async to use await
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true); // Start loading
    try {
      const response = await auth().signInWithEmailAndPassword(email, password);
      Alert.alert('Success', 'Logged in successfully!');
      console.log('User logged in:', response.user.email);
      navigation.navigate('Home'); // Navigate to your Home screen
    } catch (error) {
      console.error('Email/Password Login Error:', error); // Log the full error
      let errorMessage = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email. Please check the email or sign up.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is invalid.';
          break;
        case 'auth/invalid-credential': // Firebase v9 often uses this for general credential issues
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        default:
          errorMessage = error.message; // Fallback to Firebase's message
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const onGoogleButtonPress = async () => {
    setLoading(true); // Start loading
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn(); // Get the full result object

      let idToken;
      // Try the new style (v13+), then fallback to older styles
      if (signInResult.idToken) { // This handles most common cases (direct property)
        idToken = signInResult.idToken;
      } else if (signInResult.user && signInResult.user.idToken) { // Sometimes nested under 'user' (older older)
        idToken = signInResult.user.idToken;
      } else if (signInResult.data && signInResult.data.idToken) { // For the specific 'data' property
        idToken = signInResult.data.idToken;
      }


      if (!idToken) {
        // If after all attempts, no ID token is found, throw an error
        throw new Error('Google Sign-In failed: No ID token found after sign-in.');
      }

      // Create a Firebase credential with the Google ID token
      // Ensure GoogleAuthProvider is imported or correctly referenced
      const googleCredential = auth.GoogleAuthProvider.credential(idToken); // Use the extracted idToken

      // Sign in to Firebase with the Google credential
      const userSignIn = await auth().signInWithCredential(googleCredential);

      Alert.alert('Success', 'Signed in with Google!');
      console.log('User signed in with Google:', userSignIn.user.email);
      navigation.navigate('Home');

    } catch (rawError) {
      console.error('*** RAW Google Sign-In Error Caught:', rawError);

      let errorMessage = 'An unexpected Google Sign-In error occurred.';
      let errorTitle = 'Google Sign-In Failed';

      if (rawError === undefined || rawError === null) {
        errorMessage = 'An extremely unusual error: The error object was null/undefined.';
        Alert.alert(errorTitle, errorMessage);
        setLoading(false);
        return;
      }

      if (typeof rawError === 'object' && rawError !== null && rawError.code) {
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
    <View style={styles.container}>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f09819" />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      )}

      <Text style={styles.heading}>WELCOME</Text>
      <Text style={styles.heading}>BACK!</Text>

      <TextInput
        style={styles.inputbox}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#ccc"
        editable={!loading} // Disable input while loading
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={{ flex: 1, fontSize: 20, color: '#e1e3ea' }}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#ccc"
          editable={!loading} // Disable input while loading
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
          <AntDesignIcon
            name={showPassword ? 'eye' : 'eyeo'}
            size={24}
            color="#ccc"
            style={{ paddingHorizontal: 10 }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.button} onPress={loginUser} disabled={loading}>
          <AntDesignIcon name="arrowright" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={loading}>
          <Text style={styles.sign}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>

      {/* Corrected: Added onPress prop */}
      <TouchableOpacity style={styles.googleButton} onPress={onGoogleButtonPress} disabled={loading}>
        <Image style={{ height: 50, width: 50 }} source={require('../assets/images/google.png')} />   \
           </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1d1e',
    paddingTop: 50,
    padding: 20,
  },
  heading: {
    fontSize: 50,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputbox: {
    padding: 10,
    color: '#e1e3ea',
    marginTop: 20,
    backgroundColor: '#434242',
    fontSize: 20,
    borderRadius: 10,
    elevation: 10,
    width: '100%',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#434242',
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 10,
    elevation: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sign: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#f09819',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    elevation: 5,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#343436',
    margin: 10,
    padding: 5,
    borderRadius: 100,
    alignSelf: 'center',
    alignItems: 'center',
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
  },
});

export default index; // Changed back to 'index' for export
