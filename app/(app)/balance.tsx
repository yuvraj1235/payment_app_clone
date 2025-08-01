import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';

const BalanceScreen = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const currentUserUid = auth().currentUser?.uid;

  const fetchBalanceAndTransactions = useCallback(async (): Promise<(() => void) | undefined> => {
    if (!currentUserUid) {
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Authentication Error', 'You must be logged in to view your balance and transactions.');
      return undefined;
    }

    try {
      const userDocRef = firestore().collection('users').doc(currentUserUid);

      const unsubscribe = userDocRef.onSnapshot(docSnapshot => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setBalance(userData?.balance ?? 0);
          setUsername(userData?.username?.toUpperCase() || 'User');

          const transHistory = userData?.transhistory || {};
          const transactionsArray = Object.keys(transHistory).map(key => ({
            id: key,
            ...transHistory[key]
          }));

          transactionsArray.sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
            return dateB - dateA;
          });

          setRecentTransactions(transactionsArray.slice(0, 3));
        } else {
          setBalance(null);
          setUsername(null);
          setRecentTransactions([]);
          Alert.alert('User Not Found', 'Your user profile could not be loaded.');
        }
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error("Error fetching real-time data:", error);
        Alert.alert("Error", "Failed to load data in real-time. Please try again.");
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load your data. Please try again.');
      setLoading(false);
      setRefreshing(false);
      return undefined;
    }
  }, [currentUserUid]);

  useEffect(() => {
    let unsubscribeFn: (() => void) | undefined;

    const setupListener = async () => {
      unsubscribeFn = await fetchBalanceAndTransactions();
    };

    setupListener();

    return () => {
      if (typeof unsubscribeFn === 'function') {
        unsubscribeFn();
      }
    };
  }, [fetchBalanceAndTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBalanceAndTransactions();
  }, [fetchBalanceAndTransactions]);

  const formatAmount = (amount: number | null): string => {
    if (amount === null) {
      return 'N/A';
    }
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatTransactionDate = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) {
      return 'N/A';
    }
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.loadingText}>Loading your balance and transactions...</Text>
      </View>
    );
  }

  return (
    //<SafeAreaView style={styles.fullScreenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009688" />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#004D40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Balance</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.cardGreeting}>Hello, {username || 'User'}!</Text>
          <Text style={styles.cardTitle}>Current Balance</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
          </View>
          <Text style={styles.cardTip}>Pull down to refresh balance</Text>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButtonSingle}
            onPress={() => router.push('/history')}
          >
            <MaterialIcons name="history" size={28} color="#FFAB00" />
            <Text style={styles.actionButtonText}>Full History</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.recentTransactionsContainer}>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <MaterialIcons
                    name={transaction.type === 'credit' ? 'arrow-downward' : 'arrow-upward'}
                    size={24}
                    color={transaction.type === 'credit' ? '#4CAF50' : '#E57373'}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.type === 'credit'
                      ? `Received from ${transaction.senderName || 'Unknown'}`
                      : `Paid to ${transaction.recipientName || 'Unknown'}`}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(transaction.timestamp)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'credit' ? '#4CAF50' : '#E57373' },
                  ]}
                >
                  {transaction.type === 'credit' ? '+' : '-'}₹{formatAmount(Math.abs(transaction.amount))}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.noTransactionsBox}>
              <MaterialIcons name="info-outline" size={24} color="#009688" />
              <Text style={styles.noTransactionsText}>No recent transactions found.</Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={24} color="#009688" style={{ marginRight: 10 }} />
          <Text style={styles.infoText}>
            Your balance is updated in real-time. For any discrepancies, please contact support.
          </Text>
        </View>

      </ScrollView>
    //</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  scrollContent: {
    paddingBottom: 30,
    
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
  // Header styles (consistent with other themed screens)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#009688', // Darker Teal from Home banner
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 45, // To account for SafeAreaView and status bar
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20, // Add margin below header
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22, // Consistent font size
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceCard: {
    margin:30,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  cardGreeting: {
    
    fontSize: 18,
    color: '#00695C',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#004D40',
    marginBottom: 10,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  currencySymbol: {
    fontSize: 32,
    color: '#009688',
    fontWeight: 'bold',
    marginRight: 5,
    paddingBottom: 4,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#009688',
  },
  cardTip: {
    fontSize: 14,
    color: '#78909C',
    fontStyle: 'italic',
  },
  sectionTitle: {
    margin:20,
    fontSize: 20,
    fontWeight: '700',
    color: '#004D40',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#B2DFDB',
    paddingBottom: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonSingle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#00695C',
    textAlign: 'center',
  },
  recentTransactionsContainer: {
    margin:20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F1',
  },
  transactionIcon: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#004D40',
  },
  transactionDate: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTransactionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F0F4C3',
    borderRadius: 10,
    marginTop: 10,
  },
  noTransactionsText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#827717',
  },
  infoBox: {
    margin:20,
    flexDirection: 'row',
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#009688',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#006064',
    lineHeight: 20,
  },
});

export default BalanceScreen;