import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type SuccessParams = {
  amount: number;
  recipientUsername?: string;
  selectedBank?: {
    name: string;
    lastDigits: string;
  };
  billDescription?: string;
};

type SuccessRouteProp = RouteProp<{ PaymentSuccess: SuccessParams }, 'PaymentSuccess'>;

const PaymentSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute<SuccessRouteProp>();
  const { amount, recipientUsername, selectedBank, billDescription } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.successIconWrapper}>
        <MaterialIcons name="check-circle" size={100} color="#4CAF50" />
      </View>
      <Text style={styles.title}>Payment Successful</Text>
      <Text style={styles.amount}>₹{amount.toFixed(2)}</Text>
      <View style={styles.detailsBox}>
        <Text style={styles.label}>Paid To</Text>
        <Text style={styles.value}>{recipientUsername || 'Recipient'}</Text>

        <Text style={styles.label}>Bank</Text>
        <Text style={styles.value}>
          {selectedBank?.name || 'Bank'} (••{selectedBank?.lastDigits || 'XXXX'})
        </Text>

        {billDescription && (
          <>
            <Text style={styles.label}>Bill Description</Text>
            <Text style={styles.value}>{billDescription}</Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={() => navigation.navigate('home')}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIconWrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  detailsBox: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 30,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentSuccess;
