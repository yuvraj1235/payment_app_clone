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
  Modal, // Import Modal for custom sorting options
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';

type Transaction = {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: Date;
  senderName?: string;
  recipientName?: string;
};

const History = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // Store original fetched transactions
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]); // Transactions after sorting
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortOptionsModal, setShowSortOptionsModal] = useState(false);
  const [currentSortOption, setCurrentSortOption] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc'); // Default sort

  const applySorting = useCallback((txns: Transaction[], sortOption: typeof currentSortOption) => {
    const sorted = [...txns].sort((a, b) => {
      switch (sortOption) {
        case 'date_desc':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'date_asc':
          return a.timestamp.getTime() - b.timestamp.getTime();
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
    setDisplayedTransactions(sorted);
  }, []);

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
              senderName: t.senderName,
              recipientName: t.recipientName,
            });
          }
        }
        setAllTransactions(array); // Store all fetched transactions
        applySorting(array, currentSortOption); // Apply initial or current sorting
      } else {
        setAllTransactions([]);
        setDisplayedTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, currentSortOption, applySorting]); // Re-fetch or re-sort if option changes

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    applySorting(allTransactions, currentSortOption);
  }, [allTransactions, currentSortOption, applySorting]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSortOptionSelect = (option: typeof currentSortOption) => {
    setCurrentSortOption(option);
    setShowSortOptionsModal(false);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'credit';
    const iconName = isCredit ? 'arrow-circle-down' : 'arrow-circle-up';
    const iconColor = isCredit ? '#4CAF50' : '#E57373';

    return (
      <View style={styles.transactionCard}>
        <View
          style={[
            styles.transactionIconCircle,
            { backgroundColor: isCredit ? '#E8F5E9' : '#FCE4EC' },
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (displayedTransactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={router.back} style={styles.headerIcon}>
            <MaterialIcons name="arrow-back" size={28} color="#004D40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <TouchableOpacity style={styles.headerIcon} onPress={() => setShowSortOptionsModal(true)}>
            <MaterialIcons name="filter-list" size={28} color="#004D40" />
          </TouchableOpacity>
        </View>

        <View style={styles.noTransactionsContainer}>
          <MaterialIcons name="history" size={60} color="#009688" style={styles.noTransactionsIcon} />
          <Text style={styles.noTransactionsText}>No transactions yet. Start making payments!</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <SortOptionsModal
          visible={showSortOptionsModal}
          onClose={() => setShowSortOptionsModal(false)}
          onSelect={handleSortOptionSelect}
          currentOption={currentSortOption}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={router.back} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back" size={28} color="#004D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setShowSortOptionsModal(true)}>
          <MaterialIcons name="filter-list" size={28} color="#004D40" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009688" />
        }
      />

      <SortOptionsModal
        visible={showSortOptionsModal}
        onClose={() => setShowSortOptionsModal(false)}
        onSelect={handleSortOptionSelect}
        currentOption={currentSortOption}
      />
    </SafeAreaView>
  );
};

type SortOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc') => void;
  currentOption: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
};

const SortOptionsModal = ({ visible, onClose, onSelect, currentOption }: SortOptionsModalProps) => {
  const options = [
    { key: 'date_desc', label: 'Date (Newest first)', icon: 'sort-by-numeric-desc' },
    { key: 'date_asc', label: 'Date (Oldest first)', icon: 'sort-by-numeric-asc' },
    { key: 'amount_desc', label: 'Amount (Highest first)', icon: 'trending-up' },
    { key: 'amount_asc', label: 'Amount (Lowest first)', icon: 'trending-down' },
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={modalStyles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={modalStyles.modalTitle}>Sort By</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={modalStyles.optionButton}
              onPress={() => onSelect(option.key as any)}
            >
              <MaterialIcons
                name={option.icon as any}
                size={24}
                color={currentOption === option.key ? '#009688' : '#00695C'}
                style={modalStyles.optionIcon}
              />
              <Text style={[
                modalStyles.optionText,
                currentOption === option.key && modalStyles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
              {currentOption === option.key && (
                <MaterialIcons name="check" size={20} color="#009688" style={modalStyles.optionCheck} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2F1' },
  loadingText: { color: '#00695C', marginTop: 10, fontSize: 16 },
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
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
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
    borderWidth: 1,
    borderColor: '#B2DFDB',
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
  transactionDescription: { fontSize: 16, fontWeight: '600', color: '#004D40', marginBottom: 2 },
  transactionTime: { fontSize: 13, color: '#78909C' },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  amountCredit: { color: '#4CAF50' },
  amountDebit: { color: '#E57373' },
  noTransactionsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderRadius: 15, margin: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#B2DFDB' },
  noTransactionsIcon: { marginBottom: 20, color: '#009688' },
  noTransactionsText: { fontSize: 18, color: '#00695C', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#009688', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, shadowColor: '#009688', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6, },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F1',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#00695C',
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: '#009688',
  },
  optionCheck: {
    marginLeft: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#E0F2F1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#00695C',
    fontWeight: 'bold',
  },
});

export default History;