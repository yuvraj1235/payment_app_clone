import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, signOut } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from 'expo-router'; // Ensure this import is correct for your setup
import { SafeAreaView } from 'react-native-safe-area-context'; // Better for handling notches/status bars

const screenWidth = Dimensions.get('window').width;

const MyPage = () => {
  // This line (const navigation = useNavigation();) is pure JavaScript, not JSX.
  // The error "Text strings must be rendered within a <Text> component."
  // pointing here is highly unusual and often suggests a hidden character issue
  // or a very misleading error message from the JavaScript engine.
  const navigation = useNavigation(); 
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          const subscriber = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot(documentSnapshot => {
              if (documentSnapshot.exists) {
                const userData = documentSnapshot.data();
                setUserEmail((userData && userData.email) || currentUser.email);
                setUsername((userData && userData.username) || 'Add Name'); // Default to "Add Name"
                setError(null);
              } else {
                setUserEmail(currentUser.email);
                setUsername('Add Name'); // Default if no profile in Firestore
                setError('User profile data not found in Firestore.');
              }
              setLoading(false);
            }, snapshotError => {
              console.error("Error listening to user data:", snapshotError);
              setError('Failed to load profile. Please check your network.');
              setLoading(false);
            });

          return () => subscriber();

        } catch (e) {
          console.error("Error fetching user data:", e);
          setError('Failed to load profile. Please try again.');
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError('No user is currently logged in.');
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => {
            signOut(getAuth())
              .then(() => {
                console.log('User signed out!');
                // Navigate to a login/welcome screen after logout
                // Replace 'Login' with your actual login screen route name
                // navigation.navigate('Login');
              })
              .catch((e) => {
                console.error('Error signing out:', e);
                Alert.alert('Logout Error', 'Failed to log out. Please try again.');
              });
          }
        }
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Background Section (simulates gradient with solid color) */}
      <View style={styles.topBackground}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <MaterialIcons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="help-outline" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.profilePhotoContainer}>
          <View style={styles.profilePhotoCircle}>
            {/* Placeholder for profile image, or show actual image if available */}
            <MaterialIcons name="person" size={80} color="#BFDFFF" /> {/* Larger icon */}
            <TouchableOpacity style={styles.addPhotoIconWrapper}>
              <MaterialIcons name="camera-alt" size={26} color="#1A73E8" /> {/* Slightly larger icon */}
            </TouchableOpacity>
          </View>
          <Text style={styles.addPhotoText}>Add a photo</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contentArea}>
          {/* View QR Code Card */}
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.8}> {/* Increased activeOpacity */}
            <MaterialIcons name="qr-code-scanner" size={26} color="#4A4A4A" style={styles.infoCardIcon} /> {/* Larger icon */}
            <Text style={styles.infoCardText}>View QR code</Text>
            <MaterialIcons name="keyboard-arrow-right" size={26} color="#B0B0B0" style={styles.infoCardArrow} /> {/* Larger icon */}
          </TouchableOpacity>

          {/* User Name */}
          <View style={styles.infoCard}> {/* Changed to View as "Add Name" is inside */}
            <MaterialIcons name="person-outline" size={26} color="#4A4A4A" style={styles.infoCardIcon} /> {/* Larger icon */}
            <Text style={styles.infoCardText}>{username}</Text>
            {username === 'Add Name' && (
              <TouchableOpacity onPress={() => console.log('Navigate to Add Name')} style={styles.addNameButton} activeOpacity={0.8}>
                <Text style={styles.addNameButtonText}>Add Name</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.infoCard}>
            <MaterialIcons name="phone-iphone" size={26} color="#4A4A4A" style={styles.infoCardIcon} /> {/* Larger icon */}
            {/* Using a static number as it's not from Firebase data directly */}
            <Text style={styles.infoCardText}>+91 9064712234</Text>
          </View>

          {/* Email ID */}
          <View style={styles.infoCard}>
            <MaterialIcons name="email-outline" size={26} color="#4A4A4A" style={styles.infoCardIcon} /> {/* Larger icon */}
            <Text style={styles.infoCardText}>{userEmail || 'Enter your email ID here'}</Text>
          </View>

          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.infoCard} activeOpacity={0.8}>
            <MaterialIcons name="logout" size={26} color="#4A4A4A" style={styles.infoCardIcon} /> {/* Larger icon */}
            <Text style={styles.infoCardText}>Logout of your PayZapp account</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Slightly off-white background for softness
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8F8',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topBackground: {
    width: '100%',
    height: 280, // Increased height for more pronounced top section
    backgroundColor: '#3F51B5', // A deeper, more vibrant indigo blue
    // Using a single color to simulate the gradient as complex gradients require external libraries.
    // If you have `expo-linear-gradient` installed, you can replace this View with:
    // <LinearGradient colors={['#5C6BC0', '#886CE3']} style={styles.topBackground}>
    borderBottomLeftRadius: 40, // More pronounced curve
    borderBottomRightRadius: 40, // More pronounced curve
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25, // Increased horizontal padding
    paddingTop: 20, // More top padding for status bar and content
    paddingBottom: 30, // Push profile section further down
  },
  headerIcon: {
    padding: 8, // Larger touch area
  },
  headerTitle: {
    fontSize: 24, // Larger title
    fontWeight: 'bold', // Bolder title
    color: '#FFF',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginTop: 20, // Adjusted spacing from header
  },
  profilePhotoCircle: {
    width: 120, // Larger profile circle
    height: 120, // Larger profile circle
    borderRadius: 60,
    backgroundColor: '#EBF2FB', // Light blue-grey for the circle background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, // Thicker border
    borderColor: '#D4E2F6', // Subtle light blue border
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // More pronounced shadow for depth
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  addPhotoIconWrapper: {
    position: 'absolute',
    bottom: 5, // Slightly lifted from the bottom edge
    right: 5, // Slightly in from the right edge
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // More rounded for the icon wrapper
    width: 40, // Larger touchable area
    height: 40, // Larger touchable area
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  addPhotoText: {
    fontSize: 18, // Larger text
    color: '#F0F0F0', // Lighter grey for better contrast on blue
    marginTop: 12, // Increased margin
    fontWeight: '600', // Bolder text
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white for card background
    marginTop: -50, // Pull this section up significantly to overlap the gradient area
    borderTopLeftRadius: 40, // Match the curve of the top background
    borderTopRightRadius: 40, // Match the curve
    paddingHorizontal: 25, // Consistent padding for content
    paddingTop: 35, // More padding inside the white content area
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Pure white background for cards (cleaner)
    borderRadius: 20, // Even more rounded corners for cards
    paddingVertical: 22, // Increased padding
    paddingHorizontal: 25, // Increased padding
    marginBottom: 18, // More generous spacing between cards
    shadowColor: '#000', // Stronger, yet elegant shadow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1, // Adjusted opacity
    shadowRadius: 8, // Adjusted radius
    elevation: 6, // Android shadow
  },
  infoCardIcon: {
    marginRight: 20, // Increased spacing from icon to text
  },
  infoCardText: {
    flex: 1,
    fontSize: 18, // Larger text for main info
    color: '#333333',
    fontWeight: '500',
  },
  infoCardArrow: {
    marginLeft: 15, // Increased spacing
  },
  addNameButton: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#E0F0FF', // Light blue background for "Add Name"
  },
  addNameButtonText: {
    color: '#1A73E8',
    fontSize: 15,
    fontWeight: '700', // Bolder text
  },
});

export default MyPage;