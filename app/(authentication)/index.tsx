
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
import { useNavigation } from 'expo-router';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import Google from './Google';

const index = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 180, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#00FFF0',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 25,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#00FFE0',
    shadowColor: '#00FFE0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  heading: {
    fontSize: 42,
    color: '#00FFF0',
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'left',
    fontFamily: 'System',
    textShadowColor: '#00FFD5',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  inputBox: {
    height: 55,
    paddingHorizontal: 18,
    color: '#00FFD0',
    marginTop: 25,
    backgroundColor: '#1A1A1A',
    fontSize: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00FFE0',
    fontFamily: 'System',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginTop: 15,
    paddingHorizontal: 18,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#00FFE0',
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: '#00FFD5',
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
    color: '#00FFE0',
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'none',
    fontFamily: 'System',
  },
  button: {
    backgroundColor: '#00FFCC',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    shadowColor: '#00FFE0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
});


export default index;