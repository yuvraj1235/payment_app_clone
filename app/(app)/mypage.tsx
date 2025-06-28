import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, signOut } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width; // still unused, but kept in case you need it

const MyPage = () => {
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
          const unsubscribe = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot(
              snapshot => {
                if (snapshot.exists) {
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
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            signOut(getAuth())
              .then(() => {
                console.log('User signed out!');
                router.replace('/(authentication)/login'); // send them to login screen
              })
              .catch(err => {
                console.error('Error signing out:', err);
                Alert.alert('Logout Error', 'Failed to log out. Please try again.');
              });
          },
        },
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
      {/* Top Background */}
      <View style={styles.topBackground}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <MaterialIcons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="help-outline" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Photo */}
        <View style={styles.profilePhotoContainer}>
          <View style={styles.profilePhotoCircle}>
            <MaterialIcons name="person" size={80} color="#BFDFFF" />
            <TouchableOpacity style={styles.addPhotoIconWrapper}>
              <MaterialIcons name="camera-alt" size={26} color="#1A73E8" />
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
          {/* Set PIN */}
          <TouchableOpacity
            style={styles.infoCard}
            activeOpacity={0.8}
            onPress={() => router.push('/pin')}
          >
            <MaterialIcons name="password" size={26} color="#4A4A4A" style={styles.infoCardIcon} />
            <Text style={styles.infoCardText}>Set PIN</Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={26}
              color="#B0B0B0"
              style={styles.infoCardArrow}
            />
          </TouchableOpacity>

          {/* User Name */}
          <View style={styles.infoCard}>
            <MaterialIcons
              name="person-outline"
              size={26}
              color="#4A4A4A"
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

          {/* Phone Number */}
          <View style={styles.infoCard}>
            <MaterialIcons
              name="phone-iphone"
              size={26}
              color="#4A4A4A"
              style={styles.infoCardIcon}
            />
            <Text style={styles.infoCardText}>+91 9064712234</Text>
          </View>

          {/* Email */}
          <View style={styles.infoCard}>
            <MaterialIcons
              name="email-outline"
              size={26}
              color="#4A4A4A"
              style={styles.infoCardIcon}
            />
            <Text style={styles.infoCardText}>
              {userEmail || 'Enter your email ID here'}
            </Text>
          </View>

          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.infoCard} activeOpacity={0.8}>
            <MaterialIcons name="logout" size={26} color="#4A4A4A" style={styles.infoCardIcon} />
            <Text style={styles.infoCardText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  topBackground: {
    width: '100%',
    height: 280,
    backgroundColor: '#3F51B5',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerIcon: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  profilePhotoContainer: { alignItems: 'center', marginTop: 20 },
  profilePhotoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EBF2FB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D4E2F6',
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
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  addPhotoText: { fontSize: 18, color: '#F0F0F0', marginTop: 12, fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 15 },
  retryButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
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
  },
  infoCardIcon: { marginRight: 20 },
  infoCardText: { flex: 1, fontSize: 18, color: '#333', fontWeight: '500' },
  infoCardArrow: { marginLeft: 15 },
  addNameButton: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#E0F0FF',
  },
  addNameButtonText: { color: '#1A73E8', fontWeight: '700', fontSize: 15 },
});

export default MyPage;
