import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const History = () => {
  const [transactions, setTransactions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    if (!refreshing) setLoading(true);
    try {
      const user = auth().currentUser;
      if (user) {
        const doc = await firestore().collection('users').doc(user.uid).get();
        const data = doc.data();
        const history = data?.transhistory || [];
        const sorted = history.sort((a, b) => b - a); // Placeholder sort
        setTransactions(sorted);
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, []);

  const renderItem = ({ item }: { item: number }) => {
    const isCredit = item > 0;
    const emoji = isCredit ? '🟢' : '🔴';
    const amountColor = isCredit ? styles.amountCredit : styles.amountDebit;

    return (
      <View style={styles.item}>
        <Text style={styles.type}>{isCredit ? 'CREDIT' : 'DEBIT'}</Text>
        <Text style={[styles.amount, amountColor]}>
          {emoji} ₹{Math.abs(item)}
        </Text>
        <Text style={styles.meta}>{isCredit ? 'From: Someone' : 'To: Someone'}</Text>
        <Text style={styles.time}>{new Date().toLocaleString()}</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#75B6E4" />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={styles.noTx}>No transactions yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>📄 Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    alignSelf: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  noTx: {
    color: '#888',
    fontSize: 16,
  },
  list: {
    paddingBottom: 16,
  },
  item: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderColor: '#00ffe0',
    borderWidth: 1.5,
    shadowColor: '#00ffe0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  type: {
    color: '#00ffe0',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  amountCredit: {
    color: '#00FF99',
  },
  amountDebit: {
    color: '#FF4D4D',
  },
  meta: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  time: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
});

export default History;
