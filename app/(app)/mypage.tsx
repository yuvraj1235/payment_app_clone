import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, signOut } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from 'expo-router';

const MyPage = () => {
  const navigation = useNavigation();
  const [userEmail, setUserEmail] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrFrame}>
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + (userEmail || 'default') }}
                style={styles.qrImage}
              />
              <Image
                source={require('../../assets/images/google.png')}
                style={styles.profilePicOverlay}
              />
            </View>
            <Text style={styles.usernameText}>{username}</Text>
            <View style={styles.upiIdContainer}>
              <Text style={styles.upiIdText}>{userEmail ? userEmail.split('@')[0] : 'notgirish'}@yobank</Text>
              <TouchableOpacity style={styles.copyIcon}>
                <MaterialIcons name="content-copy" size={16} color="#00ffe0" />
              </TouchableOpacity>
            </View>
            <Text style={styles.phoneNumberText}>📱 +91 98762 45123</Text>
          </View>

          <View style={styles.rewardsContainer}>
            <MaterialIcons name="emoji-events" size={24} color="#FFD700" style={styles.rewardIcon} />
            <Text style={styles.rewardsText}>🎉 ₹191 Rewards earned</Text>
          </View>
          <Text style={styles.inviteText}>🤝 Invite friends, both get ₹20</Text>

          <TouchableOpacity style={styles.bottomSectionPlaceholder} onPress={() => { navigation.navigate("Pin") }}>
            <MaterialIcons name="password" style={styles.method_Icon} size={50} color="#fff" />
            <Text style={styles.bottomSectionText}>🔐 SET PIN</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderColor: '#00ffe0',
    borderWidth: 2,
    shadowColor: '#00ffe0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  qrFrame: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  profilePicOverlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    zIndex: 1,
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
    color: '#00ffe0',
    marginRight: 8,
  },
  method_Icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    padding: 5,
  },
  phoneNumberText: {
    fontSize: 16,
    color: '#ccc',
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderColor: '#FFD700',
    borderWidth: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  rewardIcon: {
    marginRight: 10,
  },
  rewardsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  inviteText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  bottomSectionPlaceholder: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderColor: '#00ffe0',
    borderWidth: 2,
    shadowColor: '#00ffe0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSectionText: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MyPage;