import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useRoute } from '@react-navigation/native'; // Keep useRoute for navigation params
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
export type RootStackParamList = {
  VerifyPin: { onSuccess?: () => void }; // Assuming VerifyPin might receive an onSuccess function
  // Add other routes here, e.g.,
  // Home: undefined;
  // Profile: { userId: string };
};
type VerifyPinScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'VerifyPin'
>;
type VerifyPinScreenRouteProp = RouteProp<RootStackParamList, 'VerifyPin'>;

// 4. Use these types in your component's props
interface VerifyPinProps {
  navigation: VerifyPinScreenNavigationProp;
  route: VerifyPinScreenRouteProp;
}
const { width } = Dimensions.get('window');

// Define the BUTTON_SIZE based on screen width
const BUTTON_SIZE = width / 4 - 20;

export default function VerifyPin({ navigation }: VerifyPinProps) {
  const route = useRoute<VerifyPinScreenRouteProp>(); // Explicitly type useRoute as well

  // Ensure onSuccess is always a function to prevent errors
  const onSuccess = route.params?.onSuccess || (() => {});
  const [userUID, setUserUID] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // To manage loading state for auth
  const [isVerifyingPin, setIsVerifyingPin] = useState(false); // To manage loading state during PIN verification

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
      setIsLoadingAuth(false); // Auth loading finished
    });
    return subscriber; // Unsubscribe on component unmount
  }, []);

  const handleKeyPress = (key: string) => {
    if (isVerifyingPin) return; // Prevent input while verifying

    if (key === 'backspace') {
      setPin(pin.slice(0, -1));
    } else {
      if (pin.length < 6) {
        setPin(pin + key);
      }
    }
  };

  const handleSubmit = async () => {
    if (isVerifyingPin) return; // Prevent multiple submissions

    if (pin.length !== 6) {
      Alert.alert("Invalid PIN", "Please enter a 6-digit PIN.");
      return;
    }

    if (!userUID) {
      Alert.alert("Authentication Error", "User not logged in or session expired. Please re-login.");
      return;
    }

    setIsVerifyingPin(true); // Start PIN verification loading

    try {
      const userDoc = await firestore().collection('users').doc(userUID).get();
      const storedPin = userDoc.data()?.Pin;

      if (!storedPin) {
        Alert.alert("No PIN Found", "Please set your PIN first in your profile settings.");
        setPin('');
        return;
      }

      if (storedPin === pin) {
        Alert.alert("PIN Verified", "Access granted.");
        setPin(''); // Clear PIN on success
        onSuccess(); // Call the callback function passed from the previous screen
        navigation.goBack(); // Navigate back to the previous screen
      } else {
        Alert.alert("Incorrect PIN", "The PIN you entered is incorrect. Please try again.");
        setPin(''); // Clear PIN on incorrect attempt
      }
    } catch (error: any) { // Use 'any' for unknown error types from catch block
      console.error("Error verifying PIN: ", error);
      Alert.alert("Error", error.message || "Something went wrong during PIN verification. Please try again.");
    } finally {
      setIsVerifyingPin(false); // End PIN verification loading
    }
  };

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', '0', 'submit'];

  if (isLoadingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.instruction}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🔒 UPI PIN Verification</Text>
      <Text style={styles.instruction}>Enter your secure 6-digit PIN</Text>

      <TextInput
        value={pin.split('').map(char => '•').join('')} // Mask the PIN input
        style={styles.pinInput}
        secureTextEntry // Ensures native secure text entry behavior
        keyboardType="numeric"
        maxLength={6}
        editable={false} // Disable direct keyboard input to control via custom keypad
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
            disabled={isVerifyingPin} // Disable buttons during verification
          >
            <Text style={styles.keyText}>
              {key === 'backspace' ? '⌫' : key === 'submit' ? '✓' : key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isVerifyingPin && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingMessage}>Verifying PIN...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Light background color for the screen
    paddingTop: 60, // Ample top padding
    paddingHorizontal: 20, // Horizontal padding
    alignItems: 'center', // Center content horizontally
  },
  title: {
    color: '#333333', // Dark text for readability
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instruction: {
    color: '#666666', // Medium grey for instructions
    fontSize: 16,
    marginBottom: 40, // More space below instructions
    textAlign: 'center',
  },
  pinInput: {
    color: '#1A73E8', // PayZapp blue for PIN text
    fontSize: 32, // Larger PIN digits
    letterSpacing: 18, // Increased letter spacing for masked digits
    textAlign: 'center',
    paddingVertical: 15, // More vertical padding
    borderBottomWidth: 3, // Thicker border
    borderBottomColor: '#1A73E8', // PayZapp blue border
    width: '75%', // Slightly wider input field
    marginBottom: 50, // More space below PIN input
    fontWeight: 'bold', // Make PIN digits bold
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Center keypad horizontally
    paddingHorizontal: 10, // Padding for the keypad grid
  },
  keypadButton: {
    width: BUTTON_SIZE + 10, // Slightly larger buttons
    height: BUTTON_SIZE + 10,
    borderRadius: (BUTTON_SIZE + 10) / 2, // Perfect circle
    margin: 8, // Reduced margin for denser grid, but still spacious
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for keys
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5, // Android shadow
  },
  keyText: {
    fontSize: 28, // Larger key text
    color: '#333333', // Dark text for numbers
    fontWeight: '600',
  },
  backspaceKey: {
    backgroundColor: '#E9ECEF', // Light grey for backspace key
    shadowColor: '#000', // Subtle shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  submitKey: {
    backgroundColor: '#1A73E8', // PayZapp blue for submit key
    shadowColor: '#1A73E8', // Blue shadow for glow effect
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  overlayLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it's on top
  },
  loadingMessage: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
