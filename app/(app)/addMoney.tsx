import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert, // Keep Alert for potential fallbacks or debugging, but we'll use a custom modal
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal, // Import Modal for custom alerts
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import RazorpayCheckout from 'react-native-razorpay';

const RAZORPAY_KEY_ID = 'rzp_test_wGFrV7EdjuGMfq';

const DUMMY_ORDER_ID = 'order_dummy_id_12345';

const AddMoneyScreen = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [amount, setAmount] = useState('');
  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Modal states for custom alerts
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');

  const initialAuthToken = typeof initialAuthToken !== 'undefined' ? initialAuthToken : null;

  // Function to display the custom alert modal
  const displayCustomAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowCustomModal(true);
  };

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setIsAuthReady(true);
        console.log('Firebase Auth State Changed: User is signed in with UID:', user.uid);
      } else {
        try {
          if (initialAuthToken) {
            await auth().signInWithCustomToken(initialAuthToken);
            console.log('Signed in with custom token.');
          } else {
            await auth().signInAnonymously();
            console.log('Signed in anonymously.');
          }
        } catch (authError: any) {
          displayCustomAlert('Authentication Error', `Failed to authenticate: ${authError.message}`, 'error');
          console.error('Firebase Authentication Error:', authError);
          setIsAuthReady(true);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isAuthReady && currentUserId) {
      setLoadingBalance(true);
      const userDocRef = firestore().collection('users').doc(currentUserId);

      const unsubscribeSnapshot = userDocRef.onSnapshot(
        (documentSnapshot) => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data();
            setMyBalance(data?.balance || 0);
          } else {
            console.log('Current user document does not exist. Creating default profile...');
            userDocRef
              .set(
                {
                  username: `User_${currentUserId.substring(0, 8)}`,
                  email: auth().currentUser?.email || 'N/A',
                  balance: 0,
                  transhistory: [],
                  createdAt: firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
              )
              .then(() => {
                setMyBalance(0);
                displayCustomAlert('Profile Created', 'A default user profile has been created for you.', 'info');
              })
              .catch((error) => {
                console.error('Error creating user profile:', error);
                displayCustomAlert('Error', 'Failed to create user profile.', 'error');
              });
          }
          setLoadingBalance(false);
        },
        (error) => {
          console.error('Error fetching current user balance: ', error);
          displayCustomAlert('Error', 'Failed to load balance. Please check your network.', 'error');
          setLoadingBalance(false);
        }
      );
      return () => unsubscribeSnapshot();
    }
  }, [isAuthReady, currentUserId]);

  const handleAddMoney = async () => {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      displayCustomAlert('Invalid Amount', 'Please enter a valid amount to add.', 'error');
      return;
    }

    if (!currentUserId) {
      displayCustomAlert('Authentication Required', 'Please sign in to add money.', 'info');
      return;
    }

    setIsProcessingPayment(true);

    const options = {
      description: 'Adding money to wallet',
      image: 'https://example.com/your-app-logo.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: parsedAmount * 100,
      name: 'PayZap',
      prefill: {
        email: auth().currentUser?.email || '',
        contact: '',
        name: auth().currentUser?.displayName || '',
      },
      theme: { color: '#009688' },
    };

    try {
      const data = await RazorpayCheckout.open(options);
      console.log('Razorpay Success:', data);

      const userDocRef = firestore().collection('users').doc(currentUserId);

      await userDocRef.update({
        balance: firestore.FieldValue.increment(parsedAmount)
      });

      displayCustomAlert('Success', `Successfully added ₹${parsedAmount.toFixed(2)} to your balance.`, 'success');
      setAmount('');
    } catch (error: any) {
      console.error('Razorpay Error:', error);
      displayCustomAlert('Payment Failed', `Error: ${error.code || 'UNKNOWN_ERROR'} - ${error.description || 'Payment was cancelled or failed.'}`, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Add Money to Wallet</Text>
          </View>

          <View style={styles.balanceContainer}>
            <View style={styles.balanceHeader}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#009688" />
              <Text style={styles.balanceLabel}>Your Current Balance:</Text>
            </View>
            {loadingBalance ? (
              <ActivityIndicator size="large" color="#009688" style={styles.balanceLoader} />
            ) : (
              <Text style={styles.balanceAmount}>₹{myBalance !== null ? myBalance.toFixed(2) : '...'}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter Amount</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#A7B7B3"
                value={amount}
                onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddMoney}
            disabled={isProcessingPayment || !isAuthReady || !currentUserId || parseFloat(amount) <= 0}
          >
            {isProcessingPayment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Add ₹{amount || '0.00'}</Text>
            )}
          </TouchableOpacity>

          {!isAuthReady && (
            <Text style={styles.authWarning}>Authenticating with Firebase... Please wait.</Text>
          )}
          {!currentUserId && isAuthReady && (
            <Text style={styles.authWarning}>User not signed in. Attempting anonymous sign-in.</Text>
          )}

          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={20} color="#009688" style={{ marginRight: 10 }} />
            <Text style={styles.infoText}>
              **Important:** For production, the Razorpay Order ID must be generated securely on your
              backend server using your API secrets. Do not expose secrets on the client-side.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCustomModal}
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === 'success' && <MaterialIcons name="check-circle" size={40} color="#4CAF50" style={styles.modalIcon} />}
            {modalType === 'error' && <MaterialIcons name="error" size={40} color="#FF5252" style={styles.modalIcon} />}
            {modalType === 'info' && <MaterialIcons name="info" size={40} color="#2196F3" style={styles.modalIcon} />}

            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCustomModal(false)}
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
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    // paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width:'100%',
    justifyContent: 'space-between',
    backgroundColor: '#009688', // Darker Teal from Home banner
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 35, // To account for SafeAreaView and status bar
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20, // Add margin below header
  },
  headerText: {
    fontSize: 24,
    paddingLeft:60,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#00695C',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#009688',
  },
  balanceLoader: {
    marginTop: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: '#00695C',
    marginBottom: 10,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#009688',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#004D40',
    fontSize: 36,
    fontWeight: 'bold',
    paddingVertical: 15,
    paddingRight: 0,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#009688',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  authWarning: {
    color: '#FFAB00',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 15,
    marginTop: 30,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#009688',
  },
  infoText: {
    flex: 1,
    color: '#006064',
    fontSize: 12,
    lineHeight: 18,
  },
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#004D40',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#00695C',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#009688',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddMoneyScreen;