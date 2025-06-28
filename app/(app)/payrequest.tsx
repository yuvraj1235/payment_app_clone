// PayRequest.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert, // Make sure Alert is imported
  TouchableOpacity,
  RefreshControl,
  Platform
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Import your RootStackParamList - ADJUST THIS PATH if your types file is elsewhere
import { RootStackParamList } from './navigationTypes';

// Define a type for a single bill request
type BillRequest = {
  billId: string;
  description: string;
  amount: number;
  senderUid: string;
  senderName: string;
  status: 'pending' | 'paid' | 'declined';
  timestamp: FirebaseFirestoreTypes.Timestamp;
};

const PayRequest = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<BillRequest[]>([]);
  const [historyRequests, setHistoryRequests] = useState<BillRequest[]>([]);
  const currentUserUid = auth().currentUser?.uid;

  // Explicitly type the navigation hook
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Removed 'async' keyword from useCallback
  const fetchRequests = useCallback(() => {
    // If no user, set loading to false and return a no-op function for cleanup
    if (!currentUserUid) {
      setLoading(false);
      return () => {}; // Return an empty function for useEffect cleanup
    }

    let unsubscribe: () => void; // Declare unsubscribe outside try/catch

    try {
      const userDocRef = firestore().collection('users').doc(currentUserUid);
      // onSnapshot returns the unsubscribe function directly
      unsubscribe = userDocRef.onSnapshot(docSnapshot => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const requestsMap = userData?.request || {};

          const fetchedPending: BillRequest[] = [];
          const fetchedHistory: BillRequest[] = [];

          for (const billId in requestsMap) {
            const request = requestsMap[billId];
            if (request.type === 'bill_request_received') {
              const billRequest: BillRequest = {
                billId: billId,
                description: request.description,
                amount: request.amount,
                senderUid: request.senderUid,
                senderName: request.senderName,
                status: request.status,
                timestamp: request.timestamp,
              };

              if (request.status === 'pending') {
                fetchedPending.push(billRequest);
              } else {
                fetchedHistory.push(billRequest);
              }
            }
          }

          fetchedPending.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
          fetchedHistory.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

          setPendingRequests(fetchedPending);
          setHistoryRequests(fetchedHistory);
        } else {
          setPendingRequests([]);
          setHistoryRequests([]);
        }
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error("Error fetching real-time requests:", error);
        Alert.alert("Error", "Failed to load requests in real-time. Please try again.");
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe; // This now correctly returns the unsubscribe function

    } catch (error) {
      // Handle immediate errors during listener setup
      console.error('Error setting up bill requests listener:', error);
      Alert.alert('Error', 'Failed to set up real-time request listener. Please try again.');
      setLoading(false);
      setRefreshing(false);
      return () => {}; // Return a no-op function in case of immediate error
    }
  }, [currentUserUid]);

  useEffect(() => {
    // The fetchRequests now directly returns the unsubscribe function
    const unsubscribe = fetchRequests();
    return () => {
      // Call the unsubscribe function when the component unmounts or dependencies change
      unsubscribe();
    };
  }, [fetchRequests]); // Dependency array for useEffect

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // When refreshing, we re-run fetchRequests which will set up a new listener
    // The previous listener will be cleaned up by useEffect's return function
    fetchRequests();
  }, [fetchRequests]);

  const handleRequestAction = async (
    request: BillRequest,
    action: 'paid' | 'declined'
  ) => {
    if (!currentUserUid) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    if (action === 'paid') {
      // Redirect to Payment screen with necessary details
      navigation.navigate('Payment', { // This line is now correctly typed
        recipientUid: request.senderUid,
        amountToPay: request.amount.toFixed(2),
        billId: request.billId,
        billDescription: request.description
      });
      return;
    }

    Alert.alert(
      `Confirm Decline`,
      `Are you sure you want to decline the request from ${request.senderName} for ₹${request.amount.toFixed(2)} (${request.description})?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm Decline',
          onPress: async () => {
            try {
              const batch = firestore().batch();

              const recipientDocRef = firestore().collection('users').doc(currentUserUid);
              batch.update(recipientDocRef, {
                [`request.${request.billId}.status`]: action,
              });
              console.log(`Recipient's request status for ${request.billId} set to ${action}.`);

              const senderDocRef = firestore().collection('users').doc(request.senderUid);
               batch.update(senderDocRef, {
                 [`request.${request.billId}.recipients.${currentUserUid}.status`]: action,
               });
               console.log(`Sender's recipient status for ${currentUserUid} in bill ${request.billId} set to ${action}.`);

              await batch.commit();
              Alert.alert('Success', `Request ${action} successfully!`);
            } catch (error: any) {
              console.error(`Error ${action} bill request:`, error);
              Alert.alert('Error', `Failed to ${action} request: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading your requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.header}>💰 Your Bill Requests</Text>

        {pendingRequests.length === 0 && historyRequests.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={80} color="#ccc" />
            <Text style={styles.emptyStateText}>No bill requests found.</Text>
            <Text style={styles.emptyStateSubText}>
              When someone splits a bill with you, it will appear here.
            </Text>
          </View>
        )}

        {pendingRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {pendingRequests.map((req) => (
              <View key={req.billId} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDescription}>{req.description}</Text>
                  <Text style={styles.cardAmount}>₹{req.amount.toFixed(2)}</Text>
                </View>
                <Text style={styles.cardSender}>From: {req.senderName}</Text>
                <Text style={styles.cardDate}>
                  Requested on:{' '}
                  {req.timestamp?.toDate()?.toLocaleDateString() || 'N/A'}
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handleRequestAction(req, 'paid')}
                  >
                    <MaterialIcons name="check" size={20} color="#fff" />
                    <Text style={styles.payButtonText}>Pay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleRequestAction(req, 'declined')}
                  >
                    <MaterialIcons name="close" size={20} color="#fff" />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {historyRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Request History</Text>
            {historyRequests.map((req) => (
              <View key={req.billId} style={[styles.requestCard, styles.historyCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDescription}>{req.description}</Text>
                  <Text style={[styles.cardAmount, req.status === 'paid' ? styles.paidAmount : styles.declinedAmount]}>
                    ₹{req.amount.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.cardSender}>From: {req.senderName}</Text>
                <Text style={styles.cardDate}>
                  Status:{' '}
                  <Text style={{ fontWeight: 'bold', color: req.status === 'paid' ? '#4CAF50' : '#FF5252' }}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </Text>{' '}
                  on:{' '}
                  {req.timestamp?.toDate()?.toLocaleDateString() || 'N/A'}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    fontSize: 26,
    color: '#333333',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 15,
    marginTop: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#888',
    marginTop: 20,
    fontWeight: 'bold',
  },
  emptyStateSubText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EBF2FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  historyCard: {
    opacity: 0.7, // Dim history cards slightly
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
    marginRight: 10,
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A73E8', // Blue for pending
  },
  paidAmount: {
    color: '#4CAF50', // Green for paid
  },
  declinedAmount: {
    color: '#FF5252', // Red for declined
  },
  cardSender: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5,
  },
  cardDate: {
    fontSize: 13,
    color: '#777',
    marginBottom: 15,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  declineButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PayRequest;
