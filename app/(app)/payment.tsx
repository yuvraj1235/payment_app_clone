import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal, // Import Modal for custom alerts
  TextInput, // Ensure TextInput is imported
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // Import RouteProp
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'; // Import for Timestamp type
import { router } from 'expo-router'; // Re-added for back navigation
import { SafeAreaView } from 'react-native-safe-area-context'; // Correctly imported
import LottieView from 'lottie-react-native'; // Import LottieView

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

// Define RootStackParamList for navigation typing
export type RootStackParamList = {
  VerifyPin: { onSuccess?: () => void };
  PaymentSuccess: {
    amount: number;
    recipientUsername: string;
    selectedBank: { name: string; lastDigits: string };
    billDescription?: string;
  };
  login: undefined;
};

// Helper function to generate a consistent color based on a string (e.g., UID or username)
const getDeterministicColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const Payment = () => {
  const navigation = useNavigation();
  const route = useRoute<PaymentScreenRouteProp>();
  const { recipientUid, amountToPay, billId, billDescription } = route.params ?? {};

  const [amount, setAmount] = useState('');
  const [mybal, setMyBal] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [recipientUsername, setRecipientUsername] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState({ name: 'HDFC Bank', lastDigits: '0123' });
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // State for the custom modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const lottieRef = useRef<LottieView>(null);


  const currentUserUid = auth().currentUser?.uid;

  const showCustomModal = (title: string, message: string, type: 'success' | 'error') => {
    setModalTitle(title);
    setModalMessage(message);
    if (type === 'success') {
      setShowSuccessModal(true);
      lottieRef.current?.play();
    } else {
      setShowErrorModal(true);
    }
  };

  useEffect(() => {
    if (amountToPay) {
      setAmount(String(amountToPay));
    } else {
      setAmount('0');
    }
  }, [amountToPay]);

  const pay = async () => {
    if (!amount || Number(amount) <= 0) {
      showCustomModal('Invalid Amount', 'Please enter a valid amount to pay.', 'error');
      return;
    }

    if (!recipientUid) {
      showCustomModal('No Recipient', 'Cannot process payment without a recipient ID. Please go back and select a recipient.', 'error');
      return;
    }

    if (currentUserUid === recipientUid) {
      showCustomModal('Error', 'Cannot send money to yourself.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    const amountToPayNum = Number(amount);
    const transactionId = new Date().toISOString().replace(/[^0-9]/g, '');

    try {
      await firestore().runTransaction(async (transaction) => {
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

        transaction.update(senderDocRef, {
          balance: firestore.FieldValue.increment(-amountToPayNum),
          [`transhistory.${transactionId}`]: {
            amount: -amountToPayNum,
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

        transaction.update(recipientDocRef, {
          balance: firestore.FieldValue.increment(amountToPayNum),
          [`transhistory.${transactionId}`]: {
            amount: amountToPayNum,
            type: 'credit',
            senderUid: currentUserUid,
            senderName: currentUsername || 'Unknown Sender',
            timestamp: firestore.FieldValue.serverTimestamp(),
          },
        });

        if (billId && currentUserUid) {
          const recipientBillRequestDocRef = firestore().collection('users').doc(currentUserUid);
          const senderBillRequestDocRef = firestore().collection('users').doc(recipientUid);

          transaction.update(recipientBillRequestDocRef, {
            [`request.${billId}.status`]: 'paid',
          });
          console.log(`Bill request ${billId} status updated to 'paid' for current user (${currentUserUid}).`);

          transaction.update(senderBillRequestDocRef, {
            [`request.${billId}.recipients.${currentUserUid}.status`]: 'paid',
          });
          console.log(`Bill request ${billId} status updated to 'paid' for sender's (${recipientUid}) recipient record.`);
        }
      });

      // Show the custom success modal instead of native alert
      showCustomModal('Success', `Successfully paid ₹${Number(amount).toFixed(2)} to ${recipientUsername}.`, 'success');
      setAmount('');
      fetchCurrentUserDetails(currentUserUid);
      // navigation.goBack(); // Navigation will now be handled by the modal's onAnimationFinish
    } catch (error: any) {
      console.error("Error making payment: ", error);
      showCustomModal('Payment Failed', error.message || 'There was an error processing your payment. Please try again.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleLottieAnimationFinish = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const fetchCurrentUserDetails = useCallback((uid: string | undefined) => {
    if (!uid) {
      console.log('No current user UID provided to fetch data.');
      return () => { };
    }
    const subscriber = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();
          setMyBal(data?.balance || 0);
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
  }, []);

  useEffect(() => {
    const fetchRecipientDetails = async (uid: string) => {
      setIsLoadingRecipient(true);
      try {
        const recipientDoc = await firestore().collection('users').doc(uid).get();

        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          setRecipientUsername(recipientData?.username ? recipientData.username.toUpperCase() : 'N/A');
          setRecipientEmail(recipientData?.email || 'N/A');
          console.log("Recipient details fetched:", recipientData);
        } else {
          showCustomModal("Recipient Not Found", "The provided ID does not match a known user.", 'error');
          setRecipientUsername('Unknown User');
          setRecipientEmail('N/A');
        }
      } catch (error) {
        console.error("Error fetching recipient details:", error);
        showCustomModal("Error", "Could not fetch recipient details. Please check your network.", 'error');
        setRecipientUsername('Error');
        setRecipientEmail('Error');
      } finally {
        setIsLoadingRecipient(false);
      }
    };

    if (recipientUid) {
      fetchRecipientDetails(recipientUid);
    } else {
      setRecipientUsername('Scan QR / Select Recipient');
      setRecipientEmail('N/A');
      setIsLoadingRecipient(false);
    }
  }, [recipientUid]);

  useEffect(() => {
    if (currentUserUid) {
      const subscriber = fetchCurrentUserDetails(currentUserUid);
      return () => subscriber();
    }
  }, [currentUserUid, fetchCurrentUserDetails]);

  const formatAmount = (input: string) => {
    if (!input) return '0';
    let formatted = input.replace(/^0+(?=\d)/, '');
    if (formatted === '') formatted = '0';
    if (formatted === '.') formatted = '0.';
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const recipientInitials = recipientUsername ? recipientUsername.charAt(0).toUpperCase() : '';
  const recipientIconColor = getDeterministicColor(recipientUid || recipientUsername || 'default');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.contentArea}>
        <View style={styles.recipientContainer}>
          {isLoadingRecipient ? (
            <ActivityIndicator size="small" color="#009688" style={styles.recipientAvatar} />
          ) : (
            <View style={[styles.recipientAvatar, { backgroundColor: recipientIconColor + '33' }]}>
              {recipientInitials ? (
                <Text style={[styles.recipientInitials, { color: recipientIconColor }]}>{recipientInitials}</Text>
              ) : (
                <MaterialIcons name="person" size={30} color={recipientIconColor} />
              )}
            </View>
          )}
          <View style={styles.recipientDetails}>
            {isLoadingRecipient ? (
              <ActivityIndicator size="small" color="#009688" />
            ) : (
              <Text style={styles.recipientName}>{recipientUsername || 'Recipient N/A'}</Text>
            )}
            <View style={styles.recipientSubInfo}>
              <MaterialIcons name="check-circle" size={14} color="#4CAF50" style={{ marginRight: 5 }} />
              <Text style={styles.recipientStatusText}>Verified UPI ID</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountInputSection}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountTextInput}
            value={amount}
            onChangeText={(text) => {
              const newText = text.replace(/[^0-9.]/g, '');
              if (newText.split('.').length > 2) {
                return;
              }
              if (newText.includes('.') && newText.split('.')[1]?.length > 2) {
                return;
              }
              setAmount(newText);
            }}
            keyboardType="numeric"
            editable={true}
            placeholder="0"
            placeholderTextColor="#A7B7B3"
            caretHidden={false}
          />
        </View>
        {billDescription && (
          <Text style={styles.billDescriptionText}>For: {billDescription}</Text>
        )}

        <TouchableOpacity style={styles.bankSelectionWrapper}>
          <View style={styles.bankSelectionContainer}>
            <MaterialIcons name="account-balance" size={24} color="#009688" style={{ marginRight: 10 }} />
            <View style={styles.bankInfo}>
              <Text style={styles.bankName}>{selectedBank.name}</Text>
              <Text style={styles.bankAccount}>A/c No. XX{selectedBank.lastDigits}</Text>
              <Text style={styles.bankBalance}>Balance: {mybal !== null ? `₹${mybal.toFixed(2)}` : 'Fetching...'}</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#78909C" style={{ marginLeft: 'auto' }} />
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }} /> 

        <TouchableOpacity
          style={[styles.payButton, (isLoadingRecipient || isProcessingPayment || !recipientUid || Number(amount) <= 0) && styles.payButtonDisabled]}
          onPress={() => navigation.navigate('VerifyPin', { onSuccess: pay })}
          disabled={isLoadingRecipient || isProcessingPayment || !recipientUid || Number(amount) <= 0}
        >
          {isProcessingPayment ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialIcons name="arrow-forward" size={28} color="#FFF" />
              <Text style={styles.payButtonText}>Pay {amount ? `₹${Number(amount).toFixed(2)}` : ''}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleLottieAnimationFinish}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LottieView
              ref={lottieRef}
              source={require('../../assets/Lottie Lego.json')}
              autoPlay={false}
              loop={false}
              style={styles.lottieAnimation}
              onAnimationFinish={handleLottieAnimationFinish}
            />
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleLottieAnimationFinish}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="error" size={40} color="#FF5252" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalErrorButton]}
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
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#009688',
    paddingHorizontal: 15,
    paddingVertical: 15,
    // paddingTop: Platform.OS === 'android' ? 40 : 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  recipientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recipientInitials: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    color: '#004D40',
    fontSize: 18,
    fontWeight: '600',
  },
  recipientSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recipientStatusText: {
    color: '#00695C',
    fontSize: 13,
  },
  amountInputSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  currencySymbol: {
    fontSize: 36,
    color: '#009688',
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountTextInput: {
    fontSize: 56,
    color: '#004D40',
    fontWeight: 'bold',
    padding: 0,
    minWidth: 100,
    textAlign: 'center',
  },
  billDescriptionText: {
    fontSize: 15,
    color: '#00695C',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  bankSelectionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
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
    color: '#004D40',
    fontSize: 16,
    fontWeight: '600',
  },
  bankAccount: {
    color: '#00695C',
    fontSize: 13,
  },
  bankBalance: {
    color: '#009688',
    fontSize: 13,
    fontWeight: '500',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#009688',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  payButtonDisabled: {
    backgroundColor: '#B2DFDB',
    shadowColor: '#B2DFDB',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    backgroundColor: '#009688',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalErrorButton: {
    backgroundColor: '#FF5252',
    shadowColor: '#FF5252',
  },
  lottieAnimation: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
});

export default Payment;
