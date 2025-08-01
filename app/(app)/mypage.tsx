import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, signOut } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

const MyPage = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the custom modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          const unsubscribe = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot(
              snapshot => {
                if (snapshot.exists()) {
                  const data = snapshot.data();
                  setUserEmail((data && data.email) || currentUser.email);
                  setUsername((data && data.username) || 'Add Name');
                  setError(null);
                } else {
                  setUserEmail(currentUser.email);
                  setUsername('Add Name');
                  setError('User profile data not found in Firestore.');
                }
                setLoading(false);
              },
              err => {
                console.error('Error listening to user data:', err);
                setError('Failed to load profile. Please check your network.');
                setLoading(false);
              }
            );

          return () => unsubscribe();
        } catch (e) {
          console.error('Error fetching user data:', e);
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
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    signOut(getAuth())
      .then(() => {
        console.log('User signed out!');
        router.replace('/(authentication)/login');
      })
      .catch(err => {
        console.error('Error signing out:', err);
        Alert.alert('Logout Error', 'Failed to log out. Please try again.');
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBackground}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <MaterialIcons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
         
        </View>

        <View style={styles.profilePhotoContainer}>
          <View style={styles.profilePhotoCircle}>
            <MaterialIcons name="person" size={80} color="#CCEEED" />
            <TouchableOpacity style={styles.addPhotoIconWrapper}>
              <MaterialIcons name="camera-alt" size={26} color="#009688" />
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
          <TouchableOpacity
            style={styles.infoCard}
            activeOpacity={0.8}
            onPress={() => router.push('/pin')}
          >
            <MaterialIcons name="password" size={26} color="#004D40" style={styles.infoCardIcon} />
            <Text style={styles.infoCardText}>Set PIN</Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={26}
              color="#78909C"
              style={styles.infoCardArrow}
            />
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <MaterialIcons
              name="person-outline"
              size={26}
              color="#004D40"
              style={styles.infoCardIcon}
            />
            <Text style={styles.infoCardText}>{username}</Text>
            {username === 'Add Name' && (
              <TouchableOpacity
                onPress={() => console.log('Navigate to Add Name')}
                style={styles.addNameButton}
                activeOpacity={0.8}
              >
                <Text style={styles.addNameButtonText}>Add Name</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons
              name="phone-iphone"
              size={26}
              color="#004D40"
              style={styles.infoCardIcon}
            />
            <Text style={styles.infoCardText}>+91 9064712234</Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons
              name="email-outline"
              size={26}
              color="#004D40"
              style={styles.infoCardIcon}
            />
            <Text style={styles.infoCardText}>
              {userEmail || 'Enter your email ID here'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.infoCard} activeOpacity={0.8}>
            <MaterialIcons name="logout" size={26} color="#004D40" style={styles.infoCardIcon} />
            <Text style={styles.infoCardText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowLogoutModal(false);
                  confirmLogout();
                }}
              >
                <Text style={styles.modalButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2F1' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#00695C' },
  topBackground: {
    width: '100%',
    height: 280,
    backgroundColor: '#009688',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 50,
  },
  header: {
    flexDirection: 'row',
    // justifyContent: ,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerIcon: { padding: 8 },
  headerTitle: { paddingLeft:90,fontSize: 24, fontWeight: 'bold', color: '#FFF', },
  profilePhotoContainer: { alignItems: 'center', marginTop: 20 },
  profilePhotoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#CCEEED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#80CBC4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  addPhotoIconWrapper: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B2DFDB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  addPhotoText: { fontSize: 18, color: '#E0F2F1', marginTop: 12, fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderRadius: 15, marginHorizontal: 20, marginTop: -50, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#B2DFDB' },
  errorText: { color: '#E57373', fontSize: 16, textAlign: 'center', marginBottom: 15 },
  retryButton: {
    backgroundColor: '#009688',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  retryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: -50,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingTop: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 }, // Shadow going upwards
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 25,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Very light grey for a subtle card border
  },
  infoCardIcon: { marginRight: 20 },
  infoCardText: { flex: 1, fontSize: 18, color: '#004D40', fontWeight: '500' },
  infoCardArrow: { marginLeft: 15 },
  addNameButton: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#E8F5E9', // Lighter green for button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addNameButtonText: { color: '#00695C', fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#00695C',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009688',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalCancelButton: {
    backgroundColor: '#E0E0E0',
    shadowColor: '#E0E0E0',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyPage;
