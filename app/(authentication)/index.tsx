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
  ImageBackground, // Import ActivityIndicator for loading state
} from 'react-native';
// Correct way to import auth from @react-native-firebase
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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

    <ImageBackground source={require('../../assets/images/background.jpg')} resizeMode="cover" style={styles.image}>
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f09819" />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      )}

      <Text style={styles.heading}>Welcome</Text>
      <Text style={styles.heading}>back!</Text>

      <TextInput
        style={styles.inputbox}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#ccc"
        editable={!loading} 
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={{ flex: 1, fontSize: 20, color: '#e1e3ea' }}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#ccc"
          editable={!loading} 
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

      <Google></Google>
    </ImageBackground>
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
    color: 'white',
    marginTop: 20,
    backgroundColor: '#0e0599',
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
    backgroundColor: '#0e0599',
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 10,
    elevation: 10,
  },
  image: {
    flex: 1,
    paddingTop: 50,
    padding: 20,
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

export default index; 
