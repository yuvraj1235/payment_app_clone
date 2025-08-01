import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Animated, Easing } from 'react-native';
import auth from '@react-native-firebase/auth';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';

const MyQRCode = () => {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        setUid(user.uid);
        // Start animations after UID is set
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setUid(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleShareQR = async () => {
    if (uid) {
      try {
        const result = await Share.share({
          message: `My Zapp UPI ID (UID): ${uid}\nScan this QR code to send me money effortlessly!`,
        });
        if (result.action === Share.sharedAction) {
          console.log('Shared successfully');
        } else if (result.action === Share.dismissedAction) {
          console.log('Share dismissed');
        }
      } catch (error: any) {
        console.error('Error sharing QR:', error.message);
        alert('Failed to share QR code.');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.loadingInfo}>Loading your Zapp QR Code...</Text>
      </View>
    );
  }

  if (!uid) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Oops! You're not logged in to view your QR code.</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Zapp QR Code</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Scan this code to pay me directly!</Text>

        <Animated.View style={[styles.qrContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={uid}
              size={220}
              backgroundColor="white"
              color="#000"
              // Add a logo if you have one
              // logo={{uri: 'URL_TO_YOUR_LOGO'}}
              // logoSize={50}
              // logoBackgroundColor='transparent'
            />
          </View>
          <Text style={styles.uidLabel}>Your Zapp ID: {uid}</Text>
        </Animated.View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShareQR}>
          <MaterialIcons name="share" size={24} color="#FFF" />
          <Text style={styles.shareButtonText}>Share My QR</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={20} color="#009688" />
          <Text style={styles.infoText}>
            This QR code is linked to your Zapp account. Anyone scanning it can send you money instantly.
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default MyQRCode;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0', // Light cream background from Home screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F5F0',
  },
  loadingInfo: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#B00020',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#009688',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#009688', // Darker Teal from Home banner
    paddingHorizontal: 15,
    paddingVertical: 15, // Adjusted padding for better look
    paddingTop: 45, // To account for SafeAreaView and status bar
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30, // Space below header
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A', // Similar to grid item text color
    marginBottom: 30,
    fontWeight: '500',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 30,
  },
  qrCodeWrapper: {
    // This wrapper is primarily for any future effects directly on the QR code,
    // currently it acts as a placeholder if you wanted padding around the QR code itself
    padding: 5,
    borderRadius: 10, // Slight rounding for the QR code area
    backgroundColor: 'white', // Ensure white background for QR
  },
  uidLabel: {
    marginTop: 20,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#009688', // Darker Teal
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0F8F7', // Lighter pastel blue/green from Home grid circle
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#009688',
  },
  infoText: {
    marginLeft: 10,
    color: '#4A4A4A',
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
});