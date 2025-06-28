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
  Alert
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import 'react-native-get-random-values'; // Needed for uuid v4
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs

// Define a type for participants to enhance type safety
type Participant = {
  uid: string;
  name: string;
  share: number;
};

// Define a type for dropdown items
type DropdownItem = {
  label: string;
  value: string;
};

const SplitBill = () => {
  const [totalAmount, setTotalAmount] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isSendingRequests, setIsSendingRequests] = useState(false);
  const [sharesCalculated, setSharesCalculated] = useState(false);

  const currentUserUid = auth().currentUser?.uid;
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Fetch all users for dropdown AND current user's name
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
            Alert.alert("User Data Missing", "Could not fetch your username. Please ensure your profile is complete.");
        }

      } catch (error) {
        console.error('Error fetching users or current user data:', error);
        Alert.alert('Error', 'Failed to load user list or your profile. Please try again.');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUserData();
  }, [currentUserUid]);

  const addParticipant = () => {
    if (!selectedUser) {
      Alert.alert('Select User', 'Please select a person to add to the bill.');
      return;
    }
    if (selectedUser === currentUserUid) {
      Alert.alert('Cannot Add Self', 'You are the one splitting the bill. Do not add yourself as a participant.');
      return;
    }

    const already = participants.find(p => p.uid === selectedUser);
    if (already) {
      Alert.alert('Already Added', `${already.name} is already in the list.`);
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

  const calculateEqualSharesLocally = () => {
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive total amount.');
      return;
    }
    if (participants.length === 0) {
      Alert.alert('No Participants', 'Please add at least one person to split the bill.');
      return;
    }

    const shareValue = (total / participants.length);
    setParticipants(participants.map(p => ({ ...p, share: parseFloat(shareValue.toFixed(2)) })));
    setSharesCalculated(true);
    Alert.alert('Shares Calculated', `Each person owes ₹${shareValue.toFixed(2)}.`);
  };

  const sendBillRequests = async () => {
    if (!sharesCalculated) {
      Alert.alert('Calculate First', 'Please calculate the shares before sending requests.');
      return;
    }
    if (participants.length === 0) {
      Alert.alert('No Participants', 'Add participants to send requests.');
      return;
    }
    if (!requestDescription.trim()) {
        Alert.alert('Missing Description', 'Please add a short description for the bill (e.g., "Dinner", "Rent").');
        return;
    }
    if (!currentUserUid || !currentUsername) {
        Alert.alert('Authentication Error', 'Your user data is not fully loaded. Please try again.');
        return;
    }

    setIsSendingRequests(true);
    const batch = firestore().batch();
    const commonBillId = new Date().toISOString().replace(/[^0-9]/g, '');
    // Generate a unique ID for this entire split request session

    console.log("--- Starting Bill Request Send Transaction ---");
    //console.log("Common Bill ID:", commonBillId);
    console.log("Current User UID (Sender):", currentUserUid);
    console.log("Current Username (Sender):", currentUsername);
    console.log("Total Amount:", totalAmount);
    console.log("Description:", requestDescription.trim());
    console.log("Participants:", participants);

    try {
      // 1. Update Sender's (current user's) document - Add to 'transhistory' map
      const senderDocRef = firestore().collection('users').doc(currentUserUid);

      const senderBillRequestData = {
        amount: parseFloat(totalAmount), // Total amount of the bill
        type: 'bill_request_sent', // Type to identify this as a sent request
        description: requestDescription.trim(),
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'pending', // Overall status of this sent request
        recipients: participants.map(p => ({ // Details for each recipient
            uid: p.uid,
            name: p.name,
            share: p.share,
            status: 'pending' // Individual recipient status
        })),
        billId: commonBillId // Store the common bill ID within the record itself for easy lookup
      };

      console.log('Sender transhistory entry:', senderBillRequestData);

      batch.update(senderDocRef, {
        [`request.${commonBillId}`]: senderBillRequestData
      });
      console.log("Sender document update for transhistory queued.");

      // 2. Update Each Recipient's document - Add to their 'transhistory' map
      for (const participant of participants) {
        const recipientDocRef = firestore().collection('users').doc(participant.uid);

        const recipientBillRequestData = {
          amount: participant.share, // Amount requested from this specific recipient
          type: 'bill_request_received', // Type to identify this as a received request
          description: requestDescription.trim(),
          timestamp: firestore.FieldValue.serverTimestamp(),
          status: 'pending', // Status for this specific received request
          senderUid: currentUserUid,
          senderName: currentUsername,
          billId: commonBillId // Store the common bill ID
        };
        console.log(`Recipient transhistory entry for ${participant.name} (${participant.uid}):`, recipientBillRequestData);

        batch.update(recipientDocRef, {
          [`request.${commonBillId}`]: recipientBillRequestData
        });
        console.log(`Recipient document update for ${participant.name} queued.`);
      }

      console.log('Committing batch...');
      await batch.commit();
      console.log('Batch committed successfully!');

      Alert.alert('Success', 'Bill split requests sent successfully!');
      // Reset form after sending
      setTotalAmount('');
      setRequestDescription('');
      setParticipants([]);
      setSharesCalculated(false);
    } catch (error: any) {
      console.error('--- Error sending bill requests: ---');
      console.error('Error Object:', error);
      console.error('Error Code:', error.code); // Look for this in the console!
      console.error('Error Message:', error.message);
      Alert.alert('Error', `Failed to send requests: ${error.message || 'Please check console for details.'}`);
    } finally {
      setIsSendingRequests(false);
      console.log('--- Finished Bill Request Send Transaction ---');
    }
  };

  // ... rest of the component code (styles, return statement etc. remain unchanged) ...

  if (loadingUsers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
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
        <Text style={styles.header}>💸 Split a Bill</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Total Bill Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500.75"
            keyboardType="numeric"
            placeholderTextColor="#888"
            value={totalAmount}
            onChangeText={(text) => {
              setTotalAmount(text);
              setSharesCalculated(false);
            }}
          />

          <Text style={styles.sectionTitle}>Bill Description</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dinner at ABC, Rent for May"
            placeholderTextColor="#888"
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
            <MaterialIcons name="person-add-alt-1" size={20} color="#FFFFFF" style={styles.addIcon} />
            <Text style={styles.addText}>Add Person</Text>
          </TouchableOpacity>

          {participants.length > 0 && (
            <Text style={styles.sectionTitle}>Participants & Shares</Text>
          )}
          {participants.map(p => (
            <View key={p.uid} style={styles.participantRow}>
              <Text style={styles.participantName}>{p.name}</Text>
              <View style={styles.shareInfo}>
                <Text style={styles.shareCurrency}>₹</Text>
                <Text style={styles.shareText}>{p.share.toFixed(2) || '0.00'}</Text>
              </View>
              <TouchableOpacity onPress={() => removeParticipant(p.uid)} style={styles.removeButton}>
                <MaterialIcons name="close" size={20} color="#FF5252" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Conditional buttons */}
          {participants.length > 0 && !sharesCalculated && (
            <TouchableOpacity style={styles.calcButton} onPress={calculateEqualSharesLocally}>
              <MaterialIcons name="calculate" size={20} color="#FFFFFF" style={styles.calcIcon} />
              <Text style={styles.calcText}>Calculate Equal Share</Text>
            </TouchableOpacity>
          )}

          {participants.length > 0 && sharesCalculated && (
            <TouchableOpacity
              style={[styles.sendRequestsButton, isSendingRequests && styles.sendRequestsButtonDisabled]}
              onPress={sendBillRequests}
              disabled={isSendingRequests}
            >
              {isSendingRequests ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
                  <Text style={styles.sendText}>Send Bill Requests</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    color: '#333333',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
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
    borderColor: '#E0E0E0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdownText: {
    color: '#333333',
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: '#888',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#1A73E8',
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
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBF2FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  participantName: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '500',
    flex: 1,
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 10,
  },
  shareCurrency: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 2,
  },
  shareText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 18,
  },
  removeButton: {
    marginLeft: 15,
    padding: 5,
  },
  calcButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: '#4CAF50',
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
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sendRequestsButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  sendIcon: {
    marginRight: 10,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
  },
});

export default SplitBill;