import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
GoogleSignin.configure({
  webClientId: process.env.WEB_CLIENT_ID,
});



const Google = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onGoogleButtonPress = async () => {
    setLoading(true); 
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
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

      const googleCredential = auth.GoogleAuthProvider.credential(idToken); 
      const userSignIn = await auth().signInWithCredential(googleCredential);
      const user = userSignIn.user;
       return firestore()
          .collection('users')
          .doc(user.uid)
          .set({
            email: user.email,
            username: user.displayName,
            createdAt: firestore.FieldValue.serverTimestamp(),
            
          });
      console.log(userSignIn.user.displayName);
      

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
    <View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f09819" />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      )}
      <TouchableOpacity style={styles.googleButton} onPress={onGoogleButtonPress} disabled={loading}>
        <Image style={{ height: 50, width: 50 }} source={require('../../assets/images/google.png')} />
      </TouchableOpacity>
    </View>
  )
}

export default Google

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#043687',
    margin: 10,
    padding: 5,
    borderRadius: 100,
    alignSelf: 'center',
    alignItems: 'center',
  },
  image: {
    flex: 1,
    paddingTop: 50,
    padding: 20,
  }
})