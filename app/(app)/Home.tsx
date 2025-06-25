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
  StatusBar, // For status bar height calculation
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import messaging from '@react-native-firebase/messaging';

// Define the RootStackParamList type, ensuring it matches your actual navigation setup
type RootStackParamList = {
  navigate: (screen: string, params?: object) => void;
  Camera: undefined; // For Scan any QR
  Payment: { recipientUid: string }; // For Pay Anyone (example)
  BankTransfer: undefined;
  CheckBalance: undefined;
  Split: undefined;
  history: undefined;
  PayZappWallet: undefined;
  PassbookAndInsights: undefined;
  contact: undefined;
  Request:undefined;
};

const screenWidth = Dimensions.get('window').width;
// Get actual status bar height for precise positioning on different devices
const statusBarHeight = StatusBar.currentHeight || 0;

const Home = () => {
  const navigation = useNavigation<RootStackParamList>();
  const [userUID, setUserUID] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Constants for layout defined unconditionally
  const gridContainerHorizontalPadding = 20; // Padding for the container holding all grid rows
  const itemMarginHorizontal = 8; // Margin between individual grid items

  // Calculate item width dynamically
  // Ensures 4 items fit per row with specified margins and container padding.
  // We have 4 items, meaning 3 spaces between them + 2 spaces at the ends (total 4*marginHorizontal)
  const calculatedItemWidth = (screenWidth - (2 * gridContainerHorizontalPadding) - (4 * itemMarginHorizontal)) / 4;


  useEffect(() => {
    const setupFCM = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('Notification permission not granted');
          return;
        }

        const token = await messaging().getToken();
        console.log('✅ FCM Token:', token);

        const currentUser = auth().currentUser;
        if (currentUser) {
          await firestore().collection('users').doc(currentUser.uid).update({
            fcmToken: token,
          });
          console.log('✅ Token saved to Firestore');
        }
      } catch (error) {
        console.error('❌ FCM setup failed:', error);
      }
    };

    setupFCM();
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
      setLoadingAuth(false);
    });
    return subscriber;
  }, []);

  const fetchUserBalance = async () => {
    if (userUID) {
      setLoadingBalance(true);
      setError(null);
      try {
        const doc = await firestore().collection('users').doc(userUID).get();
        if (doc.exists()) {
          const data = doc.data();
          setBalance(data?.balance?.toString() || '0');
        } else {
          setBalance('0');
        }
      } catch (e) {
        console.error(e);
        setError('Failed to fetch balance');
        setBalance(null);
      } finally {
        setLoadingBalance(false);
      }
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

  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingTextIndicator}>Loading user session...</Text>
      </View>
    );
  }

  // Define the grid items to render dynamically with potential line breaks in labels
  const gridItems = [
    { name: 'Scan any QR', icon: 'qr-code-scanner', screen: 'Camera' },
    { name: 'Pay Anyone', icon: 'payments', screen: 'contact' },
    { name: 'Bank Transfer', icon: 'account-balance', screen: 'BankTransfer' },
    { name: 'Check Balance', icon: 'account-balance-wallet', screen: 'history' },
    { name: 'Bill &\nRecharges', icon: 'receipt_long', screen: 'Split' },
    { name: 'Offers &\nCashpoints', icon: 'local-offer', screen: 'Request' },
    { name: 'PayZapp\nWallet', icon: 'wallet', screen: 'PayZappWallet' },
    { name: 'Passbook &\nInsights', icon: 'book', screen: 'PassbookAndInsights' },
  ];

  const firstRowItems = gridItems.slice(0, 4);
  const secondRowItems = gridItems.slice(4, 8);

  return (
    <View style={styles.container}>
      {/* Top Banner/Header Area with blue background and shapes */}
      <View style={styles.topBannerContainer}>
        {/* Top Icons (Person and Notification) */}
        <View style={styles.topIconsRow}>
          <TouchableOpacity onPress={() => navigation.navigate('mypage')} style={styles.topIcon}>
            <MaterialIcons name="person" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Notifications')} style={styles.topIcon}>
            <MaterialIcons name="notifications" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* PayZapp Logo and Tagline */}
        <Image
          source={require('../../assets/images/background.jpg')} // Correct PayZapp logo path
          style={styles.payzappBannerLogo}
          resizeMode='cover'
        />

        {/* Placeholder for the subtle background shapes/clouds (can use ImageBackground or SVG if needed) */}
        {/* <Image source={require('../../assets/images/banner_shapes.png')} style={styles.bannerShapes} /> */}
      </View>

      <ScrollView
        style={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A0A0A0" />
        }
        // Add paddingBottom to account for fixed bottom navigation and floating button
        contentContainerStyle={{
          paddingBottom: styles.bottomNavBar.height + (styles.floatingScannerButton.height / 2) + 20,
        }}
      >
        {/* Main Grid Icons Container (wraps both rows and UPI ID) */}
        <View style={styles.mainGridWrapper}>
          {/* Main Grid Icons - First Row */}
          <View style={styles.mainGridRow}>
            {firstRowItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mainGridItem,
                  { width: calculatedItemWidth, marginHorizontal: itemMarginHorizontal / 2 },
                ]}
                onPress={() => navigation.navigate(item.screen as keyof RootStackParamList)}
              >
                <View style={styles.mainGridIconCircle}>
                  <MaterialIcons name={item.icon} size={40} color="#1A73E8" />
                </View>
                <Text style={styles.mainGridItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* UPI ID - Placed between rows as per image */}
          <View style={styles.upiIdContainer}>
            <MaterialIcons name="grid-on" size={24} color="#4A4A4A" style={styles.upiIdIcon} />
            <Text style={styles.upiIdText}>UPI ID: 8281908756@pz</Text>
          </View>

          {/* Main Grid Icons - Second Row */}
          <View style={styles.mainGridRow}>
            {secondRowItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mainGridItem,
                  { width: calculatedItemWidth, marginHorizontal: itemMarginHorizontal / 2 },
                ]}
                onPress={() => navigation.navigate(item.screen as keyof RootStackParamList)}
              >
                <View style={styles.mainGridIconCircle}>
                  <MaterialIcons name={item.icon} size={40} color="#1A73E8" />
                </View>
                <Text style={styles.mainGridItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Explore offers & merchants section */}
        <View style={styles.exploreOffersSection}>
          <Text style={styles.exploreOffersTitle}>Explore offers & merchants</Text>
          <TouchableOpacity onPress={() => console.log('View All Offers')}>
            <Text style={styles.exploreOffersViewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* This height ensures content can be scrolled if needed, effectively pushing the bottom up */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Navigation Bar with floating scanner */}
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
        <TouchableOpacity style={styles.navBarItem}>
          <MaterialIcons name="account-balance" size={32} color="#888" />
          <Text style={styles.navBarText}>Bank</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Scanner Button */}
      <TouchableOpacity
        style={styles.floatingScannerButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <MaterialIcons name="qr-code-scanner" size={45} color="white" />
      </TouchableOpacity>
    </View>
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
  loadingTextIndicator: {
    color: '#666',
    fontSize: 18,
    marginTop: 12,
  },
  topBannerContainer: {
    width: '100%',
    height: 250, // Fixed height for the banner area
    backgroundColor: '#E0F0FF', // The base light blue color of the banner
    borderBottomLeftRadius: 30, // Rounded bottom corners
    borderBottomRightRadius: 30, // Rounded bottom corners
    overflow: 'hidden', // Ensures any overflow from shapes is clipped
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop is handled by topIconsRow now for more precise control
    marginBottom: 20, // Space below the banner
  },
  topIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute', // Position absolute to place them within the banner but fixed at top
    top: statusBarHeight + 5, // Just below status bar
    paddingHorizontal: 28, // Matches the image's perceived padding
    zIndex: 1, // Ensure icons are above banner content
  },
  topIcon: {
    padding: 8, // Make touchable area larger
  },
  payzappBannerLogo: {
    width:400,
    height:300,
      marginTop: 30, // Pushed down from top icons
  },
  scrollViewContent: {
    flexGrow: 1, // Ensures ScrollView content can grow beyond screen height to enable scrolling
  },
  mainGridWrapper: {
    // This new wrapper controls the horizontal padding for the entire grid section
    // It's applied to the ScrollView content area, not the mainGridRow directly.
    paddingHorizontal: 20, // Applies uniform horizontal padding for the grid items and UPI ID
    marginBottom: 20, // Space below the entire grid section
  },
  mainGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute items evenly
    alignItems: 'flex-start',
    marginBottom: 15, // Space between rows (first row to UPI ID, or UPI ID to second row)
    // No horizontal padding here, it's on mainGridWrapper
  },
  mainGridItem: {
    // Width and marginHorizontal are now calculated and applied inline in JSX
    aspectRatio: 1, // Keep square aspect ratio
    alignItems: 'center',
    justifyContent: 'flex-start', // Align content to the top within the item
    paddingVertical: 8, // Add some vertical padding to item touch area
  },
  mainGridIconCircle: {
    width: 70, // Consistent size for icon circles
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EBF2FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // Space between icon circle and text
  },
  mainGridItemText: {
    fontSize: 13,
    color: '#4A4A4A',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16, // Adjusted line height for possible two lines of text
  },
  upiIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FB',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10, // Space above UPI ID from first row
    marginBottom: 20, // Space below UPI ID to second row
    alignSelf: 'center', // Center it within its parent
    width: screenWidth - (2 * 20), // Match width of the mainGridWrapper
  },
  upiIdIcon: {
    marginRight: 10,
    color: '#4A4A4A',
  },
  upiIdText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  exploreOffersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28, // Matches the topIconsRow padding
    marginBottom: 25, // Space below this section
    marginTop: 15, // Space above this section from the content above
  },
  exploreOffersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exploreOffersViewAll: {
    fontSize: 15,
    color: '#1A73E8',
    fontWeight: '600',
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 90,
    borderTopWidth: 1.5,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20, // For iPhone X/XR/etc. safe area
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Ensure it's on top of scrollable content
  },
  navBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  navBarText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    fontWeight: '500',
  },
  navBarCenterPlaceholder: {
    width: 90, // Space for the floating button
  },
  floatingScannerButton: {
    position: 'absolute',
    bottom: 55, // Adjust to float higher above the nav bar (90 height - 80/2 + 20 bottom padding = 55 approx)
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
    zIndex: 11, // Ensure it's on top of the nav bar
  },
});

export default Home;
