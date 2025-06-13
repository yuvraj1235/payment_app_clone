import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Define types for navigation parameters
type RootStackParamList = {
  mypage: undefined;
  Camera: undefined;
  Payment: { recipientUid: string };  // Expect recipientUid to be a string for the 'Payment' screen
};

const Camera = () => {
  const navigation = useNavigation(); // Correctly typed navigation
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState('off');

  // --- Permission Handling ---
  if (!permission) {
    return <View style={styles.permissionContainer} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionMessage}>
          We need your permission to access the camera for QR scanning.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permissionButtonSecondary}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonTextSecondary}>Go Back</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.permissionButtonSecondary}
            onPress={() => Linking.openURL('app-settings:')}
          >
            <Text style={styles.permissionButtonTextSecondary}>Open App Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // --- Barcode Scanning Logic ---
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true); // Prevent further scans until reset or navigated
    console.log(`Scanned QR Code: Type: ${type}, Data: ${data}`);

    // Assuming the 'data' from the QR code is the recipient's User ID (UID)
    navigation.navigate('Payment', { recipientUid: data });  // Pass recipientUid correctly

    // Optional: You can remove this Alert if you want a seamless transition
    // Alert.alert(`QR Scanned!`, `Recipient ID: ${data}`, [{ text: "OK" }]);
  };

  // --- Flashlight Toggle ---
  const toggleFlash = () => {
    setFlashMode((current) => (current === 'off' ? 'torch' : 'off'));
  };

  // --- Bottom Action Button Handlers ---
  const handleShowMyQrCode = () => {
    console.log('Show my QR code pressed');
    Alert.alert('Feature Coming Soon', 'This will show your personal QR code.');
    // In a real app, you'd navigate to a screen that displays the current user's UID as a QR code.
    // Example: navigation.navigate('MyQrCodeScreen', { myUid: auth().currentUser.uid });
  };

  return (
    <View style={styles.fullScreenContainer}>
      {/* Camera View */}
      <CameraView
        style={styles.cameraPreview}
        facing={'back'}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'], // Only scan QR codes
        }}
        enableTorch={flashMode === 'torch'}
      >
        {/* Overlay for Header and Scanning Frame */}
        <View style={styles.overlay}>
          {/* Header with Close Button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <MaterialIcons name="close" size={28} color="#E0E0E0" />
            </TouchableOpacity>
          </View>

          {/* Scan Text */}
          <View style={styles.scanTextContainer}>
            <Text style={styles.scanText}>Scan a QR code</Text>
          </View>

          {/* QR Code Scanning Frame */}
          <View style={styles.qrFrame}>
            {/* You can add an animated scanning line here using `Animated` API */}
          </View>

          {/* Bottom Action Bar */}
          <View style={styles.bottomActionBar}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleFlash}>
              <MaterialIcons
                name={flashMode === 'torch' ? 'flashlight-on' : 'flashlight-off'}
                size={28}
                color="#E0E0E0"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonCenter} onPress={handleShowMyQrCode}>
              <Text style={styles.actionButtonText}>Show my QR code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
      {scanned && (
        <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
          <Text style={styles.scanAgainButtonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  permissionMessage: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#66d9ef',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 10,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888',
    marginTop: 5,
  },
  permissionButtonTextSecondary: {
    color: '#888',
    fontSize: 16,
  },
  cameraPreview: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  scanTextContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  scanText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  scanSubText: {
    fontSize: 15,
    color: '#B0B0B0',
    marginTop: 5,
  },
  qrFrame: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 30,
  },
  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 'auto',
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(40, 40, 40, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 55,
  },
  actionButtonCenter: {
    backgroundColor: 'rgba(40, 40, 40, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scanAgainButton: {
    backgroundColor: '#66d9ef',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  scanAgainButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Camera;
