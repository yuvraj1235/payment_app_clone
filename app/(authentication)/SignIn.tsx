// app/SignIn.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from 'expo-router'; 
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignIn = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSignUp = () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

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
              
               balance: firestore.FieldValue.increment(0), 
            },
            { merge: true }
          );
      })
      .then(() => {
        console.log('User data saved/merged!');
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('Error', 'Email is already in use');
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert('Error', 'Invalid email address');
        } else if (error.code === 'auth/weak-password') {
            Alert.alert('Error', 'Password should be at least 6 characters');
        } else {
          Alert.alert('Error', error.message);
        }
        console.error('Signup error:', error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.heading}>Create your</Text>
        <Text style={styles.heading}>account</Text>

        <TextInput
          style={styles.inputBox}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#888"
        />

        <TextInput
          style={styles.inputBox}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <AntDesignIcon
              name={showPassword ? 'eye' : 'eyeo'}
              size={22}
              color="#888"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <AntDesignIcon name="arrowright" size={26} color="#000" />
          </TouchableOpacity>

        
          <TouchableOpacity onPress={() => navigation.navigate('index')}>
            <Text style={styles.loginText}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  contentContainer: {
    width: '90%',
    maxWidth: 400,
    padding: 25,
    borderRadius: 20,
    backgroundColor: '#282828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
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
    backgroundColor: '#3a3a3a',
    fontSize: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    fontFamily: 'System',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
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
  loginText: {
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

export default SignIn;