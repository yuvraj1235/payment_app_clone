import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from 'expo-router';

// Define the updated type for your transaction item to match the map structure
type Transaction = {
  id: string; // This will be the transactionId (timestamp string from the map key)
  amount: number;
  type: 'credit' | 'debit'; // Lowercase to match what's stored in Firestore
  description: string; // e.g., "Sent to John Doe", "Received from Jane Smith"
  timestamp: Date; // Actual JavaScript Date object
};

const History = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch transactions from Firestore
  const fetchTransactions = useCallback(async () => {
    // Only show full loading overlay if not refreshing (initial load)
    if (!refreshing) setLoading(true);
    try {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        // Check if transhistory exists and is an object (map)
        const transhistoryMap: { [key: string]: any } = userData?.transhistory || {};

        const transformedHistory: Transaction[] = [];

        // Iterate over the entries of the map
        for (const transactionId in transhistoryMap) {
          if (Object.prototype.hasOwnProperty.call(transhistoryMap, transactionId)) {
            const transactionData = transhistoryMap[transactionId];

            // Ensure amount and type exist for a valid transaction
            if (typeof transactionData.amount === 'number' && typeof transactionData.type === 'string') {
              let description = '';
              if (transactionData.type === 'credit') {
                description = `Received from ${transactionData.senderName || 'Unknown Sender'}`;
              } else if (transactionData.type === 'debit') {
                description = `Sent to ${transactionData.recipientName || 'Unknown Recipient'}`;
              } else {
                description = 'Unknown Transaction'; // Fallback
              }

              // Firestore's FieldValue.serverTimestamp() resolves to a Timestamp object
              // Convert it to a JavaScript Date object
              const transactionTimestamp = transactionData.timestamp && transactionData.timestamp.toDate
                ? transactionData.timestamp.toDate()
                : new Date(); // Fallback to current date if timestamp is missing or invalid

              transformedHistory.push({
                id: transactionId, // Use the map key as the unique ID
                amount: Math.abs(transactionData.amount), // Always display as positive number
                type: transactionData.type as 'credit' | 'debit',
                description: description,
                timestamp: transactionTimestamp,
              });
            }
          }
        }

        // Sort by timestamp (most recent first)
        const sortedTransactions = transformedHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setTransactions(sortedTransactions);

      } else {
        console.warn('No user logged in to fetch transaction history.');
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      // You might want to set an error message state here to display to the user
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]); // Depend on refreshing state

  useEffect(() => {
    fetchTransactions();
    // You might want to add a real-time listener here if you want updates without refresh
    // const subscriber = firestore().collection('users').doc(auth().currentUser?.uid).onSnapshot(doc => { /* ... */ });
    // return () => subscriber();
  }, [fetchTransactions]);

  // Callback for pull-to-refresh
  const onRefreshTrigger = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  // Render method for individual transaction items
  const renderItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'credit'; // Check for lowercase 'credit'
    const amountColor = isCredit ? styles.amountCredit : styles.amountDebit;
    const iconName = isCredit ? 'arrow-circle-down' : 'arrow-circle-up'; // Down for credit, Up for debit
    const iconColor = isCredit ? '#4CAF50' : '#F44336'; // Green for credit, Red for debit

    return (
      <View style={styles.transactionCard}>
        <View style={[styles.transactionIconCircle, { backgroundColor: isCredit ? '#E8F5E9' : '#FFEBEE' }]}>
          <MaterialIcons name={iconName} size={28} color={iconColor} />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionTime}>{item.timestamp.toLocaleString()}</Text> {/* Format as locale string */}
        </View>
        <Text style={[styles.transactionAmount, amountColor]}>
          {isCredit ? '+' : '-'} ₹{item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  // Loading state UI
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  // No transactions found state UI
  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <MaterialIcons name="arrow-back" size={28} color="#4A4A4A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="filter-list" size={28} color="#4A4A4A" /> {/* Filter icon */}
          </TouchableOpacity>
        </View>
        <View style={styles.noTransactionsContainer}>
          <MaterialIcons name="history" size={60} color="#B0B0B0" style={styles.noTransactionsIcon} />
          <Text style={styles.noTransactionsText}>No transactions yet. Start making payments!</Text>
          <TouchableOpacity onPress={onRefreshTrigger} style={styles.retryButton}>
             <Text style={styles.retryButtonText}>Refresh</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main UI with FlatList
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back" size={28} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <MaterialIcons name="filter-list" size={28} color="#4A4A4A" /> {/* Filter icon */}
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id} // Use the generated unique ID
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefreshTrigger} tintColor="#1A73E8" />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Light background color for the screen
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#F0F2F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 15, // Padding for the list content
    paddingVertical: 15, // Top/bottom padding for the list
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for cards
    borderRadius: 15,
    paddingVertical: 18, // Increased padding
    paddingHorizontal: 20,
    marginBottom: 12, // Space between cards
    shadowColor: '#000', // Subtle shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1, // Allows details to take available space
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 13,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  amountCredit: {
    color: '#4CAF50', // Green for credit
  },
  amountDebit: {
    color: '#F44336', // Red for debit
  },
  noTransactionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F2F5', // Match screen background
  },
  noTransactionsIcon: {
    marginBottom: 20,
    color: '#B0B0B0', // Light grey icon
  },
  noTransactionsText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default History;