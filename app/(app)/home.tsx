import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

const screenWidth = Dimensions.get('window').width;
const statusBarHeight = StatusBar.currentHeight || 0;

const Home = () => {
  const [userUID, setUserUID] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const gridContainerHorizontalPadding = 20;
  const itemMarginHorizontal = 8;
  const calculatedItemWidth =
    (screenWidth - 2 * gridContainerHorizontalPadding - 4 * itemMarginHorizontal) / 4;

  /* ─────────────────────────── Firebase + FCM ─────────────────────────── */
  useEffect(() => {
    const setupFCM = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) return;

        const token = await messaging().getToken();
        const currentUser = auth().currentUser;
        if (currentUser) {
          await firestore().collection('users').doc(currentUser.uid).update({ fcmToken: token });
        }
      } catch (err) {
        console.error('FCM setup failed:', err);
      }
    };
    setupFCM();
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const fetchUserBalance = async () => {
    if (!userUID) return;
    setLoadingBalance(true);
    setError(null);
    try {
      const doc = await firestore().collection('users').doc(userUID).get();
      setBalance(doc.exists ? doc.data()?.balance?.toString() ?? '0' : '0');
    } catch (e) {
      console.error(e);
      setError('Failed to fetch balance');
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (!loadingAuth && userUID) fetchUserBalance();
  }, [userUID, loadingAuth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserBalance();
    setRefreshing(false);
  };

  /* ────────────────────────────── UI Data ────────────────────────────── */
  const gridItems = [
    { name: 'Scan any QR', icon: 'qr-code-scanner', route: '/camera' },
    { name: 'Pay Anyone', icon: 'payments', route: '/contact' },
    { name: 'Balance', icon: 'account-balance', route: 'balance' },
    { name: 'History', icon: 'account-balance-wallet', route: '/history' },
    { name: 'Split bill', icon: 'call-split', route: '/splitBill' },
    { name: 'Request page', icon: 'request-page', route: '/payrequest' },
    { name: 'Wallet', icon: 'wallet', route: '/wallet' },
    { name: 'Passbook &\nInsights', icon: 'book', route: '/passbookandinsights' },
  ];
  const firstRowItems = gridItems.slice(0, 4);
  const secondRowItems = gridItems.slice(4, 8);

  /* ───────────────────────────── Loading UI ───────────────────────────── */
  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingTextIndicator}>Loading user session...</Text>
      </View>
    );
  }

  /* ───────────────────────────── Main Render ──────────────────────────── */
  return (
    <View style={styles.container}>
      {/* ───── Top Banner ───── */}
      <View style={styles.topBannerContainer}>
        {/* Icons top‑left / top‑right */}
        <View style={styles.topIconsRow}>
          <TouchableOpacity onPress={() => router.push('/mypage')} style={styles.topIcon}>
            <MaterialIcons name="person" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Notifications')} style={styles.topIcon}>
            <MaterialIcons name="notifications" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Banner image */}
        <Image
          source={require('../../assets/images/background.jpg')}
          style={styles.payzappBannerLogo}
          resizeMode="cover"
        />
      </View>

      {/* ───── Scrollable Content ───── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A0A0A0" />}
        contentContainerStyle={{
          paddingBottom: styles.bottomNavBar.height + styles.floatingScannerButton.height / 2 + 20,
        }}
      >
        <View style={styles.mainGridWrapper}>
          {/* First Row */}
          <View style={styles.mainGridRow}>
            {firstRowItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.mainGridItem, { width: calculatedItemWidth, marginHorizontal: itemMarginHorizontal / 2 }]}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.mainGridIconCircle}>
                  <MaterialIcons name={item.icon} size={40} color="#1A73E8" />
                </View>
                <Text style={styles.mainGridItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* UPI ID */}
          <View style={styles.upiIdContainer}>
            <MaterialIcons name="grid-on" size={24} color="#4A4A4A" style={styles.upiIdIcon} />
            <Text style={styles.upiIdText}>UPI ID: 8281908756@pz</Text>
          </View>

          {/* Second Row */}
          <View style={styles.mainGridRow}>
            {secondRowItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.mainGridItem, { width: calculatedItemWidth, marginHorizontal: itemMarginHorizontal / 2 }]}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.mainGridIconCircle}>
                  <MaterialIcons name={item.icon} size={40} color="#1A73E8" />
                </View>
                <Text style={styles.mainGridItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Offers */}
        <View style={styles.exploreOffersSection}>
          <Text style={styles.exploreOffersTitle}>Explore offers & merchants</Text>
          <TouchableOpacity onPress={() => console.log('View All Offers')}>
            <Text style={styles.exploreOffersViewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ───── Bottom Nav Bar ───── */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity style={styles.navBarItem}>
          <MaterialIcons name="currency-rupee" size={32} color="#1A73E8" />
          <Text style={[styles.navBarText, { color: '#1A73E8' }]}>Pay</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBarItem}>
          <MaterialIcons name="credit-card" size={32} color="#888" />
          <Text style={styles.navBarText}>Cards</Text>
        </TouchableOpacity>

        <View style={styles.navBarCenterPlaceholder} />

        <TouchableOpacity style={styles.navBarItem}>
          <MaterialIcons name="store" size={32} color="#888" />
          <Text style={styles.navBarText}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBarItem} onPress={() => router.push('/balance')}>
          <MaterialIcons name="account-balance" size={32} color="#888" />
          <Text style={styles.navBarText}>Bank</Text>
        </TouchableOpacity>
      </View>

      {/* ───── Floating Scan Button ───── */}
      <TouchableOpacity style={styles.floatingScannerButton} onPress={() => router.push('/camera')}>
        <MaterialIcons name="qr-code-scanner" size={45} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

/* ─────────────────────────── Styles (unchanged) ─────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTextIndicator: { color: '#666', fontSize: 18, marginTop: 12 },
  topBannerContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#E0F0FF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  topIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    top: statusBarHeight + 5,
    paddingHorizontal: 28,
    zIndex: 1,
  },
  topIcon: { padding: 8 },
  payzappBannerLogo: { width: 400, height: 300, marginTop: 30 },
  mainGridWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  mainGridRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  mainGridItem: { aspectRatio: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 8 },
  mainGridIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EBF2FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainGridItemText: { fontSize: 13, color: '#4A4A4A', textAlign: 'center', fontWeight: '600', lineHeight: 16 },
  upiIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FB',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'center',
    width: screenWidth - 40,
  },
  upiIdIcon: { marginRight: 10, color: '#4A4A4A' },
  upiIdText: { fontSize: 16, color: '#4A4A4A', fontWeight: '500' },
  exploreOffersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    marginBottom: 25,
    marginTop: 15,
  },
  exploreOffersTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  exploreOffersViewAll: { fontSize: 15, color: '#1A73E8', fontWeight: '600' },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: 90,
    borderTopWidth: 1.5,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navBarItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  navBarText: { fontSize: 12, color: '#888', marginTop: 6, fontWeight: '500' },
  navBarCenterPlaceholder: { width: 90 },
  floatingScannerButton: {
    position: 'absolute',
    bottom: 55,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 11,
  },
});

export default Home;
