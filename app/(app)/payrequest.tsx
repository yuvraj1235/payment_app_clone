import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal, // Import Modal for custom confirmation
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { router } from 'expo-router'; // Assuming you are using expo-router
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Import your RootStackParamList - ADJUST THIS PATH if your types file is elsewhere
// This is a placeholder, ensure it matches your actual navigation setup
type RootStackParamList = {
  payment: { recipientUid: string; amountToPay: string; billId: string; billDescription: string };
  // Add other routes as needed if you navigate to them
  login: undefined; // For the login button in error state
  // ... other routes
};

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

  // State for custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestToDecline, setRequestToDecline] = useState<BillRequest | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Explicitly type the navigation hook
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchRequests = useCallback(() => {
    if (!currentUserUid) {
      setLoading(false);
      return () => {};
    }

    const userDocRef = firestore().collection('users').doc(currentUserUid);
    const unsubscribe = userDocRef.onSnapshot(docSnapshot => {
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
      setModalMessage("Failed to load requests in real-time. Please try again.");
      setShowErrorModal(true);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, [currentUserUid]);

  useEffect(() => {
    const unsubscribe = fetchRequests();
    return () => {
      unsubscribe();
    };
  }, [fetchRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleRequestAction = async (
    request: BillRequest,
    action: 'paid' | 'declined'
  ) => {
    if (!currentUserUid) {
      setModalMessage("User not authenticated.");
      setShowErrorModal(true);
      return;
    }

    if (action === 'paid') {
      navigation.navigate('payment', {
        recipientUid: request.senderUid,
        amountToPay: request.amount.toFixed(2),
        billId: request.billId,
        billDescription: request.description
      });
      return;
    }

    // For 'declined' action, show custom confirmation modal
    setRequestToDecline(request);
    setShowConfirmModal(true);
  };

  const confirmDecline = async () => {
    if (!requestToDecline || !currentUserUid) return;

    setShowConfirmModal(false); // Close the confirmation modal

    try {
      const batch = firestore().batch();

      const recipientDocRef = firestore().collection('users').doc(currentUserUid);
      batch.update(recipientDocRef, {
        [`request.${requestToDecline.billId}.status`]: 'declined',
      });
      console.log(`Recipient's request status for ${requestToDecline.billId} set to declined.`);

      const senderDocRef = firestore().collection('users').doc(requestToDecline.senderUid);
      batch.update(senderDocRef, {
        [`request.${requestToDecline.billId}.recipients.${currentUserUid}.status`]: 'declined',
      });
      console.log(`Sender's recipient status for ${currentUserUid} in bill ${requestToDecline.billId} set to declined.`);

      await batch.commit();
      setModalMessage('Request declined successfully!');
      setShowSuccessModal(true);
      setRequestToDecline(null); // Clear the request
    } catch (error: any) {
      console.error(`Error declining bill request:`, error);
      setModalMessage(`Failed to decline request: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  const renderRequestCard = (req: BillRequest, isHistory: boolean = false) => (
    <View key={req.billId} style={[styles.requestCard, isHistory && styles.historyCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDescription}>{req.description}</Text>
        <Text style={[
          styles.cardAmount,
          req.status === 'paid' ? styles.paidAmount :
          req.status === 'declined' ? styles.declinedAmount :
          styles.pendingAmount // Apply specific style for pending
        ]}>
          ₹{req.amount.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.cardSender}>From: {req.senderName}</Text>
      <Text style={styles.cardDate}>
        {isHistory ? 'Status: ' : 'Requested on: '}
        {isHistory && (
          <Text style={{ fontWeight: 'bold', color: req.status === 'paid' ? '#4CAF50' : '#FF5252' }}>
            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}{' '}
          </Text>
        )}
        {isHistory ? 'on: ' : ''}
        {req.timestamp?.toDate()?.toLocaleDateString() || 'N/A'}
      </Text>
      {!isHistory && (
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
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.loadingText}>Loading your requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Requests</Text>
        <View style={{ width: 28 }} /> {/* Placeholder for alignment */}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009688" />
        }
      >
        {pendingRequests.length === 0 && historyRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={80} color="#A0A0A0" />
            <Text style={styles.emptyStateText}>No bill requests found.</Text>
            <Text style={styles.emptyStateSubText}>
              When someone splits a bill with you, it will appear here.
            </Text>
          </View>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pending Requests</Text>
                {pendingRequests.map((req) => renderRequestCard(req))}
              </>
            )}

            {historyRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Request History</Text>
                {historyRequests.map((req) => renderRequestCard(req, true))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Custom Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="warning" size={40} color="#FFC107" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Decline</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to decline the request from{' '}
              <Text style={styles.modalHighlightText}>{requestToDecline?.senderName}</Text> for{' '}
              <Text style={styles.modalHighlightText}>₹{requestToDecline?.amount.toFixed(2)}</Text>{' '}
              ({requestToDecline?.description})?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmDecline}
              >
                <Text style={styles.modalButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="check-circle" size={40} color="#4CAF50" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="error" size={40} color="#FF5252" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F8F5F0', // Light cream background from Home screen
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F5F0',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  // Header styles (consistent with MyQRCode.tsx)
   header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#009688', // Darker Teal from Home banner
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 30, // To account for SafeAreaView and status bar
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20, // Add margin below header
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 15,
    marginTop: 10,
    // Removed borderBottom for cleaner look, relies on card separation
    paddingBottom: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 30,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#888',
    marginTop: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 10,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Lighter border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  historyCard: {
    opacity: 0.8, // Dim history cards slightly
    backgroundColor: '#F0F0F0', // Slightly different background for history
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
  },
  pendingAmount: {
    color: '#009688', // Teal for pending amount
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
    backgroundColor: '#4CAF50', // Green for Pay
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
    backgroundColor: '#FF5252', // Red for Decline
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
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black overlay
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalHighlightText: {
    fontWeight: 'bold',
    color: '#009688', // Teal for highlights in modal message
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalCancelButton: {
    backgroundColor: '#757575', // Grey for cancel
  },
  modalConfirmButton: {
    backgroundColor: '#009688', // Teal for confirm/OK
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PayRequest;