import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image, // Keep Image import if you plan to use a logo
  ActivityIndicator,
  StatusBar, // For status bar styling
  Dimensions // For responsive sizing if needed
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { useNavigation } from 'expo-router';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import Google from './Google'; // Assuming Google component exists and is imported correctly elsewhere

const { width, height } = Dimensions.get('window');

const Index = () => { // Renamed from 'index' to 'Index' for component naming convention
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Set status bar style for the light theme
  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true); // Dark icons on light background
    return () => StatusBar.setBarStyle('default', true); // Reset on unmount
  }, []);

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
      // Navigate to your main app screen upon successful login
      // Example: navigation.navigate('Home'); // Replace 'Home' with your actual home route
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
      {/* Top Blue Header Section */}
      <View style={styles.topHeaderBackground}>
        {/* Placeholder for the welcome checkmark or logo */}
        <View style={styles.welcomeIconCircle}>
          <AntDesignIcon name="check" size={50} color="#FFFFFF" />
        </View>
        <Text style={styles.welcomeText}>WELCOME!!</Text>
      </View>

      {/* Main Content Card */}
      <View style={styles.contentCard}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Authenticating...</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <AntDesignIcon name="user" size={20} color="#6C757D" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            placeholder="Username / Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#ADB5BD"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <AntDesignIcon name="lock" size={20} color="#6C757D" style={styles.inputIcon} />
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#ADB5BD"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading} style={styles.eyeIconContainer}>
            <AntDesignIcon
              name={showPassword ? 'eye' : 'eyeo'}
              size={20}
              color="#ADB5BD"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity disabled={loading}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={loginUser} disabled={loading}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Don't have an account / Register */}
        <TouchableOpacity onPress={() => router.push('/signIn')} disabled={loading} style={styles.registerPrompt}>
          <Text style={styles.registerPromptText}>Don't have an account?</Text>
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>

        {/* Google Login Button (uncommented and added) */}
        {/* You'll need to ensure the './Google' component is correctly implemented and styled */}
        <View style={styles.googleButtonContainer}>
          <Google />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007BFF', // Background blue
  },
  topHeaderBackground: {
    backgroundColor: '#007BFF', // Consistent blue
    height: height * 0.35, // Adjust height as per design image
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50, // Space for status bar
  },
  welcomeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent white circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  contentCard: {
    backgroundColor: '#FFFFFF', // White card background
    borderRadius: 30, // Large border radius for the card
    padding: 30,
    marginHorizontal: 20, // Horizontal margin for the card
    // marginTop: -70, // Overlap with the top blue section
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative', // For loading overlay positioning
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white overlay
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30, // Match parent card radius
    zIndex: 10,
  },
  loadingText: {
    color: '#007BFF',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Very light grey background for input fields
    borderRadius: 12, // Rounded input fields
    marginBottom: 15, // Space between input groups
    paddingHorizontal: 15,
    height: 55, // Fixed height for input fields
    borderWidth: 1,
    borderColor: '#E9ECEF', // Light border
  },
  inputIcon: {
    marginRight: 10,
  },
  inputBox: {
    flex: 1, // Take remaining space
    fontSize: 16,
    color: '#343A40', // Dark text color
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#343A40',
  },
  eyeIconContainer: {
    paddingLeft: 10,
    paddingVertical: 5, // Make touch target larger
  },
  forgotPasswordText: {
    color: '#007BFF', // Blue text for "Forgot Password"
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 25, // Space below it
  },
  loginButton: {
    backgroundColor: '#007BFF', // Blue button
    paddingVertical: 15,
    borderRadius: 12, // Rounded button
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007BFF', // Blue shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 25, // Space below button
  },
  loginButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPromptText: {
    color: '#6C757D', // Softer grey text
    fontSize: 15,
    marginRight: 5,
  },
  registerLink: {
    color: '#007BFF', // Blue link
    fontSize: 15,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  googleButtonContainer: {
    marginTop: 20, // Space above Google button
    // The Google component itself would define its own styling
  },
  bottomNavArrow: {
    backgroundColor: '#007BFF', // Blue background for arrow
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30, // Position from bottom
    right: 30, // Position from right
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
  },
});

export default Index;
