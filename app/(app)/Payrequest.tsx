import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Define types for navigation and route parameters
type RootStackParamList = {
  navigate: (screen: string, params?: object) => void;
  goBack: () => void;
  VerifyPin: { onSuccess: () => void };
};

type PayRequestRouteParams = {
  billRequestId: string;
  originalBillSplitterUid: string; // The UID of the person who sent the request (senderUid in the request object)
};

type BillRequestData = {
  billId: string;
  senderUid: string;
  senderName: string;
  recipientUid: string;
  recipientName: string;
  amountRequested: number;
  description: string;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: firestore.Timestamp; // Firestore Timestamp object
  updatedAt: firestore.Timestamp;
};

const PayRequest = () => {
  const navigation = useNavigation<RootStackParamList>();
  const params = useLocalSearchParams<PayRequestRouteParams>();

  const { billRequestId, originalBillSplitterUid } = params; // Extract params

  const [requestData, setRequestData] = useState<BillRequestData | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [mybal, setMyBal] = useState<number | null>(null); // To display current user's balance

  const currentUserUid = auth().currentUser?.uid;

  // Function to format amount for display (reused from Payment component)
  const formatAmount = (input: string | number | null) => {
    if (input === null || input === '') return '0.00';
    let formatted = String(input);
    if (formatted.length > 1 && formatted.startsWith('0') && !formatted.startsWith('0.')) {
        formatted = formatted.substring(1);
    }
    if (formatted === '') formatted = '0';
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts.length > 1) {
        parts[1] = parts[1].substring(0, 2);
    } else if (formatted.includes('.')) {
        return formatted;
    }
    return parts.join('.');
  };

  // Fetch current user's balance
  const fetchCurrentUserBalance = useCallback((uid: string | undefined) => {
    if (!uid) {
      console.log('No current user UID to fetch balance.');
      return () => {};
    }
    const subscriber = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();
          setMyBal(data?.balance || 0);
        } else {
          setMyBal(0);
        }
      }, (error) => {
        console.error("Error fetching current user balance: ", error);
        setMyBal(0);
      });
    return subscriber;
  }, []);

  // Fetch the specific bill request details for the current user
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!currentUserUid || !billRequestId) {
        Alert.alert("Error", "Missing user ID or request ID.");
        setLoadingRequest(false);
        return;
      }
      setLoadingRequest(true);
      try {
        const userDocRef = firestore().collection('users').doc(currentUserUid);
        const userDocSnapshot = await userDocRef.get();
        const userData = userDocSnapshot.data();

        if (userData && userData.transhistory && userData.transhistory.billRequests) {
          const request = userData.transhistory.billRequests[billRequestId];
          if (request && request.recipientUid === currentUserUid) { // Ensure this request is actually for the current user
            setRequestData(request as BillRequestData);
          } else {
            Alert.alert("Request Not Found", "This bill request does not exist or is not for you.");
            navigation.goBack(); // Go back if request not found or not for this user
          }
        } else {
          Alert.alert("No Requests", "No bill requests found in your history.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching bill request:", error);
        Alert.alert("Error", "Failed to load bill request. Please try again.");
        navigation.goBack();
      } finally {
        setLoadingRequest(false);
      }
    };

    fetchRequestDetails();
    const unsubscribeBalance = fetchCurrentUserBalance(currentUserUid); // Start balance listener
    return () => unsubscribeBalance(); // Cleanup balance listener
  }, [currentUserUid, billRequestId, navigation, fetchCurrentUserBalance]);


  // Payment logic for the request
  const payRequest = async () => {
    if (!requestData) {
      Alert.alert('Error', 'Bill request data is missing.');
      return;
    }
    if (!mybal || mybal < requestData.amountRequested) {
      Alert.alert('Insufficient Balance', `Your balance (₹${formatAmount(mybal)}) is too low for this payment (₹${formatAmount(requestData.amountRequested)}).`);
      return;
    }

    setIsProcessingPayment(true);
    const amountToPay = requestData.amountRequested;
    const transactionId = new Date().toISOString().replace(/[^0-9]/g, ''); // Unique ID for the payment transaction

    try {
      await firestore().runTransaction(async (transaction) => {
        // --- Current User (Payer/Recipient of request) ---
        const payerDocRef = firestore().collection('users').doc(currentUserUid!);
        const payerSnapshot = await transaction.get(payerDocRef);

        if (!payerSnapshot.exists) {
          throw new Error("Payer's account does not exist!");
        }

        const payerBalance = payerSnapshot.data()?.balance || 0;
        if (payerBalance < amountToPay) {
          throw new Error("Insufficient balance.");
        }

        // Debit payer's balance
        transaction.update(payerDocRef, {
          balance: firestore.FieldValue.increment(-amountToPay),
          [`transhistory.${transactionId}`]: { // Record the payment transaction
            amount: -amountToPay,
            type: 'debit',
            recipientUid: requestData.senderUid, // The original splitter is the recipient of this payment
            recipientName: requestData.senderName,
            description: `Payment for: ${requestData.description}`,
            timestamp: firestore.FieldValue.serverTimestamp(),
            relatedBillRequestId: billRequestId, // Link back to the bill request
          },
          // Delete the bill request from payer's history
          [`transhistory.billRequests.${billRequestId}`]: firestore.FieldValue.delete(),
        });

        // --- Original Bill Splitter (Sender of request / Recipient of payment) ---
        const splitterDocRef = firestore().collection('users').doc(requestData.senderUid);
        const splitterSnapshot = await transaction.get(splitterDocRef);

        if (!splitterSnapshot.exists) {
          throw new Error(`Original bill splitter account not found for ID: ${requestData.senderUid}.`);
        }

        // Credit splitter's balance
        transaction.update(splitterDocRef, {
          balance: firestore.FieldValue.increment(amountToPay),
          [`transhistory.${transactionId}`]: { // Record the payment transaction
            amount: amountToPay,
            type: 'credit',
            senderUid: currentUserUid, // The current user is the sender of this payment
            senderName: requestData.recipientName, // Use the recipient name (current user's name)
            description: `Received for: ${requestData.description}`,
            timestamp: firestore.FieldValue.serverTimestamp(),
            relatedBillRequestId: billRequestId, // Link back to the bill request
          },
          // Delete the sent bill request from splitter's history
          [`transhistory.billRequests.${billRequestId}`]: firestore.FieldValue.delete(),
        });
      });

      Alert.alert('Success', `Successfully paid ₹${formatAmount(amountToPay)} for "${requestData.description}".`);
      navigation.goBack(); // Go back after successful payment

    } catch (error: any) {
      console.error("Error processing bill request payment: ", error);
      Alert.alert('Payment Failed', error.message || 'There was an error processing your payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handler to initiate PIN verification before payment
  const handlePayButtonPress = () => {
    if (!requestData) {
      Alert.alert('Error', 'Request data is not loaded.');
      return;
    }
    // Navigate to VerifyPin, passing the payRequest function as callback
    navigation.navigate('VerifyPin', { onSuccess: () => payRequest() });
  };

  if (loadingRequest) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading bill request...</Text>
      </View>
    );
  }

  if (!requestData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No bill request found or an error occurred.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Bill Request</Text>
        <View style={{ width: 28 }} /> {/* Placeholder for alignment */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <MaterialIcons name="receipt" size={30} color="#1A73E8" />
            <Text style={styles.requestDescription}>{requestData.description}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested by:</Text>
            <Text style={styles.detailValue}>{requestData.senderName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount to Pay:</Text>
            <Text style={styles.detailValueAmount}>₹{formatAmount(requestData.amountRequested)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, requestData.status === 'pending' ? styles.statusPending : styles.statusPaid]}>
              {requestData.status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested on:</Text>
            <Text style={styles.detailValue}>{requestData.createdAt.toDate().toLocaleString()}</Text>
          </View>
        </View>

        {/* Current Balance and Payment Button */}
        <View style={styles.paymentInfoCard}>
          <Text style={styles.currentBalanceLabel}>Your Current Balance:</Text>
          <Text style={styles.currentBalanceAmount}>₹{mybal !== null ? formatAmount(mybal) : '...'}</Text>
          {requestData.status === 'pending' ? (
            <TouchableOpacity
              style={[styles.payButton, isProcessingPayment && styles.payButtonDisabled]}
              onPress={handlePayButtonPress}
              disabled={isProcessingPayment || mybal === null || mybal < requestData.amountRequested}
            >
              {isProcessingPayment ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.payButtonText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.paidStatusContainer}>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.paidStatusText}>This request has been paid.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 10,
  },
  requestDescription: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F2F5',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  detailValueAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A73E8',
  },
  statusPending: {
    color: '#FFA500', // Orange for pending
  },
  statusPaid: {
    color: '#4CAF50', // Green for paid
  },
  paymentInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  currentBalanceLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  currentBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A73E8',
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#4CAF50', // Green for Pay button
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  payButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paidStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E8F5E9', // Light green background
    borderRadius: 8,
    width: '90%',
    justifyContent: 'center',
  },
  paidStatusText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default PayRequest;