import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function VerifyPin({ navigation }) {
  const route = useRoute();
  const onSuccess = route.params?.onSuccess || (() => {});
  const [userUID, setUserUID] = useState(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
    });
    return subscriber;
  }, []);

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      setPin(pin.slice(0, -1));
    } else {
      if (pin.length < 6) setPin(pin + key);
    }
  };

  const handleSubmit = async () => {
  if (pin.length !== 6) {
    Alert.alert("Invalid PIN", "Please enter a 6-digit PIN.");
    return;
  }

  try {
    const userDoc = await firestore().collection('users').doc(userUID).get();
    const storedPin = userDoc.data()?.Pin;

    if (!storedPin) {
      Alert.alert("No PIN Found", "Please set your PIN first.");
      setPin('');
      return;
    }

    if (storedPin === pin) {
      Alert.alert("PIN Verified", "Access granted.");
      setPin('');
      onSuccess(); // ✅ Called only on success
      navigation.goBack(); // ✅ Go back to the previous page
    } else {
      Alert.alert("Incorrect PIN", "Try again.");
      setPin('');
      // ❌ Don't call onSuccess here
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong.");
    console.error(error);
  }
};

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', '0', 'submit'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 UPI PIN Verification</Text>
      <Text style={styles.instruction}>Enter your secure 6-digit PIN</Text>

      <TextInput
        value={pin}
        style={styles.pinInput}
        secureTextEntry
        keyboardType="numeric"
        maxLength={6}
        editable={false}
      />

      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.keypadButton,
              key === 'submit' && styles.submitKey,
              key === 'backspace' && styles.backspaceKey,
            ]}
            onPress={() => key === 'submit' ? handleSubmit() : handleKeyPress(key)}
          >
            <Text style={styles.keyText}>
              {key === 'backspace' ? '⌫' : key === 'submit' ? '✓' : key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const BUTTON_SIZE = width / 4 - 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instruction: {
    color: '#a0a0a0',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  pinInput: {
    color: '#00e6a7',
    fontSize: 28,
    letterSpacing: 16,
    textAlign: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#00e6a7',
    width: '70%',
    marginBottom: 40,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  keypadButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    shadowColor: '#00e6a7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  keyText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  backspaceKey: {
    backgroundColor: '#333333',
  },
  submitKey: {
    backgroundColor: '#00e6a7',
    shadowColor: '#00ffd0',
  },
});
