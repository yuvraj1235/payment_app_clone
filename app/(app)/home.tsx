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
  FlatList, // Import FlatList
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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

  /* ─────────────────────────── Firebase + FCM ─────────────────────────── */

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
      setBalance(doc.exists() ? doc.data()?.balance?.toString() ?? '0' : '0');
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

  /* ────────────────────────────── UI Data ─────────────────────────── */
  const gridItems = [
    { name: 'Scan any QR', icon: 'qr-code-scanner', route: '/camera' },
    { name: 'Pay Anyone', icon: 'payments', route: '/contact' },
    { name: 'Balance', icon: 'account-balance', route: 'balance' }, // Changed to bank-related icon
    { name: 'History', icon: 'history', route: '/history' }, // Changed to credit card icon
    { name: 'Split bill', icon: 'call-split', route: '/splitBill' }, // Changed to receipt icon
    { name: 'Received Request', icon: 'send', route: '/payrequest' }, // Changed to local-offer icon
    { name: 'Zapp Account', icon: 'account-circle', route: '/wallet' }, // Changed to account-circle icon
    { name: 'Passbook &\nInsights', icon: 'import-contacts', route: '/passbookandinsights' }, // Changed to import-contacts icon
  ];

  // Adjusting item distribution based on the new image's layout
  const firstRowItems = gridItems.slice(0, 4); // First 4 items in the top row
  const secondRowItems = gridItems.slice(4, 8); // Next 4 items below UPI ID

  // Carousel Data (using placeholder image, replace with your actual images)
  const carouselItems = [
    { id: '1', title: 'Limited Time Offer', subtitle: 'Up to 5% CashBack at ₹500 No Fee', buttonText: 'Apply Now', image: require('../../assets/images/google.png') },
    { id: '2', title: 'Exclusive Deals', subtitle: 'Save big on your next purchase!', buttonText: 'Discover', image: require('../../assets/images/google.png') },
    { id: '3', title: 'Special Discounts', subtitle: 'Get 20% off on electronics', buttonText: 'Shop Now', image: require('../../assets/images/google.png') },
  ];

  /* ───────────────────────────── Loading UI ───────────────────────────── */
  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#016666" /> {/* Updated color */}
        <Text style={styles.loadingTextIndicator}>Loading user session...</Text>
      </View>
    );
  }

  /* ───────────────────────────── Main Render ──────────────────────────── */
  return (
    <View style={styles.container}>
      {/* ───── Top Banner ───── */}
      <View style={styles.topBannerContainer}>
        {/* Icons top-left / top-right */}
        <View style={styles.topIconsRow}>
          <TouchableOpacity onPress={() => router.push('/mypage')} style={styles.topIcon}>
            <MaterialIcons name="person" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Banner Content */}
        <Image
          source={require('../../assets/images/background.jpg')} // Assuming you have a banner background image
          style={styles.payzappBannerLogo}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlayContent}>
          <Text style={styles.earnText}>EARN UP TO</Text>
          <Text style={styles.cashpointsText}>1,241 Cashpoints</Text>
          <Text style={styles.payShopText}>As you pay and shop</Text>
          <TouchableOpacity style={styles.exploreButton}>
            <Text style={styles.exploreButtonText}>Explore now</Text>
          </TouchableOpacity>
        </View>
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
          {/* First Row - New design uses different items/icons */}
          <View style={styles.mainGridRow}>
            {firstRowItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.mainGridItem, { width: calculatedItemWidth, marginHorizontal: itemMarginHorizontal / 2 }]}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.mainGridIconCircle}>
                  <MaterialIcons name={item.icon} size={40} color="#009688" /> {/* Darker Teal */}
                </View>
                <Text style={styles.mainGridItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* UPI ID */}
          <View style={styles.upiIdContainer} >
            <Text style={styles.upiIdTextLabel}>UPI ID: 9064712234@pz</Text>
            <TouchableOpacity onPress={() => router.push("myqr")} style={styles.myQrButton}>
              <MaterialIcons name="qr-code-2" size={24} color="#009688" /> {/* Darker Teal */}
              <Text style={styles.myQrButtonText} >My QR</Text>
            </TouchableOpacity>
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
                  <MaterialIcons name={item.icon} size={40} color="#FF5722" /> {/* Orange/Red for bottom icons */}
                </View>
                <Text style={styles.mainGridItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Offers Carousel Section */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={carouselItems}
            renderItem={({ item }) => (
              <View style={styles.pixelOfferContainerModified}>
                <Text style={styles.limitedTimeText}>{item.title}</Text>
                <Text style={styles.pixelOfferTitle}>{item.title}</Text>
                <Text style={styles.pixelOfferSubtitle}>{item.subtitle}</Text>
                <TouchableOpacity style={styles.applyNowButton}>
                  <Text style={styles.applyNowText}>{item.buttonText}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#333" />
                </TouchableOpacity>
                <Image
                  source={item.image}
                  style={styles.pixelCardImage}
                />
              </View>
            )}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContentContainer}
          />
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ───── Bottom Nav Bar ───── */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity style={styles.navBarItem}>
          <MaterialIcons name="home" size={32} color="#009688" /> {/* Darker Teal for active */}
          <Text style={[styles.navBarText, { color: '#009688' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBarItem} onPress={() => router.push("/addMoney")}>
          <MaterialIcons name="credit-card" size={32} color="#757575" /> {/* Grey for inactive */}
          <Text style={styles.navBarText}>Add money</Text> {/* Text changed to Cards */}
        </TouchableOpacity>

        <View style={styles.navBarCenterPlaceholder} />

        <TouchableOpacity style={styles.navBarItem}>
          <MaterialIcons name="store" size={32} color="#757575" /> {/* Grey for inactive */}
          <Text style={styles.navBarText}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBarItem} onPress={() => router.push('/balance')}>
          <MaterialIcons name="account-balance" size={32} color="#757575" /> {/* Grey for inactive, icon changed */}
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

/* ─────────────────────────── Styles ─────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5F0' }, // Light cream background
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTextIndicator: { color: '#666', fontSize: 18, marginTop: 12 },
  topBannerContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#009688', // Darker Teal for top banner background
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  topIconsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Changed to flex-start for single icon
    width: '100%',
    position: 'absolute',
    top: statusBarHeight + 5,
    paddingHorizontal: 28,
    zIndex: 2, // Ensure icons are above banner content
  },
  topIcon: { paddingTop: 20 },
  payzappBannerLogo: { // This is now a background image for the banner
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2, // Make it subtle as a background pattern
  },
  bannerOverlayContent: {
    zIndex: 1,
    alignItems: 'center',
    marginTop: 20, // Adjust to position text correctly
  },
  earnText: {
    color: '#FFD700', // Gold color
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  cashpointsText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  payShopText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButtonText: {
    color: '#009688', // Darker Teal
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainGridWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  mainGridRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  mainGridItem: { aspectRatio: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 8 },
  mainGridIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E0F8F7', // Lighter pastel blue/green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainGridItemText: { fontSize: 13, color: '#4A4A4A', textAlign: 'center', fontWeight: '600', lineHeight: 16 },
  upiIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // To push My QR to the right
    backgroundColor: '#E0F8F7', // Lighter pastel blue/green
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 20,
    alignSelf: 'center',
    width: screenWidth - 40,
  },
  upiIdTextLabel: { fontSize: 16, color: '#4A4A4A', fontWeight: '500' },
  myQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C5F0EE', // Slightly darker pastel for the button
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  myQrButtonText: {
    fontSize: 14,
    color: '#009688', // Darker Teal
    fontWeight: '600',
    marginLeft: 5,
  },
  pixelOfferContainerModified: { // Modified for carousel items
    backgroundColor: '#263238', // Dark background for the offer card
    borderRadius: 15,
    padding: 20,
    marginRight: 15, // Spacing between carousel items
    overflow: 'hidden', // To contain the card image
    position: 'relative',
    width: screenWidth * 0.8, // Make it a fixed width for carousel
    height: 180, // Adjust height as needed for the content
  },
  limitedTimeText: {
    color: '#FFD700', // Gold color for highlight
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pixelOfferTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pixelOfferSubtitle: {
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: 15,
  },
  applyNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
    zIndex: 1, // Ensure button is above image
  },
  applyNowText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pixelCardImage: {
    position: 'absolute',
    right: -20, // Adjust position as needed
    bottom: -10, // Adjust position as needed
    width: 150, // Adjust size as needed
    height: 120, // Adjust size as needed
    resizeMode: 'contain',
    opacity: 0.8,
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFF', // White for bottom nav
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
  navBarText: { fontSize: 12, color: '#757575', marginTop: 6, fontWeight: '500' }, // Grey for inactive
  navBarCenterPlaceholder: { width: 90 },
  floatingScannerButton: {
    position: 'absolute',
    bottom: 55,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#009688', // Darker Teal for floating button
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 11,
  },
  carouselContainer: {
    // This container now just wraps the FlatList
    marginHorizontal: 20,
    marginBottom: 2,
  },
  carouselContentContainer: {
    paddingLeft: 0,
    paddingTop:50, // No extra padding here as the item itself has margin
  },
});

export default Home;