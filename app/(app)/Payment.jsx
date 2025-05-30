import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert } from 'react-native'; // Added Alert for better error handling
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from 'expo-router'; // Assuming expo-router for navigation
import firestore from '@react-native-firebase/firestore'; // Make sure this import is correct and firebase is configured

const { width } = Dimensions.get('window');

const Payment = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [mybal, setMyBal] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [username, setUsername] = useState(null);
  const [userData, setUserData] = useState(null); // Added this state
  const [selectedBank, setSelectedBank] = useState({ name: 'HDFC Bank', lastDigits: '0123' });

  // Function to handle payment
  const pay = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to pay.');
      return;
    }

    // Convert amount to a number for Firestore increment
    const amountToPay = Number(amount);

    try {
      await firestore()
        .collection('users')
        .doc('e95eeuOZqqPhL1demqbRYppYWUm2') // Hardcoded user ID, consider dynamic ID in real app
        .set(
          {
            balance: firestore.FieldValue.increment(amountToPay),
          },
          { merge: true }
        );
      Alert.alert('Success', `Successfully paid ₹${formatAmount(amount)}.`);
      setAmount(''); // Clear amount after successful payment
    } catch (error) {
      console.error("Error making payment: ", error);
      Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again.');
    }
  };

  useEffect(() => {
    const userIdToFetch = 'e95eeuOZqqPhL1demqbRYppYWUm2'; // This must be a string

    if (!userIdToFetch) {
      console.log('No user ID provided to fetch data.');
      return;
    }

    const subscriber = firestore()
      .collection('users')
      .doc(userIdToFetch)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists) {
          const data = documentSnapshot.data();
          console.log('User data: ', data);
          setUserData(data);
          setMyBal(data.balance);
          setUserEmail(data.email);
          let name = data.username ? data.username.toUpperCase() : 'N/A'; // Handle potential undefined username
          setUsername(name);
        } else {
          console.log('User document does not exist.');
          setUserData(null);
          setMyBal(null);
          setUserEmail(null);
          setUsername(null);
        }
      }, (error) => {
        console.error("Error fetching user data: ", error);
        setUserData(null);
        setMyBal(null);
        setUserEmail(null);
        setUsername(null);
      });

    return () => subscriber();
  }, []);

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      setAmount(amount.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + key);
      }
    } else {
      // Prevent more than two decimal places
      if (amount.includes('.') && amount.split('.')[1].length >= 2) {
        return;
      }
      setAmount(amount + key);
    }
  };

  const formatAmount = (input) => {
    if (!input) return '0';
    let formatted = input.replace(/^0+(?=\d)/, ''); // Remove leading zeros
    if (formatted === '') formatted = '0';
    if (formatted === '.') formatted = '0.'; // Handle case where only '.' is entered
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add commas for thousands
    return parts.join('.');
  };

  const KeypadButton = ({ value }) => (
    <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress(value)}>
      {value === 'backspace' ? (
        <MaterialIcons name="backspace" size={24} color="#E0E0E0" />
      ) : value === 'image' ? (
        <MaterialIcons name="qr-code-scanner" size={24} color="#E0E0E0" />
      ) : (
        <Text style={styles.keypadButtonText}>{value}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#E0E0E0" />
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="#E0E0E0" />
        </TouchableOpacity>
      </View>

      {/* Recipient Info */}
      <View style={styles.recipientContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/50' }} // Placeholder for profile pic
          style={styles.recipientAvatar}
        />
        <View style={styles.recipientDetails}>
          <Text style={styles.recipientName}>{username || 'Loading...'}</Text>
          <View style={styles.recipientSubInfo}>
            <MaterialIcons name="check-circle" size={14} color="#4CAF50" style={{ marginRight: 5 }} />
            <Text style={styles.recipientPhone}>{userEmail || 'Loading...'}</Text>
          </View>
        </View>
      </View>

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={styles.amountText}>{formatAmount(amount) || '0'}</Text>
      </View>

      {/* Bank Selection */}
      <View style={styles.bankSelectionWrapper}>
        <View style={styles.bankSelectionContainer}>
          <MaterialIcons name="account-balance" size={24} color="#E0E0E0" style={{ marginRight: 10 }} />
          <View style={styles.bankInfo}>
            <Text style={styles.bankName}>{selectedBank.name}</Text>
            <Text style={styles.bankAccount}>xx{selectedBank.lastDigits}</Text>
            <Text style={styles.bankBalance}>Check balance: {mybal !== null ? `₹${mybal}` : '...'}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#B0B0B0" style={{ marginLeft: 'auto' }} />
        </View>
        {/* Next Button / Pay Button */}
        <TouchableOpacity style={styles.nextButton} onPress={pay}>
          <MaterialIcons name="arrow-forward" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          <KeypadButton value="1" />
          <KeypadButton value="2" />
          <KeypadButton value="3" />
        </View>
        <View style={styles.keypadRow}>
          <KeypadButton value="4" />
          <KeypadButton value="5" />
          <KeypadButton value="6" />
        </View>
        <View style={styles.keypadRow}>
          <KeypadButton value="7" />
          <KeypadButton value="8" />
          <KeypadButton value="9" />
        </View>
        <View style={styles.keypadRow}>
          <KeypadButton value="." />
          <KeypadButton value="0" />
          <KeypadButton value="backspace" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark background
    paddingHorizontal: 20,
    paddingTop: 50, // Adjust for status bar/notch
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute items with space
    alignItems: 'center',
    marginBottom: 30,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  recipientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#3A3A3A', // Placeholder background
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    color: '#E0E0E0', // Light text
    fontSize: 18,
    fontWeight: 'bold',
  },
  recipientSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  recipientPhone: {
    color: '#B0B0B0', // Lighter gray for details
    fontSize: 14,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align symbol and numbers at the base
    justifyContent: 'center',
    marginBottom: 30,
  },
  currencySymbol: {
    color: '#E0E0E0',
    fontSize: 40,
    fontWeight: 'bold',
    marginRight: 5,
  },
  amountText: {
    color: '#E0E0E0',
    fontSize: 60, // Large font size for amount
    fontWeight: 'bold',
  },
  bankSelectionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828', // Dark background for bank selection
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 30,
    justifyContent: 'space-between', // Push next button to the right
  },
  bankSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Take up remaining space
  },
  bankInfo: {
    marginLeft: 10,
  },
  bankName: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
  },
  bankAccount: {
    color: '#B0B0B0',
    fontSize: 13,
  },
  bankBalance: {
    color: '#66d9ef', // Accent color for "Check balance"
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  nextButton: {
    backgroundColor: '#A7D7F9', // Accent color for next button
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  keypad: {
    flex: 1, // Keypad takes up remaining space
    justifyContent: 'flex-end', // Push keypad to the bottom
    marginBottom: 20, // Space from bottom of screen
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  keypadButton: {
    width: width / 3 - 40, // Distribute buttons evenly
    height: width / 3 - 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10, // Slight rounding for buttons
  },
  keypadButtonText: {
    color: '#E0E0E0',
    fontSize: 32,
    fontWeight: 'normal',
  },
});

export default Payment;