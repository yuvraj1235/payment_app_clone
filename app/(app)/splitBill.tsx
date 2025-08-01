import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert, // Keeping Alert imported for potential fallbacks
  Modal, // Import Modal for custom alerts
  Dimensions
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native'; // Use for navigation.goBack()

const { width } = Dimensions.get('window');

type Participant = {
  uid: string;
  name: string;
  share: number;
};

type DropdownItem = {
  label: string;
  value: string;
};

const SplitBill = () => {
  const navigation = useNavigation();
  const [totalAmount, setTotalAmount] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isSendingRequests, setIsSendingRequests] = useState(false);
  const [sharesCalculated, setSharesCalculated] = useState(false);

  // Modal states for custom alerts
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const currentUserUid = auth().currentUser?.uid;
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Function to display the custom alert modal
  const displayCustomAlert = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowCustomModal(true);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingUsers(true);
      try {
        const usersSnapshot = await firestore().collection('users').get();
        const fetchedDropdownItems: DropdownItem[] = [];
        let fetchedCurrentUsername: string | null = null;

        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          const username = userData.username || 'Unnamed User ' + doc.id.substring(0, 4);
          fetchedDropdownItems.push({ label: username, value: doc.id });

          if (doc.id === currentUserUid) {
            fetchedCurrentUsername = username;
          }
        });

        setItems(fetchedDropdownItems);
        setCurrentUsername(fetchedCurrentUsername);

        if (!fetchedCurrentUsername && currentUserUid) {
            displayCustomAlert("User Data Missing", "Could not fetch your username. Please ensure your profile is complete.", 'error');
        }

      } catch (error) {
        console.error('Error fetching users or current user data:', error);
        displayCustomAlert('Error', 'Failed to load user list or your profile. Please try again.', 'error');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUserData();
  }, [currentUserUid, displayCustomAlert]);

  const addParticipant = () => {
    if (!selectedUser) {
      displayCustomAlert('Select User', 'Please select a person to add to the bill.', 'info');
      return;
    }
    if (selectedUser === currentUserUid) {
      displayCustomAlert('Cannot Add Self', 'You are the one splitting the bill. Do not add yourself as a participant.', 'info');
      return;
    }

    const already = participants.find(p => p.uid === selectedUser);
    if (already) {
      displayCustomAlert('Already Added', `${already.name} is already in the list.`, 'info');
      return;
    }

    const user = items.find(u => u.value === selectedUser);
    if (user) {
      setParticipants([...participants, { uid: user.value, name: user.label, share: 0 }]);
      setSelectedUser(null);
      setSharesCalculated(false);
    }
  };

  const removeParticipant = (uidToRemove: string) => {
    setParticipants(prev => prev.filter(p => p.uid !== uidToRemove));
    setSharesCalculated(false);
  };

  const handleShareChange = (uid: string, text: string) => {
    const newShare = parseFloat(text);
    setParticipants(prev =>
      prev.map(p =>
        p.uid === uid ? { ...p, share: isNaN(newShare) ? 0 : parseFloat(newShare.toFixed(2)) } : p
      )
    );
    setSharesCalculated(false);
  };

  const calculateEqualSharesLocally = () => {
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      displayCustomAlert('Invalid Amount', 'Please enter a valid positive total amount.', 'error');
      return;
    }
    if (participants.length === 0) {
      displayCustomAlert('No Participants', 'Please add at least one person to split the bill.', 'info');
      return;
    }

    const shareValue = (total / participants.length);
    setParticipants(participants.map(p => ({ ...p, share: parseFloat(shareValue.toFixed(2)) })));
    setSharesCalculated(true);
    displayCustomAlert('Shares Calculated', `Each person owes ₹${shareValue.toFixed(2)}.`, 'success');
  };

  const sendBillRequests = async () => {
    const total = parseFloat(totalAmount);
    const sumOfShares = participants.reduce((sum, p) => sum + p.share, 0);

    if (isNaN(total) || total <= 0) {
      displayCustomAlert('Invalid Total Amount', 'Please enter a valid positive total amount for the bill.', 'error');
      return;
    }
    if (participants.length === 0) {
      displayCustomAlert('No Participants', 'Add participants to send requests.', 'info');
      return;
    }
    if (!requestDescription.trim()) {
      displayCustomAlert('Missing Description', 'Please add a short description for the bill (e.g., "Dinner", "Rent").', 'info');
      return;
    }
    if (!currentUserUid || !currentUsername) {
      displayCustomAlert('Authentication Error', 'Your user data is not fully loaded. Please try again.', 'error');
      return;
    }

    if (Math.abs(sumOfShares - total) > 0.01) {
      // Replaced Alert.alert for consistency with custom modal usage
      displayCustomAlert(
        'Share Mismatch!',
        `The sum of individual shares (₹${sumOfShares.toFixed(2)}) does not match the total bill amount (₹${total.toFixed(2)}). Do you want to send requests anyway?`,
        'warning'
        // Note: For 'warning' type, the OK button will simply dismiss it.
        // If you need "Send Anyway" / "Adjust Shares" buttons, you'd need a more complex custom modal that takes callbacks for buttons.
        // For simplicity with the existing custom modal structure, it will just inform.
        // If you need action buttons here, a separate, more complex modal structure is required.
      );
      // Exit here if mismatch and user needs to be informed (or re-prompted with choices)
      // If you want "Send Anyway" option, you must use native Alert.alert or a more advanced custom modal.
      return;
    }

    proceedSendBillRequests();
  };

  const proceedSendBillRequests = async () => {
    setIsSendingRequests(true);
    const batch = firestore().batch();
    const commonBillId = uuidv4();

    console.log("--- Starting Bill Request Send Transaction ---");
    console.log("Common Bill ID:", commonBillId);
    console.log("Current User UID (Sender):", currentUserUid);
    console.log("Current Username (Sender):", currentUsername);
    console.log("Total Amount:", totalAmount);
    console.log("Description:", requestDescription.trim());
    console.log("Participants:", participants);

    try {
      const senderDocRef = firestore().collection('users').doc(currentUserUid);

      const senderBillRequestData = {
        amount: parseFloat(totalAmount),
        type: 'bill_request_sent',
        description: requestDescription.trim(),
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        recipients: participants.map(p => ({
            uid: p.uid,
            name: p.name,
            share: p.share,
            status: 'pending'
        })),
        billId: commonBillId
      };

      console.log('Batch Update: Sender Doc Path:', senderDocRef.path);
      console.log('Batch Update: Sender Data:', JSON.stringify(senderBillRequestData, null, 2));
      batch.update(senderDocRef, {
        [`request.${commonBillId}`]: senderBillRequestData
      });

      for (const participant of participants) {
        const recipientDocRef = firestore().collection('users').doc(participant.uid);
        const recipientBillRequestData = {
          amount: participant.share,
          type: 'bill_request_received',
          description: requestDescription.trim(),
          timestamp: firestore.FieldValue.serverTimestamp(),
          status: 'pending',
          senderUid: currentUserUid,
          senderName: currentUsername,
          billId: commonBillId
        };
        console.log('Batch Update: Recipient Doc Path:', recipientDocRef.path);
        console.log('Batch Update: Recipient Data for', participant.name, ':', JSON.stringify(recipientBillRequestData, null, 2));
        batch.update(recipientDocRef, {
          [`request.${commonBillId}`]: recipientBillRequestData
        });
      }

      console.log('Committing batch...');
      await batch.commit();
      console.log('Batch committed successfully!');

      displayCustomAlert('Success', 'Bill split requests sent successfully!', 'success');
      setTotalAmount('');
      setRequestDescription('');
      setParticipants([]);
      setSharesCalculated(false);
    } catch (error: any) {
      console.error('--- Error sending bill requests: ---');
      console.error('Error Object:', error);
      console.error('Error Code:', error.code || 'N/A');
      console.error('Error Message:', error.message || 'Unknown error');
      displayCustomAlert('Error', `Failed to send requests: ${error.message || 'Please check console for details.'}`, 'error');
    } finally {
      setIsSendingRequests(false);
      console.log('--- Finished Bill Request Send Transaction ---');
    }
  };

  if (loadingUsers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>💸 Split a Bill</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Total Bill Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500.75"
            keyboardType="numeric"
            placeholderTextColor="#A7B7B3"
            value={totalAmount}
            onChangeText={(text) => {
              const newText = text.replace(/[^0-9.]/g, '');
              if (newText.split('.').length > 2) return;
              if (newText.includes('.') && newText.split('.')[1]?.length > 2) return;
              setTotalAmount(newText);
              setSharesCalculated(false);
            }}
          />

          <Text style={styles.sectionTitle}>Bill Description</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dinner at ABC, Rent for May"
            placeholderTextColor="#A7B7B3"
            value={requestDescription}
            onChangeText={setRequestDescription}
          />

          <Text style={styles.sectionTitle}>Add Participants</Text>
          <DropDownPicker
            open={open}
            value={selectedUser}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedUser}
            setItems={setItems}
            placeholder="Select a person to add"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownPlaceholder}
            zIndex={3000}
            listMode="SCROLLVIEW"
          />

          <TouchableOpacity style={styles.addButton} onPress={addParticipant}>
            <MaterialIcons name="person-add-alt-1" size={22} color="#FFFFFF" style={styles.addIcon} />
            <Text style={styles.addText}>Add Person</Text>
          </TouchableOpacity>

          {participants.length > 0 && (
            <Text style={styles.sectionTitle}>Participants & Shares</Text>
          )}
          {participants.map(p => (
            <View key={p.uid} style={styles.participantRow}>
              <Text style={styles.participantName}>{p.name}</Text>
              <View style={styles.shareInputContainer}>
                <Text style={styles.shareCurrency}>₹</Text>
                <TextInput
                  style={styles.shareTextInput}
                  keyboardType="numeric"
                  value={p.share.toFixed(2)}
                  onChangeText={(text) => {
                    const newText = text.replace(/[^0-9.]/g, '');
                    if (newText.split('.').length > 2) return;
                    if (newText.includes('.') && newText.split('.')[1]?.length > 2) return;
                    handleShareChange(p.uid, newText);
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#A7B7B3"
                />
              </View>
              <TouchableOpacity onPress={() => removeParticipant(p.uid)} style={styles.removeButton}>
                <MaterialIcons name="close" size={24} color="#E57373" />
              </TouchableOpacity>
            </View>
          ))}

          {participants.length > 0 && (
            <TouchableOpacity style={styles.calcButton} onPress={calculateEqualSharesLocally}>
              <MaterialIcons name="calculate" size={22} color="#FFFFFF" style={styles.calcIcon} />
              <Text style={styles.calcText}>Calculate Equal Share</Text>
            </TouchableOpacity>
          )}

          {participants.length > 0 && (
            <TouchableOpacity
              style={[styles.sendRequestsButton, isSendingRequests && styles.sendRequestsButtonDisabled]}
              onPress={sendBillRequests}
              disabled={isSendingRequests}
            >
              {isSendingRequests ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={22} color="#FFFFFF" style={styles.sendIcon} />
                  <Text style={styles.sendText}>Send Bill Requests</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
            {modalType === 'warning' && <MaterialIcons name="warning" size={40} color="#FFAB00" style={styles.modalIcon} />}

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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
    // Removed paddingHorizontal here, as headerContainer takes full width
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
  },
  loadingText: {
    color: '#00695C',
    fontSize: 16,
    marginTop: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#009688',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 45,
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
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 28,
  },
  scrollContent: {
    paddingHorizontal: 20, // Content padding
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004D40',
    marginBottom: 10,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#B2DFDB',
    paddingBottom: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    color: '#004D40',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B2DFDB',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    minHeight: 50,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B2DFDB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdownText: {
    color: '#004D40',
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: '#A7B7B3',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#009688',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addIcon: {
    marginRight: 8,
  },
  addText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  participantName: {
    color: '#004D40',
    fontSize: 17,
    fontWeight: '500',
    flex: 1,
  },
  shareInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
  },
  shareCurrency: {
    color: '#00695C',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 2,
  },
  shareTextInput: {
    color: '#004D40',
    fontWeight: 'bold',
    fontSize: 17,
    padding: 0,
    minWidth: 60,
    textAlign: 'right',
  },
  removeButton: {
    marginLeft: 10,
    padding: 5,
  },
  calcButton: {
    flexDirection: 'row',
    backgroundColor: '#009688',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  calcIcon: {
    marginRight: 10,
  },
  calcText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
  },
  sendRequestsButton: {
    flexDirection: 'row',
    backgroundColor: '#009688',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sendRequestsButtonDisabled: {
    backgroundColor: '#B2DFDB',
    shadowColor: '#B2DFDB',
  },
  sendIcon: {
    marginRight: 10,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
  },
  // Custom Modal Styles (refined for beautiful look)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Softer corners
    padding: 30,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, // More pronounced shadow
    shadowOpacity: 0.25,
    shadowRadius: 15, // Softer blur
    elevation: 10,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40', // Dark teal title
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#00695C', // Medium green message
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    backgroundColor: '#009688', // Primary green button
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SplitBill;