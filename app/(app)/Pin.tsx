import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

export default function Pin() {
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
    } else if (pin.length < 6) {
      setPin(pin + key);
    }
  };

  const handleSubmit = async () => {
    if (pin.length === 6) {
      try {
        await firestore()
          .collection('users')
          .doc(userUID)
          .set({ Pin: pin }, { merge: true });

        Alert.alert('Success', 'Your PIN has been set.');
        setPin('');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to set PIN.');
      }
    } else {
      Alert.alert('Invalid PIN', 'Please enter a 6-digit PIN.');
    }
  };

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', '0', 'submit'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Set UPI PIN</Text>
      <Text style={styles.instruction}>Create your 6-digit secure PIN</Text>

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
            onPress={() => (key === 'submit' ? handleSubmit() : handleKeyPress(key))}
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
