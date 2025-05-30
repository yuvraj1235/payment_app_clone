// app/Camera.js
import React, { useState } from 'react'; // Corrected React import
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button, // Still useful for initial permission request UI
  Alert,
  Platform,
  Linking, // <-- Correctly imported Linking
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Camera = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState('off'); // State for flashlight

  // --- Permission Handling ---
  if (!permission) {
    // Permission hasn't been asked yet
    return <View style={styles.permissionContainer} />;
  }

  if (!permission.granted) {
    // Permission denied
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
        {/* Optional: Add a button to go to settings if permission is denied */}
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
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    // In a real app, you'd navigate or show a custom modal here
    Alert.alert(`QR Code Scanned!`, `Type: ${type}\nData: ${data}`, [
      { text: 'OK', onPress: () => setScanned(false) }, // Allows rescanning after OK
    ]);
  };

  // --- Flashlight Toggle ---
  const toggleFlash = () => {
    setFlashMode((current) => (current === 'off' ? 'torch' : 'off'));
  };

  // --- Bottom Action Button Handlers ---
  const handleShowMyQrCode = () => {
    console.log('Show my QR code pressed');
    Alert.alert('Feature Coming Soon', 'This will show your personal QR code.');
    // Example: navigation.navigate('MyQrCodeScreen');
  };

  const handleOpenGallery = () => {
    console.log('Open gallery pressed');
    Alert.alert(
      'Feature Coming Soon',
      'This will allow you to scan QR codes from images in your gallery.'
    );
    // Example: Use expo-image-picker to select an image and then process its QR code
  };

  return (
    <View style={styles.fullScreenContainer}>
      {/* Camera View */}
      <CameraView
        style={styles.cameraPreview}
        facing={'back'} // Always back camera as flip option is removed
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'], // Only scan QR codes
        }}
        enableTorch={flashMode === 'torch'} // Control flashlight
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
            <Text style={styles.scanSubText}>Scan a QR code to send money</Text>
          </View>

          {/* QR Code Scanning Frame */}
          <View style={styles.qrFrame}>
            {/* You can add an animated scanning line here using `Animated` API */}
          </View>

          {/* Bottom Action Bar */}
          <View style={styles.bottomActionBar}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleFlash}>
              <MaterialIcons
                name={flashMode === 'torch' ? 'flashlight-on' : 'flashlight-off'} // Updated icon name
                size={28}
                color="#E0E0E0"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonCenter} onPress={handleShowMyQrCode}>
              <Text style={styles.actionButtonText}>Show my QR code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenGallery}>
              <MaterialIcons name="image" size={28} color="#E0E0E0" />
            </TouchableOpacity>
          </View>

          {/* "Tap to Scan Again" button (appears after a scan) */}
          {scanned && (
            <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
              <Text style={styles.scanAgainButtonText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Match overall app background
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
    backgroundColor: '#66d9ef', // Your accent color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 10,
  },
  permissionButtonText: {
    color: '#000', // Black text for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888', // Subtle border
    marginTop: 5,
  },
  permissionButtonTextSecondary: {
    color: '#888', // Light gray text
    fontSize: 16,
  },
  cameraPreview: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darker semi-transparent overlay
    justifyContent: 'space-between', // Distribute content vertically
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60, // Adjust for status bar/notch
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // More bottom padding for iOS notch
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'flex-start', // Align close button to the left
  },
  closeButton: {
    padding: 10, // Make touch target larger
    backgroundColor: 'rgba(255,255,255,0.15)', // Subtle background for the 'X'
    borderRadius: 20,
  },
  scanTextContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  scanText: {
    fontSize: 22, // Slightly adjusted font size
    fontWeight: 'bold',
    color: '#E0E0E0', // Light text color
  },
  scanSubText: {
    fontSize: 15, // Slightly adjusted font size
    color: '#B0B0B0', // Slightly lighter gray than #888
    marginTop: 5,
  },
  qrFrame: {
    width: 260, // Slightly larger frame
    height: 260,
    borderWidth: 2,
    borderColor: '#FFFFFF', // White border for clearer distinction
    borderRadius: 15, // Rounded corners for the frame
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Crucial for any scanning line animation
    backgroundColor: 'rgba(255,255,255,0.05)', // Very subtle inner background
    marginTop: 30, // Space from text
  },
  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10, // Reduced horizontal padding for buttons
    marginTop: 'auto', // Push to bottom
    marginBottom: 20, // Space between bottom bar and scan again button
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(40, 40, 40, 0.7)', // Dark semi-transparent background
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 55, // Ensure icons have enough space
  },
  actionButtonCenter: {
    backgroundColor: 'rgba(40, 40, 40, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20, // More horizontal padding for text button
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
    backgroundColor: '#66d9ef', // Your accent color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    // Removed margin top/bottom as it's now handled by overlay's `justifyContent` and `paddingBottom`
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