// app/index.js (Your Login Screen)
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
import { useNavigation } from 'expo-router'; // CORRECTED: Import useNavigation from expo-router
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Google from './Google'; // Assuming this component exists and is styled separately

const index = () => {
  const navigation = useNavigation(); // This is now correct for expo-router
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Authentication logic remains the same
  const loginUser = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await auth().signInWithEmailAndPassword(email, password);
      Alert.alert('Success', 'Logged in successfully!');
      console.log('User logged in:', response.user.email);
      // Navigate to Home after successful login.
      // In expo-router, if 'Home' is in the root stack, you can navigate directly.
      // If 'Home' is in a different group (e.g., app/(app)/Home.js), you might use router.replace('/(app)/Home')
      // For now, assuming 'Home' is a direct sibling or accessible via the main stack.
      navigation.replace('Home'); // Use replace to clear the authentication stack
    } catch (error) {
      console.error('Email/Password Login Error:', error);
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
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        default:
          errorMessage = error.message;
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#66d9ef" />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.heading}>Welcome</Text>
        <Text style={styles.heading}>back!</Text>

        <TextInput
          style={styles.inputBox}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
          editable={!loading}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#888"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
            <AntDesignIcon
              name={showPassword ? 'eye' : 'eyeo'}
              size={22}
              color="#888"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.button} onPress={loginUser} disabled={loading}>
            <AntDesignIcon name="arrowright" size={26} color="#000" />
          </TouchableOpacity>

          {/* Corrected navigation to 'SignIn' route */}
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={loading}>
            <Text style={styles.signUpText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Assuming Google component is styled internally or by its own file */}
        <Google />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a', // A deep, solid dark background
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    paddingHorizontal: 20, // Add horizontal padding to the main container
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  contentContainer: {
    width: '100%', // Take full width within the container's padding
    maxWidth: 400, // Max width for larger screens
    padding: 25,
    borderRadius: 20,
    backgroundColor: '#282828', // A slightly lighter dark for the card
    shadowColor: '#000', // Still good for a subtle lift
    shadowOffset: { width: 0, height: 8 }, // Slightly less shadow depth
    shadowOpacity: 0.3, // Less intense shadow
    shadowRadius: 15, // Softer shadow
    elevation: 10, // Android shadow
  },
  heading: {
    fontSize: 42,
    color: '#E0E0E0',
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'left',
    fontFamily: 'System',
  },
  inputBox: {
    height: 55,
    paddingHorizontal: 18,
    color: '#E0E0E0',
    marginTop: 25,
    backgroundColor: '#3a3a3a', // Darker input background for better contrast with contentContainer
    fontSize: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a4a4a', // A slightly lighter border
    fontFamily: 'System',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a', // Darker input background
    borderRadius: 12,
    marginTop: 15,
    paddingHorizontal: 18,
    height: 55,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: '#E0E0E0',
    fontFamily: 'System',
  },
  eyeIcon: {
    paddingLeft: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 5,
  },
  signUpText: {
    color: '#75B6E4',
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'none',
    fontFamily: 'System',
  },
  button: {
    backgroundColor: '#66d9ef',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    shadowColor: '#66d9ef',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default index;