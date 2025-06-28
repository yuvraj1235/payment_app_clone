// BalanceScreen.tsx
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
// import { useNavigation } from '@react-navigation/native'; // REMOVED: Using expo-router's router instead
import { router } from 'expo-router'; // Correct import for expo-router's router object

const BalanceScreen = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const currentUserUid = auth().currentUser?.uid;
    const fetchBalance = useCallback(async (): Promise<(() => void) | undefined> => {
    if (!currentUserUid) {
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Authentication Error', 'You must be logged in to view your balance.');
      return undefined; // Return undefined if no user UID
    }

    try {
      const userDocRef = firestore().collection('users').doc(currentUserUid);

      // Set up a real-time listener for the user's document
      // onSnapshot synchronously returns the unsubscribe function, which is fine
      const unsubscribe = userDocRef.onSnapshot(docSnapshot => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setBalance(userData?.balance ?? 0); // Default to 0 if balance is not found
          setUsername(userData?.username?.toUpperCase() || 'User'); // Default to 'User'
        } else {
          setBalance(null);
          setUsername(null);
          Alert.alert('User Not Found', 'Your user profile could not be loaded.');
        }
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error("Error fetching real-time balance:", error);
        Alert.alert("Error", "Failed to load balance in real-time. Please try again.");
        setLoading(false);
        setRefreshing(false);
      });

      // Return the unsubscribe function, as promised by the type definition
      return unsubscribe;

    } catch (error) {
      console.error('Error fetching balance:', error);
      Alert.alert('Error', 'Failed to load your balance. Please try again.');
      setLoading(false);
      setRefreshing(false);
      return undefined; // Explicitly return undefined on error
    }
  }, [currentUserUid]);

  // useEffect to call fetchBalance on component mount and clean up the listener
  useEffect(() => {
    let unsubscribeFn: (() => void) | undefined; // Variable to hold the actual unsubscribe function

    const setupListener = async () => {
      // Await the promise returned by fetchBalance to get the actual function or undefined
      unsubscribeFn = await fetchBalance();
    };

    setupListener(); // Call the async setup function

    // The cleanup function for useEffect
    return () => {
      if (typeof unsubscribeFn === 'function') {
        unsubscribeFn(); // Now, unsubscribeFn is guaranteed to be a function if it was set
      }
    };
  }, [fetchBalance]); // Depend on fetchBalance so it re-runs if fetchBalance itself changes

  // Function for pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBalance(); // Re-fetch the balance
  }, [fetchBalance]);

  // Format amount with commas and two decimal places
  const formatAmount = (amount: number | null): string => {
    if (amount === null) {
      return 'N/A';
    }
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading your balance...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A73E8" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Use router.back() for going back */}
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Balance</Text>
          <View style={{ width: 24 }} /> {/* Spacer for symmetry */}
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.cardGreeting}>Hello, {username || 'User'}!</Text>
          <Text style={styles.cardTitle}>Current Balance</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
          </View>
          <Text style={styles.cardTip}>Pull down to refresh balance</Text>
        </View>

        {/* Quick Actions (Optional - can be expanded) */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            // Use router.push() for navigation, specify the path to your 'contact' screen
            onPress={() => {router.push('contact') 
            }} // Assuming /contact is the path to your Contact screen
          >
            <MaterialIcons name="send" size={28} color="#1A73E8" />
            <Text style={styles.actionButtonText}>Send Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="call-received" size={28} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Request Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            // Use router.push() for navigation, specify the path to your 'history' screen
            onPress={() => router.push('history')} // Assuming /history is the path to your History screen
          >
            <MaterialIcons name="history" size={28} color="#FF9800" />
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info / Tips */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={24} color="#666" style={{ marginRight: 10 }} />
          <Text style={styles.infoText}>
            Your balance is updated in real-time. For any discrepancies, please contact support.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Light grey background
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 30,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  balanceCard: {
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
    borderColor: '#EBF2FB',
  },
  cardGreeting: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  currencySymbol: {
    fontSize: 32,
    color: '#1A73E8', // Primary blue accent
    fontWeight: 'bold',
    marginRight: 5,
    paddingBottom: 4, // Align with amount text baseline
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1A73E8', // Primary blue accent
  },
  cardTip: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '30%', // Adjust width as needed
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
    color: '#555555',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF2FB', // Light blue background for info box
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default BalanceScreen;