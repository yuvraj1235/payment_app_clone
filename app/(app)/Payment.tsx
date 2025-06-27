// Payment.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // Import RouteProp
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'; // Import for Timestamp type

const { width } = Dimensions.get('window');

// Define the type for the route parameters for the 'Payment' screen
type PaymentRouteParams = {
  recipientUid: string;
  amountToPay?: string | number; // Optional as it might not always be passed
  billId?: string; // Optional bill ID for updating status
  billDescription?: string; // Optional description for context
};

// Define the type for the route object
type PaymentScreenRouteProp = RouteProp<{ Payment: PaymentRouteParams }, 'Payment'>;

const Payment = () => {
  const navigation = useNavigation();
  const route = useRoute<PaymentScreenRouteProp>(); // Use RouteProp for type safety
  const { recipientUid, amountToPay, billId, billDescription } = route.params ?? {}; // Destructure params with nullish coalescing

  const [amount, setAmount] = useState('');
  const [mybal, setMyBal] = useState<number | null>(null); // Explicitly type mybal
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [recipientUsername, setRecipientUsername] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState({ name: 'HDFC Bank', lastDigits: '0123' });
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const currentUserUid = auth().currentUser?.uid;

  // Effect to pre-fill amount if passed from PayRequest screen
  useEffect(() => {
    if (amountToPay) {
      setAmount(String(amountToPay));
    }
  }, [amountToPay]); // Depend on amountToPay

  const pay = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to pay.');
      return;
    }

    if (!recipientUid) {
      Alert.alert('No Recipient', 'Cannot process payment without a recipient ID. Please go back and select a recipient.');
      return;
    }

    if (currentUserUid === recipientUid) {
      Alert.alert('Error', 'Cannot send money to yourself.');
      return;
    }

    setIsProcessingPayment(true);
    const amountToPayNum = Number(amount);
    // Generate a unique timestamp for the transaction key
    const transactionId = new Date().toISOString().replace(/[^0-9]/g, '');

    try {
      await firestore().runTransaction(async (transaction) => {
        // Ensure currentUserUid is available before proceeding with transaction
        if (!currentUserUid) {
          throw new Error("Current user not authenticated for transaction.");
        }

        const senderDocRef = firestore().collection('users').doc(currentUserUid);
        const senderSnapshot = await transaction.get(senderDocRef);

        if (!senderSnapshot.exists) {
          throw new Error("Sender's account does not exist!");
        }

        const senderBalance = senderSnapshot.data()?.balance || 0;
        if (senderBalance < amountToPayNum) {
          throw new Error("Insufficient balance.");
        }

        // Update sender's balance and add transaction to their map
        transaction.update(senderDocRef, {
          balance: firestore.FieldValue.increment(-amountToPayNum),
          [`transhistory.${transactionId}`]: {
            amount: -amountToPayNum, // Store as negative for debit
            type: 'debit',
            recipientUid: recipientUid,
            recipientName: recipientUsername || 'Unknown Recipient',
            timestamp: firestore.FieldValue.serverTimestamp(),
          },
        });

        const recipientDocRef = firestore().collection('users').doc(recipientUid);
        const recipientSnapshot = await transaction.get(recipientDocRef);

        if (!recipientSnapshot.exists) {
          throw new Error("Recipient account not found for the provided ID.");
        }

        // Update recipient's balance and add transaction to their map
        transaction.update(recipientDocRef, {
          balance: firestore.FieldValue.increment(amountToPayNum),
          [`transhistory.${transactionId}`]: { // Use the same transactionId
            amount: amountToPayNum, // Store as positive for credit
            type: 'credit',
            senderUid: currentUserUid,
            senderName: currentUsername || 'Unknown Sender',
            timestamp: firestore.FieldValue.serverTimestamp(),
          },
        });

        // --- Update Bill Request Status after successful payment ---
        // This part is crucial for linking payment to bill requests
        if (billId && currentUserUid) {
          const recipientBillRequestDocRef = firestore().collection('users').doc(currentUserUid);
          const senderBillRequestDocRef = firestore().collection('users').doc(recipientUid); // Recipient of payment is sender of bill request

          // Update the current user's (the one who received the bill and is now paying it) bill request status to 'paid'
          transaction.update(recipientBillRequestDocRef, {
            [`request.${billId}.status`]: 'paid',
          });
          console.log(`Bill request ${billId} status updated to 'paid' for current user (${currentUserUid}).`);

          // Update the sender's (of the bill request) record for this specific recipient to 'paid'
          transaction.update(senderBillRequestDocRef, {
            [`request.${billId}.recipients.${currentUserUid}.status`]: 'paid',
          });
          console.log(`Bill request ${billId} status updated to 'paid' for sender's (${recipientUid}) recipient record.`);
        }
        // --- END Bill Request Update ---
      });

      Alert.alert('Success', `Successfully paid ₹${formatAmount(amount)} to ${recipientUsername}.`);
      setAmount('');
      // Re-fetch current user's balance to reflect the change
      fetchCurrentUserDetails(currentUserUid);
      navigation.goBack(); // Go back to PayRequest screen after successful payment

    } catch (error: any) {
      console.error("Error making payment: ", error);
      Alert.alert('Payment Failed', error.message || 'There was an error processing your payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to fetch current user's details
  const fetchCurrentUserDetails = (uid: string | undefined) => {
    if (!uid) {
      console.log('No current user UID provided to fetch data.');
      return () => { }; // Return empty cleanup
    }
    const subscriber = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();
          setMyBal(data?.balance || 0); // Use optional chaining for data
          setCurrentUserEmail(data?.email || 'N/A');
          setCurrentUsername(data?.username ? data.username.toUpperCase() : 'N/A');
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
    const fetchRecipientDetails = async (uid: string) => { // uid is guaranteed to be string here
      setIsLoadingRecipient(true); // Start loading
      try {
        const recipientDoc = await firestore().collection('users').doc(uid).get();

        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          setRecipientUsername(recipientData?.username ? recipientData.username.toUpperCase() : 'N/A');
          setRecipientEmail(recipientData?.email || 'N/A');
          console.log("Recipient details fetched:", recipientData);
        } else {
          Alert.alert("Recipient Not Found", "The provided ID does not match a known user.");
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
      fetchRecipientDetails(recipientUid);
    } else {
      // If no recipient UID, set default states and stop loading
      setRecipientUsername('Scan QR / Select Recipient');
      setRecipientEmail('N/A');
      setIsLoadingRecipient(false);
    }
  }, [recipientUid]); // Rerun this effect if recipientUid changes

  // Effect to fetch current user's balance on component mount (and setup listener)
  useEffect(() => {
    if (currentUserUid) {
      const subscriber = fetchCurrentUserDetails(currentUserUid);
      return () => subscriber(); // Cleanup subscription
    }
  }, [currentUserUid]); // Depend on currentUserUid

  const handleKeyPress = (key: string) => {
    // Prevent multiple decimal points
    if (key === '.' && amount.includes('.')) {
      return;
    }
    // Limit to two decimal places
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2 && key !== 'backspace') {
      return;
    }

    if (key === 'backspace') {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount(amount + key);
    }
  };

  const formatAmount = (input: string) => {
    if (!input) return '0';
    let formatted = input.replace(/^0+(?=\d)/, ''); // Remove leading zeros unless it's just '0'
    if (formatted === '') formatted = '0';
    if (formatted === '.') formatted = '0.'; // Handle case where user types '.' first
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add thousands separator
    return parts.join('.');
  };

  const KeypadButton = ({ value }: { value: string }) => (
    <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress(value)}>
      {value === 'backspace' ? (
        <MaterialIcons name="backspace" size={24} color="#E0E0E0" />
      ) : value === 'image' ? ( // This 'image' case seems unused in your current keypad
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
            <Text style={styles.bankBalance}>Your Balance: {mybal !== null ? `₹${mybal.toFixed(2)}` : '...'}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#B0B0B0" style={{ marginLeft: 'auto' }} />
        </View>
        {/* Next Button / Pay Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            // Pass the `pay` function as a callback to `VerifyPin`
            navigation.navigate('VerifyPin', { onSuccess: pay });
          }}
          disabled={isLoadingRecipient || isProcessingPayment || !recipientUid || Number(amount) <= 0} // Disable if no recipient or zero amount
        >
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
    backgroundColor: '#F0F2F5', // Light background color for the screen (PayZapp theme)
    paddingHorizontal: 16,
    paddingTop: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  // Recipient
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White card background
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF2FB', // Light blue for avatar background
    marginRight: 12,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    color: '#333333', // Dark text on light background
    fontSize: 16,
    fontWeight: '600',
  },
  recipientSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  recipientPhone: {
    color: '#666666', // Medium grey text
    fontSize: 12,
  },

  // Amount
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 32,
    color: '#1A73E8', // PayZapp blue accent
    fontWeight: 'bold',
    marginRight: 4,
  },
  amountText: {
    fontSize: 48,
    color: '#333333', // Dark text
    fontWeight: 'bold',
  },

  // Bank
  bankSelectionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White card background
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
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
    color: '#333333', // Dark text
    fontSize: 14,
    fontWeight: '600',
  },
  bankAccount: {
    color: '#666666', // Medium grey text
    fontSize: 12,
  },
  bankBalance: {
    color: '#1A73E8', // PayZapp blue accent
    fontSize: 12,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#1A73E8', // PayZapp blue accent
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Keypad
  keypad: {
    marginTop: 'auto',
    paddingBottom: 12,
    backgroundColor: '#F0F2F5', // Match screen background
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  keypadButton: {
    width: width / 4.2,
    height: width / 4.2,
    backgroundColor: '#FFFFFF', // White keypad buttons
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  keypadButtonText: {
    color: '#333333', // Dark text for numbers
    fontSize: 28,
    fontWeight: '600',
  },
});

export default Payment;