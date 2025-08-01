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
  StatusBar,
  Dimensions
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { router, useNavigation } from 'expo-router';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Added for consistent icons
import Google from './Google'; // Assuming Google component exists

const { width, height } = Dimensions.get('window');

const Index = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true); // Light icons on dark background
    return () => StatusBar.setBarStyle('default', true);
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
      router.replace('/(tabs)'); // Example navigation to a main screen
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
      <View style={styles.topHeaderBackground}>
        <View style={styles.welcomeIconCircle}>
          <MaterialIcons name="check" size={50} color="#FFFFFF" />
        </View>
        <Text style={styles.welcomeText}>WELCOME BACK!</Text>
      </View>

      <View style={styles.contentCard}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#009688" />
            <Text style={styles.loadingText}>Authenticating...</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <MaterialIcons name="email" size={20} color="#00695C" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            placeholder="Username / Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A7B7B3"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <MaterialIcons name="lock" size={20} color="#00695C" style={styles.inputIcon} />
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#A7B7B3"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading} style={styles.eyeIconContainer}>
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color="#A7B7B3"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity disabled={loading}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={loginUser} disabled={loading}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity onPress={() => router.push('/signIn')} disabled={loading} style={styles.registerPrompt}>
          <Text style={styles.registerPromptText}>Don't have an account?</Text>
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>

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
    backgroundColor: '#009688',
  },
  topHeaderBackground: {
    backgroundColor: '#009688',
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  welcomeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    marginHorizontal: 20,
    marginTop: -40, // Create overlap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
    minHeight: height * 0.6, // Ensures the card is a minimum size
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    zIndex: 10,
  },
  loadingText: {
    color: '#009688',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Lighter grey for border
  },
  inputIcon: {
    marginRight: 10,
  },
  inputBox: {
    flex: 1,
    fontSize: 16,
    color: '#343A40',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#343A40',
  },
  eyeIconContainer: {
    paddingLeft: 10,
    paddingVertical: 5,
  },
  forgotPasswordText: {
    color: '#00695C', // Themed green
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 25,
  },
  loginButton: {
    backgroundColor: '#009688', // Themed green
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 25,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#A7B7B3', // Muted green/grey color
    fontSize: 14,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPromptText: {
    color: '#6C757D',
    fontSize: 15,
    marginRight: 5,
  },
  registerLink: {
    color: '#009688', // Themed green
    fontSize: 15,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  googleButtonContainer: {
    marginTop: 20,
  },
});

export default Index;
