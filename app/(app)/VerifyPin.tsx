import React, { useState,useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useRoute } from '@react-navigation/native';
export default function VerifyPin({ navigation }) {
  const route = useRoute();
  const onSuccess = route.params?.onSuccess || (() => {});
    const [userUID, setUserUID] = useState<string | null>(null);
    useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null); 
    });
    return subscriber;
  }, []);
  
  
  const [pin, setPin] = useState('');

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      setPin(pin.slice(0, -1));
    } else {
      if (pin.length < 6) {
        setPin(pin + key);
      }
    }
  };

  const handleSubmit = async () => {
  if (pin.length !== 6) {
    Alert.alert("Invalid PIN", "Please enter a 6-digit PIN.");
    return;
  }

  try {
    const userDoc = await firestore()
      .collection('users')
      .doc(userUID)
      .get();

    const storedPin = userDoc.data()?.Pin;

    if (!storedPin) {
      Alert.alert("No PIN Found", "Please set your PIN first.");
      return;
    }

    if (storedPin === pin) {
      Alert.alert("PIN Verified", "Access granted.");
      onSuccess(); // ✅ Call the passed callback
      navigation.goBack(); // Or navigate somewhere else
    } else {
      Alert.alert("Incorrect PIN", "Try again.");
      setPin('');
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong.");
    console.error(error);
  }
};


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
      
      </View>

      {/* PIN Instruction */}
      <Text style={styles.instruction}>Enter 6-digit UPI PIN</Text>

      {/* PIN Input */}
      <TextInput
        value={pin}
        style={styles.pinInput}
        secureTextEntry
        keyboardType="numeric"
        maxLength={6}
        editable={false} // To disable typing directly into the input field
      />

      {/* Keypad */}
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', '0', 'submit'].map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.keypadButton}
            onPress={() => {
              if (key === 'submit') {
                handleSubmit();
              } else {
                handleKeyPress(key);
              }
            }}
          >
            <Text style={styles.keypadButtonText}>{key === 'backspace' ? '⌫' : key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark background
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
  },
  bankName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    color: '#B0B0B0',
    fontSize: 18,
  },
  balance: {
    color: '#66D9EF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },
  instruction: {
    color: '#E0E0E0',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    color: '#E0E0E0',
    fontSize: 24,
    letterSpacing: 10,
    marginBottom: 40,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 10,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap:'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  keypadButton: {
    backgroundColor: '#333333',
    borderRadius: 50,
    width: 100,
    height:100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  keypadButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#66D9EF',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
