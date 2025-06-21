import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';

const SplitBill = () => {
  const [totalAmount, setTotalAmount] = useState('');
  const [participants, setParticipants] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await firestore().collection('users').get();
      const fetched = snapshot.docs.map(doc => ({
        label: doc.data().username || 'Unnamed',
        value: doc.id
      }));
      setItems(fetched);
    };
    fetchUsers();
  }, []);

  const addParticipant = () => {
    if (!selectedUser) return;
    const already = participants.find(p => p.uid === selectedUser);
    if (!already) {
      const user = items.find(u => u.value === selectedUser);
      setParticipants([...participants, { uid: user.value, name: user.label, share: '' }]);
    }
  };

  const calculateShare = () => {
    const total = parseFloat(totalAmount);
    if (!total || participants.length === 0) return;
    const share = (total / participants.length).toFixed(2);
    setParticipants(participants.map(p => ({ ...p, share })));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.header}>💸 Split a Bill</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter total amount"
        keyboardType="numeric"
        placeholderTextColor="#aaa"
        value={totalAmount}
        onChangeText={setTotalAmount}
      />

      <DropDownPicker
        open={open}
        value={selectedUser}
        items={items}
        setOpen={setOpen}
        setValue={setSelectedUser}
        setItems={setItems}
        placeholder="Select a person"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        textStyle={{ color: '#fff' }}
        zIndex={5000}
      />

      <TouchableOpacity style={styles.addButton} onPress={addParticipant}>
        <Text style={styles.addText}>Add Person</Text>
      </TouchableOpacity>

      {participants.map(p => (
        <View key={p.uid} style={styles.participantRow}>
          <Text style={styles.participantName}>{p.name}</Text>
          <Text style={styles.shareText}>₹ {p.share || '0.00'}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.calcButton} onPress={calculateShare}>
        <Text style={styles.calcText}>Calculate Equal Share</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0B0B',
    flex: 1,
    padding: 20
  },
  header: {
    fontSize: 24,
    color: '#00FFD5',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 10,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00FFC6'
  },
  dropdown: {
    backgroundColor: '#222',
    borderColor: '#00FFC6',
    marginBottom: 12
  },
  dropdownContainer: {
    backgroundColor: '#333',
    borderColor: '#00FFC6'
  },
  addButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20
  },
  addText: {
    color: '#fff'
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    borderColor: '#00FFC6',
    borderWidth: 1
  },
  participantName: {
    color: '#fff',
    fontSize: 16
  },
  shareText: {
    color: '#00FFAA',
    fontWeight: 'bold'
  },
  calcButton: {
    backgroundColor: '#00FFB2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30
  },
  calcText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default SplitBill;
