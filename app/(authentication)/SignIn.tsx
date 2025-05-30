import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

        // Save username to Firestore
        return firestore()
          .collection('users')
          .doc(user.uid)
          .set({
            email: email,
            username: username,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      })
      .then(() => {
        console.log('User data saved!');
        //navigation.navigate('Login');
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('Error', 'Email is already in use');
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert('Error', 'Invalid email address');
        } else {
          Alert.alert('Error', error.message);
        }
        console.error('Signup error:', error);
      });
  };

  return (
    <ImageBackground source={require('../../assets/images/background.jpg')} resizeMode="cover" style={styles.image}>
      <Text style={styles.heading}>Create your</Text>
      <Text style={styles.heading}>account</Text>

      <TextInput
        style={styles.inputbox}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor="#ccc"
      />

      <TextInput
        style={styles.inputbox}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#ccc"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={{ flex: 1, fontSize: 20, color: '#fff' }}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#ccc"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <AntDesignIcon
            name={showPassword ? 'eye' : 'eyeo'}
            size={24}
            color="#ccc"
            style={{ paddingHorizontal: 10 }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <AntDesignIcon name="arrowright" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.sign}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0e0599',
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 10,
    elevation: 10,
  }, image: {
    flex: 1,
    paddingTop: 50,
    padding: 20,
  },
});

export default SignIn;
