import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator } from 'react-native'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; 

const { width } = Dimensions.get('window');

const Payment = ({ route }) => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { recipientUid } = route.params; 
  useEffect(() => {
    console.log("Received recipientUid:", recipientUid); // Log to verify if it's passed correctly
  }, [recipientUid]);
  
  const [amount, setAmount] = useState('');
  const [mybal, setMyBal] = useState(null); 
  const [recipientEmail, setRecipientEmail] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [recipientUsername, setRecipientUsername] = useState(null); 
  const [selectedBank, setSelectedBank] = useState({ name: 'HDFC Bank', lastDigits: '0123' });
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const currentUserUid = auth().currentUser?.uid; 

  const pay = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to pay.');
      return;
    }

    if (!recipientUid) { // Ensure we have a recipient UID
      Alert.alert('No Recipient', 'Cannot process payment without a recipient ID.');
      return;
    }

    if (currentUserUid === recipientUid) {
      Alert.alert('Error', 'Cannot send money to yourself.');
      return;
    }

    setIsProcessingPayment(true); // Set loading state for payment
    const amountToPay = Number(amount);

    try {
      await firestore().runTransaction(async (transaction) => {
      
        const senderDocRef = firestore().collection('users').doc(currentUserUid);
        const senderSnapshot = await transaction.get(senderDocRef);

        if (!senderSnapshot.exists) {
          throw new Error("Sender's account does not exist!");
        }

        const senderBalance = senderSnapshot.data().balance || 0;
        if (senderBalance < amountToPay) {
          throw new Error("Insufficient balance.");
        }

        transaction.update(senderDocRef, {
          balance: firestore.FieldValue.increment(-amountToPay),
          transhistory:firestore.FieldValue.arrayUnion(-amountToPay),
        });

        // 2. Increment recipient's balance
        const recipientDocRef = firestore().collection('users').doc(recipientUid);
        const recipientSnapshot = await transaction.get(recipientDocRef);

        if (!recipientSnapshot.exists) {
          throw new Error("Recipient account not found for the scanned ID.");
        }
        transaction.update(recipientDocRef, {
          balance: firestore.FieldValue.increment(amountToPay),
          transhistory:firestore.FieldValue.arrayUnion(amountToPay),
        });
      });

      Alert.alert('Success', `Successfully paid ₹${formatAmount(amount)} to ${recipientUsername}.`);
      setAmount(''); // Clear amount after successful payment
      // Re-fetch current user's balance to reflect change
      fetchCurrentUserDetails(currentUserUid);

    } catch (error) {
      console.error("Error making payment: ", error);
      Alert.alert('Payment Failed', error.message || 'There was an error processing your payment. Please try again.');
    } finally {
      setIsProcessingPayment(false); // Reset loading state
    }
  };

  // Function to fetch current user's details
  const fetchCurrentUserDetails = (uid) => {
    if (!uid) {
      console.log('No current user UID provided to fetch data.');
      return () => {}; // Return empty cleanup
    }
    const subscriber = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists) {
          const data = documentSnapshot.data();
          // console.log('Current User data: ', data); // Log only if needed for debugging
          setMyBal(data.balance || 0);
          setCurrentUserEmail(data.email || 'N/A');
          setCurrentUsername(data.username ? data.username.toUpperCase() : 'N/A');
        } else {
          console.log('Current user document does not exist.');
          setMyBal(null);
          setCurrentUserEmail(null);
          setCurrentUsername(null);
        }
      }, (error) => {
        console.error("Error fetching current user data: ", error);
        setMyBal(null);
        setCurrentUserEmail(null);
        setCurrentUsername(null);
      });
    return subscriber;
  };

  // Effect to fetch recipient details when recipientUid is available
  useEffect(() => {
    const fetchRecipientDetails = async (uid) => {
      setIsLoadingRecipient(true); // Start loading
      try {
        const recipientDoc = await firestore().collection('users').doc(uid).get();

        if (recipientDoc.exists) {
          const recipientData = recipientDoc.data();
          setRecipientUsername(recipientData.username ? recipientData.username.toUpperCase() : 'N/A');
          setRecipientEmail(recipientData.email || 'N/A');
          console.log("Recipient details fetched:", recipientData);
        } else {
          Alert.alert("Recipient Not Found", "The scanned QR code ID does not match a known user.");
          setRecipientUsername('Unknown User');
          setRecipientEmail('N/A');
        }
      } catch (error) {
        console.error("Error fetching recipient details:", error);
        Alert.alert("Error", "Could not fetch recipient details. Please check your network.");
        setRecipientUsername('Error');
        setRecipientEmail('Error');
      } finally {
        setIsLoadingRecipient(false); // End loading
      }
    };

    if (recipientUid) {
      // If a recipient UID is passed, fetch their details
      fetchRecipientDetails(recipientUid);
      console.log(recipientUid);
      
    } else {
      // If no recipient UID, set default states and stop loading
      setRecipientUsername('Scan QR / Select Recipient');
      setRecipientEmail('N/A');
      setIsLoadingRecipient(false);
    }
  }, [recipientUid]); // Rerun this effect if recipientUid changes

  // Effect to fetch current user's balance on component mount (and setup listener)
  useEffect(() => {
    // Only fetch if current user's UID is available (meaning user is logged in)
    if (currentUserUid) {
      const subscriber = fetchCurrentUserDetails(currentUserUid);
      return () => subscriber(); // Cleanup subscription
    }
  }, [currentUserUid]); // Depend on currentUserUid

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      setAmount(amount.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + key);
      }
    } else {
      if (amount.includes('.') && amount.split('.')[1].length >= 2) {
        return;
      }
      setAmount(amount + key);
    }
  };

  const formatAmount = (input) => {
    if (!input) return '0';
    let formatted = input.replace(/^0+(?=\d)/, '');
    if (formatted === '') formatted = '0';
    if (formatted === '.') formatted = '0.';
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
          {isLoadingRecipient ? (
            <ActivityIndicator size="small" color="#E0E0E0" />
          ) : (
            <Text style={styles.recipientName}>{recipientUsername || 'Recipient N/A'}</Text>
          )}
          <View style={styles.recipientSubInfo}>
            <MaterialIcons name="check-circle" size={14} color="#4CAF50" style={{ marginRight: 5 }} />
            <Text style={styles.recipientPhone}>{recipientEmail || 'N/A'}</Text>
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
            <Text style={styles.bankBalance}>Your Balance: {mybal !== null ? `₹${mybal}` : '...'}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#B0B0B0" style={{ marginLeft: 'auto' }} />
        </View>
        {/* Next Button / Pay Button */}
        <TouchableOpacity style={styles.nextButton} onPress={pay} disabled={isLoadingRecipient || isProcessingPayment || !recipientUid}>
          {isProcessingPayment ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <MaterialIcons name="arrow-forward" size={28} color="#000" />
          )}
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
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#3A3A3A',
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recipientSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  recipientPhone: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
    fontSize: 60,
    fontWeight: 'bold',
  },
  bankSelectionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  bankSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    color: '#66d9ef',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  nextButton: {
    backgroundColor: '#A7D7F9',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  keypad: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  keypadButton: {
    width: width / 3 - 40,
    height: width / 3 - 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  keypadButtonText: {
    color: '#E0E0E0',
    fontSize: 32,
    fontWeight: 'normal',
  },
});

export default Payment;