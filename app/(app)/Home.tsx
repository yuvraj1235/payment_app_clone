import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Dimensions } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const screenWidth = Dimensions.get('window').width;

const Home = () => {
  const navigation = useNavigation();
  const [userUID, setUserUID] = useState(null);
  const [balance, setBalance] = useState(null); // Initialize as null or 0 to represent absence of data
  const [loadingAuth, setLoadingAuth] = useState(true); // State for authentication loading
  const [loadingBalance, setLoadingBalance] = useState(false); // State for balance loading
  const [error, setError] = useState(null); // State for potential errors during data fetch

  const [showBalance, setShowBalance] = useState(true); // State for toggling balance visibility

  // 1. Auth State Listener (runs once on mount and on auth state changes)
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
      setLoadingAuth(false); // Auth state determined
      if (user) {
        console.log('Auth state changed. Current User UID:', user.uid);
      } else {
        console.log('Auth state changed. No user currently signed in.');
      }
    });
    return subscriber; // Unsubscribe on unmount
  }, []);

  // 2. Fetch Balance (runs when userUID changes from null to a valid UID)
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (userUID) { // Only attempt to fetch if userUID is not null
        setLoadingBalance(true);
        setError(null); // Clear previous errors
        try {
          console.log(`Fetching balance for user: ${userUID}`);
          const documentSnapshot = await firestore().collection('users').doc(userUID).get();

          if (documentSnapshot.exists) {
            const userData = documentSnapshot.data();
            console.log('User data from Firestore: ', userData);
            setBalance(userData.balance || 0); // Use 0 as default if balance field is missing
          } else {
            console.log('User document does NOT exist in Firestore for UID:', userUID);
            setBalance(0); // Default balance for users without a document
          }
        } catch (e) {
          console.error('Error fetching user data from Firestore:', e);
          setError('Failed to load balance. Please check your network or try again.');
          setBalance(null); // Reset balance on error
        } finally {
          setLoadingBalance(false);
        }
      } else if (userUID === null && !loadingAuth) {
        // If no user is signed in and auth loading is complete
        setBalance(null); // Ensure balance is cleared if user logs out
        setLoadingBalance(false);
      }
    };

    fetchUserBalance(); // Call the fetch function
  }, [userUID, loadingAuth]); // Dependency array: re-run when userUID or loadingAuth changes

  const toggleBalanceVisibility = () => {
    setShowBalance(prev => !prev);
  };

  // Show a full screen loading indicator if authentication state is still being determined
  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingTextIndicator}>Loading user session...</Text>
      </View>
    );
  }

  // If no userUID and auth loading is done, means no one is logged in
  if (!userUID && !loadingAuth) {
    // You might want to redirect to a login screen here
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please log in to view your Home page.</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Search Bar & Profile Icon */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
          <Text style={styles.searchText}>Search by contacts, bills</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('mypage')}>
          <Image style={styles.profileIcon} source={require('../../assets/images/google.png')} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          {loadingBalance ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.balanceRow}>
              {showBalance ? (
                <Text style={styles.balanceAmount}>₹{balance !== null ? balance : '0.00'}</Text>
              ) : (
                <Text style={styles.balanceObscured}>₹ ******.**</Text>
              )}
              <TouchableOpacity onPress={toggleBalanceVisibility} style={styles.eyeIconWrapper}>
                <MaterialIcons
                  name={showBalance ? "remove-red-eye" : "visibility-off"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.updatedText}>Updated 2 minutes ago</Text>
        </View>

        {/* Graph Area Placeholder */}
        <View style={styles.graphAreaPlaceholder}>
          <View style={styles.graphPlaceholderLine} />
          <View style={styles.graphDot} />
        </View>

        {/* --- Central QR Scanner Icon --- */}
        <View style={styles.scannerIconWrapper}>
          <TouchableOpacity style={styles.scannerIcon} onPress={() => navigation.navigate("Camera")}>
            <MaterialIcons name="qr-code-2" size={40} color="black" />
          </TouchableOpacity>
        </View>

        {/* Grid Icons Section */}
        <View style={styles.gridIconsContainer}>
          <TouchableOpacity style={styles.gridIconButton}>
            <MaterialIcons name="account-balance" size={30} color="white" />
            <Text style={styles.gridIconText}>Bank transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridIconButton}>
            <MaterialIcons name="receipt" size={30} color="white" />
            <Text style={styles.gridIconText}>Pay bills</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridIconButton}>
            <MaterialIcons name="mobile-friendly" size={30} color="white" />
            <Text style={styles.gridIconText}>Mobile recharge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridIconButton}>
            <MaterialIcons name="history" size={30} color="white" />
            <Text style={styles.gridIconText}>Transaction history</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.upiIdText}>UPI ID: notgirish@yobank</Text>

        {/* People Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {/* Placeholder for people circles */}
          {Array(8).fill(0).map((_, i) => (
            <View key={i} style={styles.personCircle}>
              <Image style={styles.personImage} source={require('../../assets/images/google.png')} />
            </View>
          ))}
        </ScrollView>

        {/* Businesses Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Businesses</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {/* Placeholder for business circles */}
          {Array(6).fill(0).map((_, i) => (
            <View key={i} style={styles.businessCircle}>
              <Image style={styles.businessImage} source={require('../../assets/images/google.png')} />
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} /> {/* Spacer at the bottom */}
      </ScrollView>

      {/* Fixed Bottom Navigation (Example) */}
      <View style={styles.bottomNav}>
        <MaterialIcons name="account-balance" size={24} color="#888" />
        <MaterialIcons name="check-box" size={24} color="#888" />
        <MaterialIcons name="history" size={24} color="#888" />
        <MaterialIcons name="account-circle" size={24} color="#888" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark background for the whole screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingTextIndicator: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  scrollViewContent: {
    flex: 1, // Allows scrolling
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 15,
    backgroundColor: '#1E1E1E',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828', // Darker gray for search bar background
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
    marginRight: 15,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchText: {
    color: '#888', // Light gray text
    fontSize: 16,
  },
  profileIcon: {
    borderRadius: 20, // Smaller for the top-right
    height: 40,
    width: 40,
  },
  balanceContainer: {
    flexDirection: 'column', // Changed to column to stack balance and updated text
    alignItems: 'flex-start', // Align items to the start
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5, // Space between balance and updated text
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 28,
    marginRight: 10,
  },
  balanceObscured: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 28,
    marginRight: 10,
  },
  eyeIconWrapper: {
    padding: 5,
  },
  updatedText: {
    color: '#888', // Lighter gray
    fontSize: 12,
    // marginLeft: 10, // Removed as it's now stacked vertically
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  loginButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // --- Graph Area Placeholder Styles ---
  graphAreaPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#282828',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  graphPlaceholderLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(75, 192, 192, 0.7)',
    bottom: 30,
    left: '5%',
    transform: [{ rotateZ: '-5deg' }],
  },
  graphDot: {
    position: 'absolute',
    top: 50,
    left: screenWidth * 0.95 * 0.8 * 0.95,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#75B6E4',
    zIndex: 2,
  },
  // --- End Graph Area Placeholder Styles ---

  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingBottom: 40,
    backgroundColor: '#282828',
    borderRadius: 15,
    paddingVertical: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  scannerIconWrapper: {
    position: 'absolute',
    right: 10,
    top: 180,
    zIndex: 3,
  },
  scannerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  gridIconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: '#282828',
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 20,
  },
  gridIconButton: {
    alignItems: 'center',
    width: '23%',
    paddingVertical: 10,
  },
  gridIconText: {
    color: 'white',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },
  upiIdText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#75B6E4',
    fontSize: 14,
  },
  horizontalScroll: {
    marginBottom: 20,
  },
  personCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  personImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  businessCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  businessImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#282828',
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 5,
  }
});

export default Home;