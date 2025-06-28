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
import { router } from 'expo-router';         // ⬅️ use router, not useNavigation

type Transaction = {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: Date;
};

const History = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ─────────── Fetch transactions ─────────── */
  const fetchTransactions = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const map: Record<string, any> = userDoc.data()?.transhistory || {};
        const array: Transaction[] = [];

        for (const id in map) {
          const t = map[id];
          if (typeof t.amount === 'number' && typeof t.type === 'string') {
            const desc =
              t.type === 'credit'
                ? `Received from ${t.senderName || 'Unknown Sender'}`
                : `Sent to ${t.recipientName || 'Unknown Recipient'}`;

            array.push({
              id,
              amount: Math.abs(t.amount),
              type: t.type,
              description: desc,
              timestamp: t.timestamp?.toDate?.() ?? new Date(),
            });
          }
        }
        setTransactions(array.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  /* ───────────── Render item ───────────── */
  const renderItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'credit';
    const iconName = isCredit ? 'arrow-circle-down' : 'arrow-circle-up';
    const iconColor = isCredit ? '#4CAF50' : '#F44336';

    return (
      <View style={styles.transactionCard}>
        <View
          style={[
            styles.transactionIconCircle,
            { backgroundColor: isCredit ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <MaterialIcons name={iconName} size={28} color={iconColor} />
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionTime}>{item.timestamp.toLocaleString()}</Text>
        </View>

        <Text
          style={[
            styles.transactionAmount,
            isCredit ? styles.amountCredit : styles.amountDebit,
          ]}
        >
          {isCredit ? '+' : '-'} ₹{item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  /* ───────────── Loading UI ───────────── */
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  /* ───────────── Empty state ───────────── */
  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={router.back} style={styles.headerIcon}>
            <MaterialIcons name="arrow-back" size={28} color="#4A4A4A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="filter-list" size={28} color="#4A4A4A" />
          </TouchableOpacity>
        </View>

        <View style={styles.noTransactionsContainer}>
          <MaterialIcons name="history" size={60} color="#B0B0B0" style={styles.noTransactionsIcon} />
          <Text style={styles.noTransactionsText}>No transactions yet. Start making payments!</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ───────────── List UI ───────────── */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={router.back} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back" size={28} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <MaterialIcons name="filter-list" size={28} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A73E8" />
        }
      />
    </SafeAreaView>
  );
};

/* ───────────── Styles (unchanged) ───────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666', marginTop: 10, fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  listContent: { paddingHorizontal: 15, paddingVertical: 15 },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
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
  transactionDetails: { flex: 1 },
  transactionDescription: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  transactionTime: { fontSize: 13, color: '#888' },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  amountCredit: { color: '#4CAF50' },
  amountDebit: { color: '#F44336' },
  noTransactionsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noTransactionsIcon: { marginBottom: 20, color: '#B0B0B0' },
  noTransactionsText: { fontSize: 18, color: '#888', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#1A73E8', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default History;
