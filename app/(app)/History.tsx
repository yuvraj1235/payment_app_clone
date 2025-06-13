import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const History = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const fetchTransactions = async () => {
        try {
          const doc = await firestore().collection('users').doc(user.uid).get();
          const data = doc.data();
          const history = data?.transhistory || [];
          if(history)console.log(history);
          
          const sorted = history.sort((a, b) => {
            return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
          });
          setTransactions(sorted);
        } catch (err) {
          console.error('Error fetching transaction history:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    }
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text style={styles.type}>{item.type?.toUpperCase()}</Text>
      <Text style={styles.amount}>₹{item}</Text>
      <Text style={styles.meta}>{item.type === 'debit' ? `To: ${ite}` : `From: ${item.from}`}</Text>
      <Text style={styles.time}>
        {item.timestamp?.seconds
          ? new Date(item.timestamp.seconds * 1000).toLocaleString()
          : 'Unknown time'}
      </Text>
    </View>
  );

  if (loading) {
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
    <FlatList
      data={transactions}
      keyExtractor={(_, index) => index.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:{
     flex: 1, backgroundColor: '#121212', padding: 10, paddingTop: 50
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTx: {
    color: '#999',
    fontSize: 16,
  },
  list: {
    padding: 15,
    backgroundColor: '#1E1E1E',
  },
  item: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  type: {
    color: '#75B6E4',
    fontWeight: 'bold',
    fontSize: 14,
  },
  amount: {
    color: 'white',
    fontSize: 22,
    marginTop: 5,
  },
  meta: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 3,
  },
  time: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
});

export default History;
