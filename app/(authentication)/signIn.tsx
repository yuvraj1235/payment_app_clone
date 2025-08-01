import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, router } from 'expo-router'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import Google from './Google'; 

const { width, height } = Dimensions.get('window');

const SignIn = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    return () => StatusBar.setBarStyle('default', true);
  }, []);

  const handleSignUp = () => {
    if (!email || !password || !username) {
      Alert.alert('Missing Fields', 'Please fill all fields');
      return;
    }

    setLoading(true);
    createUserWithEmailAndPassword(getAuth(), email, password)
      .then(userCredential => {
        const user = userCredential.user;
        return firestore()
          .collection('users')
          .doc(user.uid)
          .set(
            {
              email: email,
              username: username,
              createdAt: firestore.FieldValue.serverTimestamp(),
              balance: 0,
            },
            { merge: true }
          );
      })
      .then(() => {
        Alert.alert('Success', 'Account created successfully! You can now log in.');
        console.log('User data saved/merged!');
        setLoading(false);
        router.push('/(authentication)/index');
      })
      .catch(error => {
        setLoading(false);
        console.error('Signup error:', error);
        let errorMessage = error.message;
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
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.topHeaderBackground}>
        <View style={styles.header}>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.registerIconCircle}>
          <MaterialIcons name="person-add-alt" size={50} color="#FFFFFF" />
        </View>
        <Text style={styles.welcomeText}>REGISTER</Text>
      </View>

      <View style={styles.contentCard}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#009688" />
            <Text style={styles.loadingText}>Creating Account...</Text>
          </View>
        )}

        <Text style={styles.cardHeading}>Create your</Text>
        <Text style={styles.cardHeading}>account</Text>

        <View style={styles.inputGroup}>
          <MaterialIcons name="person-outline" size={20} color="#00695C" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            placeholder="Full Name"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            placeholderTextColor="#A7B7B3"
            editable={!loading}
          />
        </View>

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

        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity onPress={() => router.push('/index')} disabled={loading} style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account?</Text>
          <Text style={styles.loginLink}>Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    position: 'absolute',
    top: Platform.OS === 'android' ? 10 : 50,
  },
  backButton: {
    padding: 5,
  },
  registerIconCircle: {
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
    marginTop: -50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
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
  cardHeading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 10,
    textAlign: 'left',
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
    borderColor: '#E0E0E0',
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
  signUpButton: {
    backgroundColor: '#009688',
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
  signUpButtonText: {
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
    color: '#A7B7B3',
    fontSize: 14,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 15,
  },
  loginPromptText: {
    color: '#6C757D',
    fontSize: 15,
    marginRight: 5,
  },
  loginLink: {
    color: '#009688',
    fontSize: 15,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignIn;
