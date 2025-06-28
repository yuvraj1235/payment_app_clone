import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar, // For status bar styling
  Dimensions, // For responsive sizing
  ActivityIndicator, // For loading state
} from 'react-native';
import { useNavigation } from 'expo-router'; 
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth'; // Keeping getAuth as per your code
import firestore from '@react-native-firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context'; // For proper safe area handling
import Google from './Google'; // Importing the Google component

const { width, height } = Dimensions.get('window');

const SignIn = () => { // This component acts as a Sign-Up/Register page
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false); // New loading state

  // Set status bar style for the light theme
  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true); // Dark icons on light background
    return () => StatusBar.setBarStyle('default', true); // Reset on unmount
  }, []);

  const handleSignUp = () => {
    if (!email || !password || !username) {
      Alert.alert('Missing Fields', 'Please fill all fields');
      return;
    }

    setLoading(true); // Start loading
    createUserWithEmailAndPassword(getAuth(), email, password)
      .then(userCredential => {
        const user = userCredential.user;

        // Save user data to Firestore
        return firestore()
          .collection('users')
          .doc(user.uid)
          .set(
            {
              email: email,
              username: username,
              createdAt: firestore.FieldValue.serverTimestamp(),
              balance: 0, // Initialize balance to 0 for new users
            },
            { merge: true } // Use merge to avoid overwriting other potential fields
          );
      })
      .then(() => {
        Alert.alert('Success', 'Account created successfully! You can now log in.');
        console.log('User data saved/merged!');
        setLoading(false); // Stop loading on success
        navigation.navigate('index'); // Navigate back to the login page
      })
      .catch(error => {
        setLoading(false); // Stop loading on error
        console.error('Signup error:', error);
        let errorMessage = error.message; // Default error message
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'The email address is already in use by another account.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is invalid.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password should be at least 6 characters long.';
            break;
          default:
            errorMessage = 'An unexpected error occurred during signup. Please try again.';
        }
        Alert.alert('Signup Failed', errorMessage);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Blue Header Section for Register */}
      <View style={styles.topHeaderBackground}>
        {/* Placeholder for a register icon or logo */}
        <View style={styles.registerIconCircle}>
          <AntDesignIcon name="form" size={50} color="#FFFFFF" />
        </View>
        <Text style={styles.welcomeText}>REGISTER</Text>
      </View>

      {/* Main Content Card */}
      <View style={styles.contentCard}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Creating Account...</Text>
          </View>
        )}

        <Text style={styles.cardHeading}>Create your</Text>
        <Text style={styles.cardHeading}>account</Text>

        <View style={styles.inputGroup}>
          <AntDesignIcon name="user" size={20} color="#6C757D" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            placeholder="Full Name" // Changed to Full Name as per image
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words" // Capitalize first letter of each word
            placeholderTextColor="#ADB5BD"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <AntDesignIcon name="mail" size={20} color="#6C757D" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            placeholder="Username / Email" // As per image for consistency
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#ADB5BD"
            editable={!loading}
          />
        </View>
        
        {/* You could add a phone number input here if needed based on the image
        // <View style={styles.inputGroup}>
        //   <AntDesignIcon name="phone" size={20} color="#6C757D" style={styles.inputIcon} />
        //   <TextInput
        //     style={styles.inputBox}
        //     placeholder="Phone Number"
        //     keyboardType="phone-pad"
        //     placeholderTextColor="#ADB5BD"
        //     editable={!loading}
        //   />
        // </View> */}

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

        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Google Login Button (added here) */}
        <View style={styles.googleButtonContainer}>
          <Google />
        </View>

        {/* Already have an account? Log in */}
        <TouchableOpacity onPress={() => navigation.navigate('index')} disabled={loading} style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account?</Text>
          <Text style={styles.loginLink}>Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  registerIconCircle: { // New style for register page icon
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
    marginTop: -50, // Overlap with the top blue section
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
  cardHeading: { // New heading style for inside the card
    fontSize: 32, // Smaller than main welcome, but still prominent
    fontWeight: 'bold',
    color: '#343A40', // Dark text
    marginBottom: 10,
    textAlign: 'left',
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
  forgotPasswordText: { // Keeping this style for consistency, though not used in default Sign In page
    color: '#007BFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 25,
  },
  signUpButton: { // Style for the main sign up button
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
    // marginTop: 25, // Space above the button
    marginBottom: 25, // Space below the button
  },
  signUpButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButtonContainer: {
    marginTop: -20, // Space above Google button
    // marginBottom: 20, // Added space below Google button for better separation
  },
  loginPrompt: { // Style for "Already have an account?" text
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptText: {
    color: '#6C757D', // Softer grey text
    fontSize: 15,
    marginRight: 5,
  },
  loginLink: {
    color: '#007BFF', // Blue link
    fontSize: 15,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
    left: 30, // Position from left to match the image (arrow pointing left)
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
  },
});

export default SignIn;
