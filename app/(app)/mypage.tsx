import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, signOut } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // For icons like back, share, more_vert, copy
import { useNavigation } from 'expo-router';

const MyPage = () => {
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
          // Listen for real-time updates to the user document
          const subscriber = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot(documentSnapshot => {
              if (documentSnapshot.exists()) {
                const userData = documentSnapshot.data();
                setUserEmail((userData && userData.email) || currentUser.email);
                setUsername((userData && userData.username) || 'N/A');
                setError(null);
              } else {
                setUserEmail(currentUser.email);
                setUsername('User');
                setError('User profile data not found in Firestore.');
              }
              setLoading(false);
            }, error => {
              console.error("Error listening to user data:", error);
              setError('Failed to load profile. Please check your network.');
              setLoading(false);
            });

          // Unsubscribe on unmount
          return () => subscriber();

        } catch (e) {
          console.error("Error fetching user data:", e);
          setError('Failed to load profile. Please try again.');
          setLoading(false);
        }
      } else {
        // No user logged in
        setLoading(false);
        setError('No user is currently logged in.');
      }
    };

    fetchUserData();
  }, []);
  const handleLogout = () => {
    signOut(getAuth())
      .then(() => {
        console.log('User signed out!');

      })
      .catch((e) => {
        console.error('Error signing out:', e);
        Alert.alert('Logout Error', 'Failed to log out. Please try again.');
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#66d9ef" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="arrow-back" size={24} color="#E0E0E0" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="share" size={24} color="#E0E0E0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="more-vert" size={24} color="#E0E0E0" />
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true) /* Re-trigger fetch */}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* QR Code Section */}
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrFrame}>
              {/* Placeholder for QR Code image */}
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + (userEmail || 'default') }} // Example QR code generation
                style={styles.qrImage}
              />
              {/* Placeholder for user profile picture in the middle of QR */}
              <Image
                source={require('../../assets/images/google.png')} // Replace with actual user profile image logic
                style={styles.profilePicOverlay}
              />
            </View>
            <Text style={styles.usernameText}>{username}</Text>
            <View style={styles.upiIdContainer}>
              <Text style={styles.upiIdText}>{userEmail ? userEmail.split('@')[0] : 'notgirish'}@yobank</Text>
              <TouchableOpacity style={styles.copyIcon}>
                <MaterialIcons name="content-copy" size={16} color="#888" />
              </TouchableOpacity>
            </View>
            <Text style={styles.phoneNumberText}>+91 98762 45123</Text>
          </View>

          {/* Rewards Section */}
          <View style={styles.rewardsContainer}>
            <MaterialIcons name="emoji-events" size={24} color="#FFD700" style={styles.rewardIcon} />
            <Text style={styles.rewardsText}>₹191 Rewards earned</Text>
          </View>
          <Text style={styles.inviteText}>Invite friends, both of you get ₹20</Text>

          {/* Placeholder for "methods" or other sections */}
          <View style={styles.bottomSectionPlaceholder}>
            <TouchableOpacity style={styles.bottomSectionPlaceholder} onPress={()=>{navigation.navigate("Pin")}}>
            <MaterialIcons name="password" style={styles.method_Icon} size={50} color="white"/>
            <Text style={styles.bottomSectionText}>SET PIN</Text>
        </TouchableOpacity>
            {/* Additional content can go here */}
          </View>

          {/* Logout Button at the bottom or integrate into a settings menu */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark background matching your theme
    paddingHorizontal: 20,
    paddingTop: 50, // Adjust for status bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    color: '#E0E0E0',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#66d9ef',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 20,
  },
  qrCodeContainer: {
    backgroundColor: '#282828', // Dark card background for the QR section
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  qrFrame: {
    width: 200,
    height: 200,
    borderWidth: 4,
    borderColor: 'transparent', // Initially transparent, will be overlaid by corners
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6, // Slightly smaller radius than frame for QR code itself
  },
  profilePicOverlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#282828', // Matches container background
    zIndex: 1, // Ensures it's above the QR code
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 5,
  },
  upiIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  upiIdText: {
    fontSize: 16,
    color: '#888',
    marginRight: 8,
  },
  method_Icon:{
    alignItems:"center",
    justifyContent:"center",
  },
  copyIcon: {
    padding: 5,
  },
  phoneNumberText: {
    fontSize: 16,
    color: '#888',
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  rewardIcon: {
    marginRight: 10,
  },
  rewardsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for rewards
  },
  inviteText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  bottomSectionPlaceholder: {
    backgroundColor: '#282828',
    borderRadius: 16,
    padding: 20,
    minHeight: 100, // Just a placeholder height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomSectionText: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#4285F4', // Red for logout
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto', // Pushes the button to the bottom
    marginBottom: 20, // Some bottom padding
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MyPage;