// app/Home.js
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert, // Added for logout error
  TextInput
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router'; // Correct import for expo-router
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  LineChart
} from "react-native-chart-kit";
const screenWidth = Dimensions.get('window').width;

const Home = () => {
  const navigation = useNavigation();
  const [userUID, setUserUID] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState(null);
  const [showBalance, setShowBalance] = useState(true);

  // 1. Auth State Listener
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
      setLoadingAuth(false); // Auth state determined
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

  const handleLogout = () => {
    auth().signOut()
      .then(() => {
        console.log('User signed out from Home!');
      })
      .catch((e) => {
        console.error('Error signing out:', e);
        Alert.alert('Logout Error', 'Failed to log out. Please try again.');
      });
  };

  // Show a full screen loading indicator if authentication state is still being determined
  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#66d9ef" />
        <Text style={styles.loadingTextIndicator}>Loading user session...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Search Bar & Profile Icon */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput style={styles.searchText} placeholder='Search by contacts, bills'/>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('mypage')}>
          <MaterialIcons name="person" size={40} color="#888" style={styles.profileIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          {loadingBalance ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.balanceRow}>
              {showBalance ? (
                <Text style={styles.balanceAmount}>₹{balance !== null ? balance.toFixed(2) : '0.00'}</Text>
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
       
        </View>

        {/* --- Central QR Scanner Icon --- */}
        <View style={styles.scannerIconWrapper}>
          <TouchableOpacity style={styles.scannerIcon} onPress={() => navigation.navigate("Camera")}>
            <MaterialIcons name="qr-code-2" size={40} color="black" />
          </TouchableOpacity>
        </View>

        {/* Grid Icons Section */}
        <View style={styles.gridIconsContainer}>
          <TouchableOpacity style={styles.gridIconButton} onPress={() => navigation.navigate('Payment')}>
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
          {Array(5).fill(0).map((_, i) => (
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
    height: 40,
    width: 40,
    color:'white'
  },
  balanceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
    color: '#888',
    fontSize: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  loginButton: {
    backgroundColor: '#66d9ef',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
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
    // This calculation is a bit tricky with absolute positioning and rotation.
    // Adjust based on your exact layout needs.
    // For now, it's a rough approximation for placement.
    left: screenWidth * 0.95 * 0.8 * 0.95, // Simplified to place it generally.
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#75B6E4',
    zIndex: 2,
  },
  scannerIconWrapper: {
    position: 'absolute',
    right: 10,
    top: 180, // Adjust this top value to position it relative to the balance container
    zIndex: 3, // Ensures it's above other elements
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
    width: '23%', // Roughly 4 icons per row
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
    paddingBottom: 5, // For notch devices
  },
  navItem: {
    flex: 1, // Distribute space evenly
    alignItems: 'center',
    paddingVertical: 5,
  }
});

export default Home;